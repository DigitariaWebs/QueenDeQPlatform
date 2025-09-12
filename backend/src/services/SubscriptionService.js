import {
  User,
  SubscriptionStatusChange,
  PendingUserUpdate,
} from "../models/index.js";
import mongoose from "mongoose";
import Stripe from "stripe";

class SubscriptionService {
  // Handle Stripe webhook events
  static async handleStripeWebhook(event) {
    try {
      const { type, data } = event;
      const object = data.object;

      console.log(`Processing Stripe webhook: ${type}`);

      switch (type) {
        case "checkout.session.completed":
          await this.handleCheckoutSessionCompleted(object, event.id);
          break;

        case "customer.subscription.created":
        case "customer.subscription.updated":
          await this.handleSubscriptionChange(
            object,
            "stripe_webhook",
            event.id
          );
          break;

        case "customer.subscription.deleted":
          await this.handleSubscriptionCancellation(object, event.id);
          break;

        case "invoice.payment_succeeded":
          await this.handlePaymentSuccess(object);
          break;

        case "invoice.payment_failed":
          await this.handlePaymentFailure(object);
          break;

        case "customer.created":
          await this.handleCustomerCreated(object);
          break;

        default:
          console.log(`Unhandled Stripe webhook event: ${type}`);
      }

      return { processed: true };
    } catch (error) {
      console.error("Error processing Stripe webhook:", error);
      throw error;
    }
  }

  // Handle subscription creation/updates
  static async handleSubscriptionChange(
    subscription,
    reason = "stripe_webhook",
    eventId = null
  ) {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // Find user by Stripe customer ID
        let user = await User.findOne({
          stripeCustomerId: subscription.customer,
        }).session(session);

        if (!user) {
          // If not found, try multiple ways to get customer email
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
          let customerEmail = null;

          try {
            // Try 1: Get customer directly
            const customer = await stripe.customers.retrieve(
              subscription.customer
            );
            customerEmail = customer.email;
            console.log(`Found customer email from Stripe: ${customerEmail}`);

            if (customer.email) {
              user = await User.findOne({ email: customer.email }).session(
                session
              );
              if (user) {
                // Update with stripeCustomerId
                user.stripeCustomerId = subscription.customer;
              }
            }
          } catch (stripeError) {
            console.warn(
              `Could not retrieve Stripe customer ${subscription.customer}:`,
              stripeError.message
            );

            // Try 2: Get email from latest invoice
            try {
              if (subscription.latest_invoice) {
                console.log(
                  `Trying to get email from invoice: ${subscription.latest_invoice}`
                );
                const invoice = await stripe.invoices.retrieve(
                  subscription.latest_invoice
                );
                customerEmail = invoice.customer_email;
                console.log(
                  `Found customer email from invoice: ${customerEmail}`
                );

                if (customerEmail) {
                  user = await User.findOne({ email: customerEmail }).session(
                    session
                  );
                  if (user) {
                    user.stripeCustomerId = subscription.customer;
                    console.log(
                      `Matched user by invoice email: ${customerEmail}`
                    );
                  }
                }
              } else {
                console.log(`No latest_invoice found in subscription`);
              }
            } catch (invoiceError) {
              console.warn(
                `Could not retrieve invoice ${subscription.latest_invoice}:`,
                invoiceError.message
              );

              // Try 3: Get email from subscription metadata (if Mighty Networks includes it)
              try {
                if (
                  subscription.metadata &&
                  subscription.metadata.customer_email
                ) {
                  customerEmail = subscription.metadata.customer_email;
                  console.log(
                    `Found customer email from subscription metadata: ${customerEmail}`
                  );

                  if (customerEmail) {
                    user = await User.findOne({ email: customerEmail }).session(
                      session
                    );
                    if (user) {
                      user.stripeCustomerId = subscription.customer;
                      console.log(
                        `Matched user by metadata email: ${customerEmail}`
                      );
                    }
                  }
                }
              } catch (metadataError) {
                console.warn(
                  `Error processing subscription metadata:`,
                  metadataError.message
                );
              }
            }
          }

          // If still no user found, create a pending update and skip user update
          if (!user) {
            console.log(
              `User not found for customer ${subscription.customer}, will create pending update only`
            );
            console.log(
              `Customer email resolved as: ${customerEmail || "NO EMAIL FOUND"}`
            );
            console.log(`Subscription details:`, {
              id: subscription.id,
              status: subscription.status,
              latest_invoice: subscription.latest_invoice,
              current_period_end: subscription.current_period_end,
              metadata: subscription.metadata,
            });

            // Create pending update without user
            const newRole = this.determineRoleFromSubscription(subscription);
            console.log(
              `Determined role: ${newRole} for subscription ${subscription.id}`
            );

            // Safe date conversion
            const endDate = subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : null;

            await PendingUserUpdate.create({
              email:
                customerEmail || `stripe_customer_${subscription.customer}`, // Fallback email
              stripeCustomerId: subscription.customer,
              pendingRole: newRole,
              stripeSubscriptionId: subscription.id,
              subscriptionStatus: subscription.status,
              subscriptionEndDate: endDate,
              sourceEvent:
                reason === "stripe_webhook"
                  ? "customer.subscription.updated"
                  : "customer.subscription.created",
              stripeEventId: eventId,
              metadata: {
                stripePriceId: subscription.items.data[0]?.price?.id,
                stripeProductId: subscription.items.data[0]?.price?.product,
                amount: subscription.items.data[0]?.price?.unit_amount || 0,
                currency: subscription.currency || "usd",
              },
            });

            console.log(
              `Created pending update for customer ${subscription.customer}`
            );
            return; // Exit early, no user to update
          }
        }

        // Determine new role based on subscription
        const newRole = this.determineRoleFromSubscription(subscription);
        const previousRole = user.role;

        // Safe date conversion
        const endDate = subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000)
          : null;

