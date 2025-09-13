import {
  User,
  SubscriptionStatusChange,
  PendingUserUpdate,
  StripeEmails,
} from "../models/index.js";
import mongoose from "mongoose";
import Stripe from "stripe";

class SubscriptionService {
  // Handle Stripe webhook events
  static async handleStripeWebhook(event) {
    try {
      const { type, data } = event;
      const object = data.object;

      console.log(`Processing Stripe webhook: ${type}, event ID: ${event.id}`);

      // Check for duplicate event processing
      if (event.id) {
        const existingEvent = await PendingUserUpdate.findOne({ stripeEventId: event.id });
        if (existingEvent) {
          console.log(`⚠️ Event ${event.id} already processed, skipping duplicate`);
          return { processed: true, duplicate: true };
        }
      }

      switch (type) {
        case "checkout.session.completed":
          await this.handleCheckoutSessionCompleted(object, event.id);
          break;

        case "customer.subscription.created":
        case "customer.subscription.updated":
          await this.handleSubscriptionChange(
            object,
            "stripe_webhook",
            event.id,
            type
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
    eventId = null,
    eventType = null
  ) {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // Find user by Stripe customer ID
        let user = await User.findOne({
          stripeCustomerId: subscription.customer,
        }).session(session);

        if (!user) {
          // If not found, try to get customer email following the priority order
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
          let customerEmail = null;

          // Priority 1: Try to get customer email directly from Stripe customer API
          try {
            console.log(
              `Attempting to retrieve customer ${subscription.customer} from Stripe API`
            );
            const customer = await stripe.customers.retrieve(
              subscription.customer
            );
            customerEmail = customer.email;
            console.log(
              `✅ Found customer email from Stripe API: ${customerEmail}`
            );

            if (customerEmail) {
              user = await User.findOne({ email: customerEmail }).session(
                session
              );
              if (user) {
                user.stripeCustomerId = subscription.customer;
                console.log(
                  `✅ Matched user by customer email: ${customerEmail}`
                );
              }
            }
          } catch (stripeError) {
            console.warn(
              `❌ Could not retrieve Stripe customer ${subscription.customer}:`,
              stripeError.message
            );
          }

          // Priority 2: If still no email and we have an invoice, try to get email from invoice
          if (!customerEmail && subscription.latest_invoice) {
            try {
              console.log(
                `Attempting to get email from invoice: ${subscription.latest_invoice}`
              );
              const invoice = await stripe.invoices.retrieve(
                subscription.latest_invoice
              );
              customerEmail = invoice.customer_email;
              console.log(
                `✅ Found customer email from invoice: ${customerEmail}`
              );

              if (customerEmail) {
                user = await User.findOne({ email: customerEmail }).session(
                  session
                );
                if (user) {
                  user.stripeCustomerId = subscription.customer;
                  console.log(
                    `✅ Matched user by invoice email: ${customerEmail}`
                  );
                }
              }
            } catch (invoiceError) {
              console.warn(
                `❌ Could not retrieve invoice ${subscription.latest_invoice}:`,
                invoiceError.message
              );
            }
          }

          // Priority 3: If still no email, try local mapping by finding existing user with this customer ID
          if (!customerEmail) {
            console.log(
              `Attempting fallback: searching local database for existing user with customer ID ${subscription.customer}`
            );
            user = await User.findOne({
              stripeCustomerId: subscription.customer,
            }).session(session);

            if (user) {
              customerEmail = user.email;
              console.log(
                `✅ Found user via local customer ID mapping: ${customerEmail}`
              );
            } else {
              console.log(
                `❌ No existing user found with customer ID ${subscription.customer}`
              );
            }
          }

          // Final fallback: Check metadata for email (Mighty Networks might include it)
          if (
            !customerEmail &&
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
                  `✅ Matched user by metadata email: ${customerEmail}`
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
              current_period_start: subscription.current_period_start,
              metadata: subscription.metadata,
              items: subscription.items?.data?.map((item) => ({
                price_id: item.price?.id,
                product_id: item.price?.product,
                amount: item.price?.unit_amount,
                currency: item.price?.currency,
              })),
            });

            // Create pending update without user
            const newRole = this.determineRoleFromSubscription(subscription);
            console.log(
              `Determined role: ${newRole} for subscription ${subscription.id}`
            );

            // Safe date conversion - try multiple date fields
            let endDate = null;
            if (subscription.current_period_end) {
              endDate = new Date(subscription.current_period_end * 1000);
            } else if (subscription.ended_at) {
              endDate = new Date(subscription.ended_at * 1000);
            } else if (subscription.canceled_at) {
              endDate = new Date(subscription.canceled_at * 1000);
            }

            console.log(`Subscription end date resolved to: ${endDate}`);

            // Create pending update with duplicate handling
            try {
              await PendingUserUpdate.create({
                email:
                  customerEmail || `stripe_customer_${subscription.customer}`, // Fallback email
                stripeCustomerId: subscription.customer,
                pendingRole: newRole,
                stripeSubscriptionId: subscription.id,
                subscriptionStatus: subscription.status,
                subscriptionEndDate: endDate,
                sourceEvent: eventType || "customer.subscription.created",
                stripeEventId: eventId,
                metadata: {
                  stripePriceId: subscription.items.data[0]?.price?.id,
                  stripeProductId: subscription.items.data[0]?.price?.product,
                  amount: subscription.items.data[0]?.price?.unit_amount || 0,
                  currency: subscription.currency || "usd",
                },
              });
              console.log(`✅ Created pending update for customer ${subscription.customer}`);
              
              // Immediately try to sync this pending update with StripeEmails
              try {
                console.log(`🔄 Attempting immediate sync with StripeEmails for customer ${subscription.customer}`);
                const syncResult = await this.syncStripeEmailWithPendingUpdates(subscription.customer, customerEmail);
                if (syncResult) {
                  console.log(`✅ Successfully synced StripeEmails for customer ${subscription.customer}`);
                }
              } catch (syncError) {
                console.error(`❌ Error syncing StripeEmails for customer ${subscription.customer}:`, syncError);
              }
            } catch (duplicateError) {
              if (duplicateError.code === 11000 && duplicateError.keyValue?.stripeEventId) {
                console.log(`⚠️ Pending update for event ${eventId} already exists, skipping creation`);
              } else {
                throw duplicateError; // Re-throw if it's not a duplicate event error
              }
            }

            console.log(
              `Created pending update for customer ${subscription.customer}`
            );
            return; // Exit early, no user to update
          }
        }

        // Determine new role based on subscription
        const newRole = this.determineRoleFromSubscription(subscription);
        const previousRole = user.role;

        // Safe date conversion - try multiple date fields
        let endDate = null;
        if (subscription.current_period_end) {
          endDate = new Date(subscription.current_period_end * 1000);
        } else if (subscription.ended_at) {
          endDate = new Date(subscription.ended_at * 1000);
        } else if (subscription.canceled_at) {
          endDate = new Date(subscription.canceled_at * 1000);
        }

        console.log(`Subscription end date resolved to: ${endDate}`);

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
        try {
          await PendingUserUpdate.create({
            email: user.email,
            stripeCustomerId: subscription.customer,
            pendingRole: newRole,
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            subscriptionEndDate: endDate,
            sourceEvent: eventType || "customer.subscription.created",
            stripeEventId: eventId,
            metadata: {
              stripePriceId: subscription.items.data[0]?.price?.id,
              stripeProductId: subscription.items.data[0]?.price?.product,
              amount: subscription.items.data[0]?.price?.unit_amount || 0,
              currency: subscription.currency || "usd",
            },
          });
          console.log(`✅ Created pending update for user ${user.email}`);
          
          // Immediately try to sync this pending update with StripeEmails
          try {
            console.log(`🔄 Attempting immediate sync with StripeEmails for customer ${subscription.customer}`);
            const syncResult = await this.syncStripeEmailWithPendingUpdates(subscription.customer, user.email);
            if (syncResult) {
              console.log(`✅ Successfully synced StripeEmails for customer ${subscription.customer}`);
            }
          } catch (syncError) {
            console.error(`❌ Error syncing StripeEmails for customer ${subscription.customer}:`, syncError);
          }
        } catch (duplicateError) {
          if (duplicateError.code === 11000 && duplicateError.keyValue?.stripeEventId) {
            console.log(`⚠️ Pending update for event ${eventId} already exists for user ${user.email}, skipping creation`);
          } else {
            throw duplicateError; // Re-throw if it's not a duplicate event error
          }
        }

        // Update StripeEmails collection with subscription data
        try {
          await this.updateStripeEmailSubscription(subscription, eventType);
        } catch (stripeEmailError) {
          console.error(
            "Error updating StripeEmails subscription:",
            stripeEmailError
          );
          // Don't fail the main transaction, just log the error
        }
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
            console.warn(
              `Could not retrieve Stripe customer ${subscription.customer}:`,
              stripeError.message
            );
            // Customer doesn't exist in Stripe, continue without it
          }

          // If still no user found, create a pending update and skip user update
          if (!user) {
            console.log(
              `User not found for customer ${subscription.customer} cancellation, will create pending update only`
            );

            // Create pending update for cancellation without user
            const cancelEndDate = subscription.ended_at
              ? new Date(subscription.ended_at * 1000)
              : new Date(); // Use current date as fallback

            try {
              await PendingUserUpdate.create({
                email:
                  customerEmail || `stripe_customer_${subscription.customer}`, // Fallback email
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
              console.log(
                `✅ Created pending cancellation update for customer ${subscription.customer}`
              );

              // Immediately try to sync this pending update with StripeEmails
              try {
                console.log(
                  `🔄 Attempting immediate sync with StripeEmails for customer ${subscription.customer}`
                );
                const syncResult = await this.syncStripeEmailWithPendingUpdates(
                  subscription.customer,
                  customerEmail
                );
                if (syncResult) {
                  console.log(
                    `✅ Successfully synced StripeEmails for customer ${subscription.customer}`
                  );
                }
              } catch (syncError) {
                console.error(
                  `❌ Error syncing StripeEmails for customer ${subscription.customer}:`,
                  syncError
                );
              }
            } catch (duplicateError) {
              if (
                duplicateError.code === 11000 &&
                duplicateError.keyValue?.stripeEventId
              ) {
                console.log(
                  `⚠️ Pending cancellation update for event ${eventId} already exists, skipping creation`
                );
              } else {
                throw duplicateError; // Re-throw if it's not a duplicate event error
              }
            }

            console.log(
              `Created pending cancellation update for customer ${subscription.customer}`
            );
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
        try {
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
          console.log(
            `✅ Created pending cancellation update for user ${user.email}`
          );

          // Immediately try to sync this pending update with StripeEmails
          try {
            console.log(
              `🔄 Attempting immediate sync with StripeEmails for customer ${subscription.customer}`
            );
            const syncResult = await this.syncStripeEmailWithPendingUpdates(
              subscription.customer,
              user.email
            );
            if (syncResult) {
              console.log(
                `✅ Successfully synced StripeEmails for customer ${subscription.customer}`
              );
            }
          } catch (syncError) {
            console.error(
              `❌ Error syncing StripeEmails for customer ${subscription.customer}:`,
              syncError
            );
          }
        } catch (duplicateError) {
          if (
            duplicateError.code === 11000 &&
            duplicateError.keyValue?.stripeEventId
          ) {
            console.log(
              `⚠️ Pending cancellation update for event ${eventId} already exists for user ${user.email}, skipping creation`
            );
          } else {
            throw duplicateError; // Re-throw if it's not a duplicate event error
          }
        }

        // Update StripeEmails collection with cancellation data
        try {
          await this.updateStripeEmailSubscription(
            subscription,
            "customer.subscription.deleted"
          );
        } catch (stripeEmailError) {
          console.error(
            "Error updating StripeEmails subscription cancellation:",
            stripeEmailError
          );
          // Don't fail the main transaction, just log the error
        }
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
      console.log(
        `Processing customer.created for: ${customer.id}, email: ${customer.email}`
      );

      // Save customer data to stripe_emails collection
      const customerData = {
        stripeCustomerId: customer.id,
        email: customer.email || `stripe_customer_${customer.id}`, // Fallback if no email
        metadata: customer.metadata || {},
        stripeCreated: new Date(customer.created * 1000), // Convert Unix timestamp
        description: customer.description,
        // subscription field is initialized as empty in the schema
        subscriptionUpdated: false,
        lastSyncAttempt: null,
      };

      // Check if customer already exists in stripe_emails collection
      const existingStripeEmail = await StripeEmails.findByCustomerId(
        customer.id
      );

      if (!existingStripeEmail) {
        // Create new record in stripe_emails collection
        const stripeEmail = new StripeEmails(customerData);
        await stripeEmail.save();
        console.log(
          `✅ Saved customer ${customer.id} to stripe_emails collection`
        );

        // Try to sync with any existing pending updates immediately
        await this.syncStripeEmailWithPendingUpdates(
          customer.id,
          customer.email
        );
      } else {
        console.log(
          `Customer ${customer.id} already exists in stripe_emails collection`
        );

        // Update existing record with latest customer data (in case customer details changed)
        Object.assign(existingStripeEmail, customerData);
        await existingStripeEmail.save();
        console.log(
          `✅ Updated existing customer ${customer.id} in stripe_emails collection`
        );
      }

      // Original logic: Update user with Stripe customer ID if email matches
      if (customer.email) {
        const user = await User.findOne({ email: customer.email });
        if (user && !user.stripeCustomerId) {
          user.stripeCustomerId = customer.id;
          await user.save();
          console.log(`✅ Updated user ${user.email} with Stripe customer ID`);
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
      let customerEmail = null;
      let user = null;

      // Priority 1: Get email from session.customer_details.email (as you specified)
      if (session.customer_details?.email) {
        customerEmail = session.customer_details.email;
        console.log(
          `✅ Found email from checkout session customer_details: ${customerEmail}`
        );

        user = await User.findOne({ email: customerEmail });
        if (user) {
          console.log(
            `✅ Found existing user by session email: ${customerEmail}`
          );
        }
      }

      // Priority 2: If no email from session, try Stripe customer API
      if (!customerEmail && session.customer) {
        try {
          console.log(
            `Attempting to retrieve customer ${session.customer} from Stripe API`
          );
          const customer = await stripe.customers.retrieve(session.customer);
          customerEmail = customer.email;
          console.log(
            `✅ Found email from Stripe customer API: ${customerEmail}`
          );

          if (customerEmail) {
            user = await User.findOne({ email: customerEmail });
            if (user) {
              console.log(
                `✅ Found existing user by customer API email: ${customerEmail}`
              );
            }
          }
        } catch (stripeError) {
          console.warn(
            `❌ Could not retrieve Stripe customer ${session.customer}:`,
            stripeError.message
          );
        }
      }

      // Priority 3: Try local mapping by customer ID
      if (!customerEmail && session.customer) {
        console.log(
          `Attempting fallback: searching local database for existing user with customer ID ${session.customer}`
        );
        user = await User.findOne({ stripeCustomerId: session.customer });

        if (user) {
          customerEmail = user.email;
          console.log(
            `✅ Found user via local customer ID mapping: ${customerEmail}`
          );
        } else {
          console.log(
            `❌ No existing user found with customer ID ${session.customer}`
          );
        }
      }

      if (!customerEmail) {
        console.error(
          "❌ No email found in checkout session after all attempts"
        );
        return;
      }

      // Create user if not found
      if (!user) {
        // If user doesn't exist, create one with basic info
        user = new User({
          email: customerEmail,
          name: session.customer_details?.name || customerEmail.split("@")[0],
          authProvider: "stripe_checkout",
          role: "Tiare", // Default, will be updated if subscription
        });
        await user.save();
        console.log(`Created new user from checkout: ${customerEmail}`);
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
        try {
          await PendingUserUpdate.create({
            email: customerEmail,
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
          console.log(`✅ Created pending update for checkout session ${session.id}`);
          
          // Immediately try to sync this pending update with StripeEmails
          try {
            console.log(`🔄 Attempting immediate sync with StripeEmails for customer ${session.customer}`);
            const syncResult = await this.syncStripeEmailWithPendingUpdates(session.customer, customerEmail);
            if (syncResult) {
              console.log(`✅ Successfully synced StripeEmails for customer ${session.customer}`);
            }
          } catch (syncError) {
            console.error(`❌ Error syncing StripeEmails for customer ${session.customer}:`, syncError);
          }
        } catch (duplicateError) {
          if (duplicateError.code === 11000 && duplicateError.keyValue?.stripeEventId) {
            console.log(`⚠️ Pending update for event ${eventId} already exists for checkout session, skipping creation`);
          } else {
            throw duplicateError; // Re-throw if it's not a duplicate event error
          }
        }

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

        console.log(`Updated user ${customerEmail} to ${plan} from checkout`);
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
      console.log(
        `Found ${pendingUpdates.length} pending updates by email match`
      );

      // If no updates found by email, try to find by user's stripe customer ID
      if (pendingUpdates.length === 0) {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user && user.stripeCustomerId) {
          console.log(
            `User has Stripe customer ID: ${user.stripeCustomerId}, searching by customer ID`
          );
          pendingUpdates = await PendingUserUpdate.findPendingForCustomer(
            user.stripeCustomerId
          );
          console.log(
            `Found ${pendingUpdates.length} pending updates by customer ID match`
          );
        } else {
          console.log(
            `User has no Stripe customer ID, cannot search by customer ID`
          );
        }
      }

      // If still no updates found, check for pending updates with fallback email pattern
      if (pendingUpdates.length === 0) {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user && user.stripeCustomerId) {
          const fallbackEmail = `stripe_customer_${user.stripeCustomerId}`;
          console.log(
            `Searching for pending updates with fallback email: ${fallbackEmail}`
          );
          pendingUpdates = await PendingUserUpdate.find({
            email: fallbackEmail,
            isProcessed: false,
            expiresAt: { $gt: new Date() },
          }).sort({ createdAt: -1 });
          console.log(
            `Found ${pendingUpdates.length} pending updates by fallback email match`
          );
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
          isProcessed: false,
        },
        {
          email: realEmail.toLowerCase(),
          updatedAt: new Date(),
        }
      );

      console.log(
        `Updated ${result.modifiedCount} pending updates for customer ${stripeCustomerId} with email ${realEmail}`
      );

      return {
        success: true,
        updatedCount: result.modifiedCount,
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
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      return pendingUpdates.map((update) => ({
        id: update._id,
        email: update.email,
        stripeCustomerId: update.stripeCustomerId,
        stripeSubscriptionId: update.stripeSubscriptionId,
        pendingRole: update.pendingRole,
        subscriptionStatus: update.subscriptionStatus,
        sourceEvent: update.sourceEvent,
        createdAt: update.createdAt,
        metadata: update.metadata,
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
        return {
          applied: false,
          message: "Pending update not found or already processed",
        };
      }

      const user = await User.findOne({ email: userEmail.toLowerCase() });
      if (!user) {
        return { applied: false, message: "User not found" };
      }

      // Apply the update
      const previousRole = user.role;
      user.role = pendingUpdate.pendingRole;
      user.stripeCustomerId =
        pendingUpdate.stripeCustomerId || user.stripeCustomerId;
      user.stripeSubscriptionId =
        pendingUpdate.stripeSubscriptionId || user.stripeSubscriptionId;
      user.subscriptionStatus =
        pendingUpdate.subscriptionStatus || user.subscriptionStatus;
      user.subscriptionEndDate =
        pendingUpdate.subscriptionEndDate || user.subscriptionEndDate;

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

      console.log(
        `Manually applied pending update ${pendingUpdateId} to user ${userEmail}: ${previousRole} -> ${pendingUpdate.pendingRole}`
      );

      return {
        applied: true,
        previousRole,
        newRole: pendingUpdate.pendingRole,
        message: "Update successfully applied",
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
      [process.env.STRIPE_PRICE_ID_DIADEME]: "Diademe", // Monthly Diademe plan
      [process.env.STRIPE_PRICE_ID_COURONNE]: "Couronne", // Monthly Couronne plan
      // Add more mappings as needed
    };
    return map[priceId] || "Tiare";
  }

  // Search for Stripe customer by email
  static async findStripeCustomerByEmail(email) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

      console.log(`Searching Stripe for customer with email: ${email}`);

      const customers = await stripe.customers.search({
        query: `email:'${email}'`,
        limit: 1,
      });

      if (customers.data.length > 0) {
        const customer = customers.data[0];
        console.log(
          `Found Stripe customer: ${customer.id} for email: ${email}`
        );
        return customer;
      }

      console.log(`No Stripe customer found for email: ${email}`);
      return null;
    } catch (error) {
      console.error("Error searching Stripe customer:", error);
      return null;
    }
  }

  // Sync StripeEmails with PendingUserUpdates
  static async syncStripeEmailWithPendingUpdates(
    stripeCustomerId,
    customerEmail = null
  ) {
    try {
      console.log(`Syncing customer ${stripeCustomerId} with pending updates`);

      // Find the stripe email record
      const stripeEmail = await StripeEmails.findByCustomerId(stripeCustomerId);
      if (!stripeEmail) {
        console.log(
          `No stripe email record found for customer ${stripeCustomerId}`
        );
        return false;
      }

      // Find pending updates for this customer
      let pendingUpdates = [];

      // Search by customer ID first
      if (stripeCustomerId) {
        const updatesByCustomerId =
          await PendingUserUpdate.findPendingForCustomer(stripeCustomerId);
        pendingUpdates.push(...updatesByCustomerId);
      }

      // Search by email if available
      if (customerEmail || stripeEmail.email) {
        const emailToSearch = customerEmail || stripeEmail.email;
        const updatesByEmail =
          await PendingUserUpdate.findPendingForEmail(emailToSearch);
        pendingUpdates.push(...updatesByEmail);
        
        // Also search for the fallback email pattern in case the pending update was created with it
        const fallbackEmail = `stripe_customer_${stripeCustomerId}`;
        const updatesByFallbackEmail =
          await PendingUserUpdate.findPendingForEmail(fallbackEmail);
        pendingUpdates.push(...updatesByFallbackEmail);
      }

      // Remove duplicates based on _id
      const uniqueUpdates = pendingUpdates.filter(
        (update, index, self) =>
          index ===
          self.findIndex((u) => u._id.toString() === update._id.toString())
      );

      if (uniqueUpdates.length === 0) {
        console.log(
          `No pending updates found for customer ${stripeCustomerId}`
        );
        return false;
      }

      // Use the most recent pending update
      const latestUpdate = uniqueUpdates.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )[0];

      console.log(
        `Found ${uniqueUpdates.length} pending updates, using latest: ${latestUpdate._id}`
      );

      // Update the subscription field in stripe_emails
      await stripeEmail.updateSubscriptionFromPending(latestUpdate);

      console.log(
        `✅ Successfully synced customer ${stripeCustomerId} with pending update ${latestUpdate._id}`
      );

      // Delete all pending updates for this customer after successful sync
      const deletedUpdates = await PendingUserUpdate.deleteMany({
        $or: [
          { stripeCustomerId: stripeCustomerId },
          ...(customerEmail || stripeEmail.email
            ? [
                { email: customerEmail || stripeEmail.email },
                { email: (customerEmail || stripeEmail.email).toLowerCase() },
                {
                  email: `stripe_customer_${customerEmail || stripeEmail.email}`,
                },
              ]
            : []),
        ],
      });

      console.log(
        `🗑️ Deleted ${deletedUpdates.deletedCount} pending updates for customer ${stripeCustomerId}`
      );

      return true;
    } catch (error) {
      console.error(
        `Error syncing customer ${stripeCustomerId} with pending updates:`,
        error
      );

      // Log the error in the stripe email record
      const stripeEmail = await StripeEmails.findByCustomerId(stripeCustomerId);
      if (stripeEmail) {
        await stripeEmail.logSyncError(error.message);
      }

      return false;
    }
  }

  // Bulk sync all stripe emails that haven't been synced with pending updates
  static async bulkSyncStripeEmailsWithPendingUpdates() {
    try {
      console.log("Starting bulk sync of stripe emails with pending updates");

      const unsynced = await StripeEmails.findNeedingSubscriptionUpdate();
      console.log(
        `Found ${unsynced.length} stripe email records needing subscription updates`
      );

      let syncedCount = 0;
      let errorCount = 0;

      for (const stripeEmail of unsynced) {
        try {
          const synced = await this.syncStripeEmailWithPendingUpdates(
            stripeEmail.stripeCustomerId,
            stripeEmail.email
          );

          if (synced) {
            syncedCount++;
          }
        } catch (error) {
          console.error(
            `Failed to sync customer ${stripeEmail.stripeCustomerId}:`,
            error
          );
          errorCount++;
        }
      }

      console.log(
        `Bulk sync completed. Synced: ${syncedCount}, Errors: ${errorCount}`
      );

      return {
        total: unsynced.length,
        synced: syncedCount,
        errors: errorCount,
      };
    } catch (error) {
      console.error("Error in bulk sync:", error);
      throw error;
    }
  }

  // Update StripeEmails subscription data from Stripe subscription object
  static async updateStripeEmailSubscription(subscription, eventType = null) {
    try {
      if (!subscription.customer) {
        console.log(
          "No customer ID in subscription, skipping StripeEmails update"
        );
        return false;
      }

      const stripeEmail = await StripeEmails.findByCustomerId(
        subscription.customer
      );
      if (!stripeEmail) {
        console.log(
          `No StripeEmails record found for customer ${subscription.customer}`
        );
        return false;
      }

      console.log(`🔄 Found StripeEmails record for customer ${subscription.customer}, attempting sync with PendingUserUpdates`);
      
      // Try to sync with pending updates first - this will populate subscription data from PendingUserUpdate
      try {
        const syncResult = await this.syncStripeEmailWithPendingUpdates(subscription.customer, stripeEmail.email);
        console.log(`✅ Sync result for customer ${subscription.customer}: ${syncResult}`);
        if (syncResult) {
          // If sync was successful, the subscription data is already updated and pending updates are deleted
          return true;
        }
      } catch (syncError) {
        console.error(`❌ Error syncing customer ${subscription.customer} with pending updates:`, syncError);
        // Continue with webhook data processing if sync fails
      }

      // Get subscription details
      const subscriptionData = {
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        startDate: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000)
          : null,
        endDate: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null,
        lastUpdated: new Date(),
      };

      // Get price and product info if available
      if (
        subscription.items &&
        subscription.items.data &&
        subscription.items.data.length > 0
      ) {
        const item = subscription.items.data[0];
        subscriptionData.priceId = item.price.id;
        subscriptionData.productId = item.price.product;
        subscriptionData.amount = item.price.unit_amount;
        subscriptionData.currency = item.price.currency;

        // Map price to role
        subscriptionData.role = this.priceIdToPlan(item.price.id);
      }

      // Handle subscription deletion
      if (eventType === "customer.subscription.deleted") {
        subscriptionData.status = "canceled";
        subscriptionData.endDate = new Date(); // Set end date to now
      }

      // First, try to sync with any pending updates that might have more complete data
      // This should happen BEFORE we update with webhook data, in case pending data is more complete
      try {
        console.log(`🔄 Attempting to sync StripeEmails with PendingUserUpdates for customer ${subscription.customer}`);
        const syncResult = await this.syncStripeEmailWithPendingUpdates(subscription.customer, stripeEmail.email);
        if (syncResult) {
          console.log(`✅ Successfully synced customer ${subscription.customer} with pending updates`);
          // Refresh the stripeEmail record after sync
          const refreshedStripeEmail = await StripeEmails.findByCustomerId(subscription.customer);
          if (refreshedStripeEmail) {
            // Update our local reference
            stripeEmail = refreshedStripeEmail;
          }
        }
      } catch (syncError) {
        console.error(`Error syncing with pending updates for customer ${subscription.customer}:`, syncError);
        // Continue with webhook data update even if sync fails
      }

      // Update the subscription field with webhook data (this might override or complement the synced data)
      stripeEmail.subscription = {
        ...stripeEmail.subscription,
        ...subscriptionData,
      };

      stripeEmail.subscriptionUpdated = true;
      stripeEmail.lastSyncAttempt = new Date();

      await stripeEmail.save();
      console.log(
        `✅ Updated StripeEmails subscription for customer ${subscription.customer}`
      );

      // Delete related pending updates after successful subscription update
      try {
        const deletedUpdates = await PendingUserUpdate.deleteMany({
          $or: [
            { stripeCustomerId: subscription.customer },
            { stripeSubscriptionId: subscription.id },
            ...(stripeEmail.email
              ? [
                  { email: stripeEmail.email },
                  { email: stripeEmail.email.toLowerCase() },
                  { email: `stripe_customer_${stripeEmail.email}` },
                ]
              : []),
          ],
        });

        console.log(
          `🗑️ Deleted ${deletedUpdates.deletedCount} pending updates for customer ${subscription.customer} subscription ${subscription.id}`
        );
      } catch (deleteError) {
        console.error(
          `Error deleting pending updates for customer ${subscription.customer}:`,
          deleteError
        );
        // Don't fail the main update, just log the error
      }

      return true;
    } catch (error) {
      console.error(
        `Error updating StripeEmails subscription for customer ${subscription.customer}:`,
        error
      );
      return false;
    }
  }

  // Check and apply StripeEmails subscription updates to user
  static async applyStripeEmailsUpdates(userEmail) {
    try {
      console.log(`Checking StripeEmails updates for: ${userEmail}`);

      // Find StripeEmails record for this user's email
      const stripeEmail = await StripeEmails.findByEmail(userEmail);

      if (!stripeEmail) {
        console.log(`No StripeEmails record found for ${userEmail}`);
        return { applied: false, reason: "No StripeEmails record found" };
      }

      // First, try to sync any pending updates to StripeEmails before applying
      try {
        console.log(`🔄 Attempting to sync pending updates for ${userEmail} during login`);
        const syncResult = await this.syncStripeEmailWithPendingUpdates(
          stripeEmail.stripeCustomerId, 
          userEmail
        );
        if (syncResult) {
          console.log(`✅ Successfully synced pending updates for ${userEmail} during login`);
          // Refresh the stripeEmail object after sync
          const updatedStripeEmail = await StripeEmails.findByEmail(userEmail);
          if (updatedStripeEmail) {
            Object.assign(stripeEmail, updatedStripeEmail.toObject());
          }
        }
      } catch (syncError) {
        console.error(`❌ Error syncing pending updates for ${userEmail} during login:`, syncError);
        // Continue with login process even if sync fails
      }

      if (!stripeEmail.subscriptionUpdated || !stripeEmail.subscription) {
        console.log(`No subscription updates available for ${userEmail}`);
        return { applied: false, reason: "No subscription updates available" };
      }

      // Find the user
      const user = await User.findOne({ email: userEmail });
      if (!user) {
        console.log(`User not found for email ${userEmail}`);
        return { applied: false, reason: "User not found" };
      }

      const previousRole = user.role;
      const newRole = stripeEmail.subscription.role || "Tiare";
      const subscriptionStatus = stripeEmail.subscription.status;
      const subscriptionId = stripeEmail.subscription.stripeSubscriptionId;

      // Check if update is needed
      if (
        user.role === newRole &&
        user.subscriptionStatus === subscriptionStatus &&
        user.stripeSubscriptionId === subscriptionId
      ) {
        console.log(`User ${userEmail} already has current subscription data`);
        return { applied: false, reason: "User already up to date" };
      }

      // Apply the update
      user.role = newRole;
      user.subscriptionStatus = subscriptionStatus;
      user.subscriptionEndDate = stripeEmail.subscription.endDate;
      user.stripeSubscriptionId = subscriptionId;
      user.stripeCustomerId = stripeEmail.stripeCustomerId;

      await user.save();

      // Log the change
      await SubscriptionStatusChange.create({
        userId: user._id,
        stripeCustomerId: stripeEmail.stripeCustomerId,
        stripeSubscriptionId: subscriptionId,
        previousStatus: previousRole,
        newStatus: newRole,
        subscriptionStatus: subscriptionStatus,
        changeReason: "stripe_emails_sync",
        periodEnd: stripeEmail.subscription.endDate,
      });

      console.log(
        `✅ Applied StripeEmails update for ${userEmail}: ${previousRole} -> ${newRole}`
      );

      return {
        applied: true,
        previousRole,
        newRole,
        subscriptionStatus,
        requiresLogout: previousRole !== newRole, // Force logout if role changed
        message: "StripeEmails subscription update applied successfully",
      };
    } catch (error) {
      console.error(
        `Error applying StripeEmails updates for ${userEmail}:`,
        error
      );
      throw error;
    }
  }
}

export default SubscriptionService;