        // Update user subscription info
        user.role = newRole;
        user.stripeSubscriptionId = subscription.id;
        user.subscriptionStatus = subscription.status;
        user.subscriptionEndDate = endDate;

        await user.save({ session });

        // Log the status change
        await SubscriptionStatusChange.create(
          [
            {
              userId: user._id,
              stripeCustomerId: subscription.customer,
              stripeSubscriptionId: subscription.id,
              stripeEventId: eventId || subscription.latest_invoice,
              previousStatus: previousRole,
              newStatus: newRole,
              subscriptionStatus: subscription.status,
              changeReason: reason,
              amount: subscription.items.data[0]?.price?.unit_amount || 0,
              currency: subscription.currency || "usd",
              periodStart: subscription.current_period_start 
                ? new Date(subscription.current_period_start * 1000) 
                : null,
              periodEnd: endDate,
              metadata: {
                stripePriceId: subscription.items.data[0]?.price?.id,
                stripeProductId: subscription.items.data[0]?.price?.product,
              },
            },
          ],
          { session }
        );

        console.log(
          `Updated user ${user.email} from ${previousRole} to ${newRole}`
        );

        // Store pending update for future logins (only if user exists)
        await PendingUserUpdate.create({
          email: user.email,
          stripeCustomerId: subscription.customer,
          pendingRole: newRole,
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          subscriptionEndDate: endDate,
          sourceEvent:
            reason === "stripe_webhook"
              ? "customer.subscription.updated"
              : "customer.subscription.created",
          stripeEventId: eventId,
          metadata: {
            stripePriceId: subscription.items.data[0]?.price?.id,
            stripeProductId: subscription.items.data[0]?.price?.product,
            amount: subscription.items.data[0]?.price?.unit_amount || 0,
            currency: subscription.currency || "usd",
          },
        });
      });
    } catch (error) {
      console.error("Error handling subscription change:", error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // Handle subscription cancellation
  static async handleSubscriptionCancellation(subscription, eventId = null) {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        let user = await User.findOne({
          stripeCustomerId: subscription.customer,
        }).session(session);

        if (!user) {
          // If not found, fetch customer from Stripe to get email
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
          let customerEmail = null;
          
          try {
            const customer = await stripe.customers.retrieve(
              subscription.customer
            );
            customerEmail = customer.email;
            
            if (customer.email) {
              user = await User.findOne({ email: customer.email }).session(
                session
              );
              if (user) {
                user.stripeCustomerId = subscription.customer;
              }
            }
          } catch (stripeError) {
            console.warn(`Could not retrieve Stripe customer ${subscription.customer}:`, stripeError.message);
            // Customer doesn't exist in Stripe, continue without it
          }

          // If still no user found, create a pending update and skip user update
          if (!user) {
            console.log(`User not found for customer ${subscription.customer} cancellation, will create pending update only`);
            
            // Create pending update for cancellation without user
            const cancelEndDate = subscription.ended_at 
              ? new Date(subscription.ended_at * 1000) 
              : new Date(); // Use current date as fallback
              
            await PendingUserUpdate.create({
              email: customerEmail || `stripe_customer_${subscription.customer}`, // Fallback email
              stripeCustomerId: subscription.customer,
              pendingRole: 'Tiare',
              stripeSubscriptionId: subscription.id,
              subscriptionStatus: 'canceled',
              subscriptionEndDate: cancelEndDate,
              sourceEvent: 'customer.subscription.deleted',
              stripeEventId: eventId,
              metadata: {
                amount: subscription.items.data[0]?.price?.unit_amount || 0,
                currency: subscription.currency || 'usd'
              }
            });
            
            console.log(`Created pending cancellation update for customer ${subscription.customer}`);
            return; // Exit early, no user to update
          }
        }

        const previousRole = user.role;

        // Safe date conversion for cancellation
        const cancelEndDate = subscription.ended_at 
          ? new Date(subscription.ended_at * 1000) 
          : new Date(); // Use current date as fallback

        // Update user to free tier
        user.role = "Tiare";
        user.subscriptionStatus = "canceled";
        user.subscriptionEndDate = cancelEndDate;

        await user.save({ session });

        // Log the cancellation
        await SubscriptionStatusChange.create(
          [
            {
              userId: user._id,
              stripeCustomerId: subscription.customer,
              stripeSubscriptionId: subscription.id,
              stripeEventId: eventId,
              previousStatus: previousRole,
              newStatus: "Tiare",
              subscriptionStatus: "canceled",
              changeReason: "cancellation",
              periodEnd: cancelEndDate,
            },
          ],
          { session }
        );

        console.log(`Canceled subscription for user ${user.email}`);

        // Store pending update for future logins (only if user exists)
        await PendingUserUpdate.create({
          email: user.email,
          stripeCustomerId: subscription.customer,
          pendingRole: "Tiare",
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: "canceled",
          subscriptionEndDate: cancelEndDate,
          sourceEvent: "customer.subscription.deleted",
          stripeEventId: eventId,
          metadata: {
            amount: subscription.items.data[0]?.price?.unit_amount || 0,
            currency: subscription.currency || "usd",
          },
        });
      });
    } catch (error) {
      console.error("Error handling subscription cancellation:", error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // Handle successful payment
  static async handlePaymentSuccess(invoice) {
    try {
      if (invoice.subscription) {
        const user = await User.findOne({
          stripeCustomerId: invoice.customer,
        });

        if (user) {
          // Update last payment date or any other success logic
          user.lastPaymentAt = new Date();
          await user.save();

          console.log(`Payment succeeded for user ${user.email}`);
        }
      }
    } catch (error) {
      console.error("Error handling payment success:", error);
      throw error;
    }
  }

  // Handle failed payment
  static async handlePaymentFailure(invoice) {
    try {
      const user = await User.findOne({
        stripeCustomerId: invoice.customer,
      });

      if (!user) return;

      const previousRole = user.role;

      // Log the failed payment
      await SubscriptionStatusChange.logChange({
        userId: user._id,
        stripeCustomerId: invoice.customer,
        stripeSubscriptionId: invoice.subscription,
        previousStatus: previousRole,
        newStatus: previousRole, // Status might not change immediately
        subscriptionStatus: "past_due",
        changeReason: "payment_failed",
        amount: invoice.amount_due,
        currency: invoice.currency,
      });

      console.log(`Payment failed for user ${user.email}`);
    } catch (error) {
      console.error("Error handling payment failure:", error);
      throw error;
    }
  }

  // Handle customer creation
  static async handleCustomerCreated(customer) {
    try {
      // Update user with Stripe customer ID if email matches
      if (customer.email) {
        const user = await User.findOne({ email: customer.email });
        if (user && !user.stripeCustomerId) {
          user.stripeCustomerId = customer.id;
          await user.save();
          console.log(`Updated user ${user.email} with Stripe customer ID`);
        }
      }
    } catch (error) {
      console.error("Error handling customer creation:", error);
      throw error;
    }
  }

  // Handle checkout session completed
  static async handleCheckoutSessionCompleted(session, eventId = null) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

      // Get email from session or customer
      let email = session.customer_details?.email;
      if (!email && session.customer) {
        try {
          const customer = await stripe.customers.retrieve(session.customer);
          email = customer.email;
        } catch (stripeError) {
          console.warn(`Could not retrieve Stripe customer ${session.customer}:`, stripeError.message);
          // Continue without customer email if not available
        }
      }

      if (!email) {
        console.error("No email found in checkout session");
        return;
      }

      // Find or create user
      let user = await User.findOne({ email });
      if (!user) {
        // If user doesn't exist, create one with basic info
        user = new User({
          email,
          name: session.customer_details?.name || email.split("@")[0],
          authProvider: "stripe_checkout",
          role: "Tiare", // Default, will be updated if subscription
        });
        await user.save();
        console.log(`Created new user from checkout: ${email}`);
      }

      // Update user with Stripe customer ID if not set
      if (!user.stripeCustomerId && session.customer) {
        user.stripeCustomerId = session.customer;
        await user.save();
      }

      // If there's a subscription, handle it
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription
        );
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = this.priceIdToPlan(priceId);

        // Safe date conversion
        const subscriptionEndDate = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null;
        const subscriptionStartDate = subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000)
          : null;

        user.role = plan;
        user.stripeSubscriptionId = subscription.id;
        user.subscriptionStatus = subscription.status;
        user.subscriptionEndDate = subscriptionEndDate;

        await user.save();

        // Store pending update for future logins
        await PendingUserUpdate.create({
          email,
          stripeCustomerId: session.customer,
          pendingRole: plan,
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          subscriptionEndDate: subscriptionEndDate,
          sourceEvent: "checkout.session.completed",
          stripeEventId: eventId,
          metadata: {
            stripePriceId: priceId,
            stripeProductId: subscription.items.data[0]?.price?.product,
            checkoutSessionId: session.id,
            amount: subscription.items.data[0]?.price?.unit_amount || 0,
            currency: subscription.currency || "usd",
          },
        });

        // Log the change
        await SubscriptionStatusChange.create({
          userId: user._id,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: subscription.id,
          stripeEventId: eventId,
          previousStatus: "Tiare", // Assuming new user or upgrade
          newStatus: plan,
          subscriptionStatus: subscription.status,
          changeReason: "checkout_completed",
          amount: subscription.items.data[0]?.price?.unit_amount || 0,
          currency: subscription.currency || "usd",
          periodStart: subscriptionStartDate,
          periodEnd: subscriptionEndDate,
          metadata: {
            stripePriceId: priceId,
            stripeProductId: subscription.items.data[0]?.price?.product,
            checkoutSessionId: session.id,
          },
        });

        console.log(`Updated user ${email} to ${plan} from checkout`);
      }
    } catch (error) {
      console.error("Error handling checkout session completed:", error);
      throw error;
    }
  }

  // Determine user role from Stripe subscription
  static determineRoleFromSubscription(subscription) {
    if (
      subscription.status !== "active" &&
      subscription.status !== "trialing"
    ) {
      return "Tiare";
    }

    // Check the price ID to determine the plan
    const priceId = subscription.items.data[0]?.price?.id;
    return this.priceIdToPlan(priceId);
  }

  // Manually upgrade user (admin function)
  static async manualUpgrade(userId, newRole, adminUserId, notes = "") {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const user = await User.findById(userId).session(session);
        if (!user) {
          throw new Error("User not found");
        }

        const previousRole = user.role;
        user.role = newRole;
        await user.save({ session });

        // Log the manual change
        await SubscriptionStatusChange.create(
          [
            {
              userId: user._id,
              stripeCustomerId: user.stripeCustomerId,
              previousStatus: previousRole,
              newStatus: newRole,
              changeReason: "manual_admin",
              metadata: {
                adminUserId,
                notes,
              },
            },
          ],
          { session }
        );

        console.log(
          `Manually upgraded user ${user.email} from ${previousRole} to ${newRole}`
        );
      });
    } catch (error) {
      console.error("Error in manual upgrade:", error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // Get subscription analytics
  static async getSubscriptionAnalytics(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const analytics = await SubscriptionStatusChange.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$changeReason",
            count: { $sum: 1 },
            totalRevenue: { $sum: "$amount" },
          },
        },
      ]);

      const userCounts = await User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ]);

      return {
        changes: analytics,
        userDistribution: userCounts,
      };
    } catch (error) {
      throw new Error(`Failed to get subscription analytics: ${error.message}`);
    }
  }

  // Check if user subscription is active
  static async isSubscriptionActive(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return false;

      if (user.role === "Tiare") return false;
      if (!user.subscriptionEndDate) return false;

      return new Date() < user.subscriptionEndDate;
    } catch (error) {
      console.error("Error checking subscription status:", error);
      return false;
    }
  }

  // Apply pending updates for a user (called on login)
  static async applyPendingUpdates(email) {
    try {
      console.log(`Looking for pending updates for user email: ${email}`);
      
      // First, try to find pending updates by email
      let pendingUpdates = await PendingUserUpdate.findPendingForEmail(email);
      console.log(`Found ${pendingUpdates.length} pending updates by email match`);

      // If no updates found by email, try to find by user's stripe customer ID
      if (pendingUpdates.length === 0) {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user && user.stripeCustomerId) {
          console.log(`User has Stripe customer ID: ${user.stripeCustomerId}, searching by customer ID`);
          pendingUpdates = await PendingUserUpdate.findPendingForCustomer(user.stripeCustomerId);
          console.log(`Found ${pendingUpdates.length} pending updates by customer ID match`);
        } else {
          console.log(`User has no Stripe customer ID, cannot search by customer ID`);
        }
      }

      // If still no updates found, check for pending updates with fallback email pattern
      if (pendingUpdates.length === 0) {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user && user.stripeCustomerId) {
          const fallbackEmail = `stripe_customer_${user.stripeCustomerId}`;
          console.log(`Searching for pending updates with fallback email: ${fallbackEmail}`);
          pendingUpdates = await PendingUserUpdate.find({
            email: fallbackEmail,
            isProcessed: false,
            expiresAt: { $gt: new Date() }
          }).sort({ createdAt: -1 });
          console.log(`Found ${pendingUpdates.length} pending updates by fallback email match`);
        }
      }

      if (pendingUpdates.length === 0) {
        return { applied: false, message: "No pending updates found" };
      }

      // Get the latest pending update
      const latestUpdate = pendingUpdates[0];

      // Find the user
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return { applied: false, message: "User not found" };
      }

      // Update user with pending data
      const previousRole = user.role;
      user.role = latestUpdate.pendingRole;
      user.stripeCustomerId =
        latestUpdate.stripeCustomerId || user.stripeCustomerId;
      user.stripeSubscriptionId =
        latestUpdate.stripeSubscriptionId || user.stripeSubscriptionId;
      user.subscriptionStatus =
        latestUpdate.subscriptionStatus || user.subscriptionStatus;
      user.subscriptionEndDate =
        latestUpdate.subscriptionEndDate || user.subscriptionEndDate;

      await user.save();

      // Mark all pending updates as processed
      for (const update of pendingUpdates) {
        await PendingUserUpdate.markAsProcessed(update._id);
      }

      // Log the change
      await SubscriptionStatusChange.create({
        userId: user._id,
        stripeCustomerId: latestUpdate.stripeCustomerId,
        stripeSubscriptionId: latestUpdate.stripeSubscriptionId,
        stripeEventId: latestUpdate.stripeEventId,
        previousStatus: previousRole,
        newStatus: latestUpdate.pendingRole,
        subscriptionStatus: latestUpdate.subscriptionStatus,
        changeReason: "pending_update_applied",
        periodEnd: latestUpdate.subscriptionEndDate,
        metadata: latestUpdate.metadata,
      });

      console.log(
        `Applied pending update for user ${email}: ${previousRole} -> ${latestUpdate.pendingRole}`
      );

      return {
        applied: true,
        previousRole,
        newRole: latestUpdate.pendingRole,
        updatesProcessed: pendingUpdates.length,
      };
    } catch (error) {
      console.error("Error applying pending updates:", error);
      throw error;
    }
  }

  // Manually update pending update with real email (admin function)
  static async updatePendingEmail(stripeCustomerId, realEmail) {
    try {
      const result = await PendingUserUpdate.updateMany(
        { 
          stripeCustomerId: stripeCustomerId,
          isProcessed: false 
        },
        { 
          email: realEmail.toLowerCase(),
          updatedAt: new Date()
        }
      );

      console.log(`Updated ${result.modifiedCount} pending updates for customer ${stripeCustomerId} with email ${realEmail}`);
      
      return {
        success: true,
        updatedCount: result.modifiedCount
      };
    } catch (error) {
      console.error("Error updating pending email:", error);
      throw error;
    }
  }

  // Get all pending updates (admin function for debugging)
  static async getAllPendingUpdates() {
    try {
      const pendingUpdates = await PendingUserUpdate.find({
        isProcessed: false,
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 });

      return pendingUpdates.map(update => ({
        id: update._id,
        email: update.email,
        stripeCustomerId: update.stripeCustomerId,
        stripeSubscriptionId: update.stripeSubscriptionId,
        pendingRole: update.pendingRole,
        subscriptionStatus: update.subscriptionStatus,
        sourceEvent: update.sourceEvent,
        createdAt: update.createdAt,
        metadata: update.metadata
      }));
    } catch (error) {
      console.error("Error getting pending updates:", error);
      throw error;
    }
  }

  // Manually apply a specific pending update to a user (admin function)
  static async manuallyApplyUpdate(pendingUpdateId, userEmail) {
    try {
      const pendingUpdate = await PendingUserUpdate.findById(pendingUpdateId);
      if (!pendingUpdate || pendingUpdate.isProcessed) {
        return { applied: false, message: "Pending update not found or already processed" };
      }

      const user = await User.findOne({ email: userEmail.toLowerCase() });
      if (!user) {
        return { applied: false, message: "User not found" };
      }

      // Apply the update
      const previousRole = user.role;
      user.role = pendingUpdate.pendingRole;
      user.stripeCustomerId = pendingUpdate.stripeCustomerId || user.stripeCustomerId;
      user.stripeSubscriptionId = pendingUpdate.stripeSubscriptionId || user.stripeSubscriptionId;
      user.subscriptionStatus = pendingUpdate.subscriptionStatus || user.subscriptionStatus;
      user.subscriptionEndDate = pendingUpdate.subscriptionEndDate || user.subscriptionEndDate;

      await user.save();

      // Mark as processed
      await PendingUserUpdate.markAsProcessed(pendingUpdate._id);

      // Log the change
      await SubscriptionStatusChange.create({
        userId: user._id,
        stripeCustomerId: pendingUpdate.stripeCustomerId,
        stripeSubscriptionId: pendingUpdate.stripeSubscriptionId,
        stripeEventId: pendingUpdate.stripeEventId,
        previousStatus: previousRole,
        newStatus: pendingUpdate.pendingRole,
        subscriptionStatus: pendingUpdate.subscriptionStatus,
        changeReason: "manual_pending_update_applied",
        periodEnd: pendingUpdate.subscriptionEndDate,
        metadata: pendingUpdate.metadata,
      });

      console.log(`Manually applied pending update ${pendingUpdateId} to user ${userEmail}: ${previousRole} -> ${pendingUpdate.pendingRole}`);

      return {
        applied: true,
        previousRole,
        newRole: pendingUpdate.pendingRole,
        message: "Update successfully applied"
      };
    } catch (error) {
      console.error("Error manually applying update:", error);
      throw error;
    }
  }

  // Map Stripe price ID to plan/role
  // Uses environment variables for price IDs (monthly plans)
  static priceIdToPlan(priceId) {
    const map = {
      [process.env.STRIPE_PRICE_ID_DIADEME]: "Diademe",  // Monthly Diademe plan
      [process.env.STRIPE_PRICE_ID_COURONNE]: "Couronne", // Monthly Couronne plan
      // Add more mappings as needed
    };
    return map[priceId] || "Tiare";
  }
}

export default SubscriptionService;
