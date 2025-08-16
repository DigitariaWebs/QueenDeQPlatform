import { User, SubscriptionStatusChange } from '../models/index.js';
import mongoose from 'mongoose';

class SubscriptionService {
  // Handle Stripe webhook events
  static async handleStripeWebhook(event) {
    try {
      const { type, data } = event;
      const object = data.object;

      console.log(`Processing Stripe webhook: ${type}`);

      switch (type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionChange(object, 'stripe_webhook');
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancellation(object);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSuccess(object);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailure(object);
          break;

        case 'customer.created':
          await this.handleCustomerCreated(object);
          break;

        default:
          console.log(`Unhandled Stripe webhook event: ${type}`);
      }

      return { processed: true };
    } catch (error) {
      console.error('Error processing Stripe webhook:', error);
      throw error;
    }
  }

  // Handle subscription creation/updates
  static async handleSubscriptionChange(subscription, reason = 'stripe_webhook') {
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Find user by Stripe customer ID
        const user = await User.findOne({
          stripeCustomerId: subscription.customer
        }).session(session);

        if (!user) {
          throw new Error(`User not found for Stripe customer: ${subscription.customer}`);
        }

        // Determine new role based on subscription
        const newRole = this.determineRoleFromSubscription(subscription);
        const previousRole = user.role;

        // Update user subscription info
        user.role = newRole;
        user.stripeSubscriptionId = subscription.id;
        user.subscriptionStatus = subscription.status;
        user.subscriptionEndDate = new Date(subscription.current_period_end * 1000);

        await user.save({ session });

        // Log the status change
        await SubscriptionStatusChange.create([{
          userId: user._id,
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: subscription.id,
          stripeEventId: subscription.latest_invoice,
          previousStatus: previousRole,
          newStatus: newRole,
          subscriptionStatus: subscription.status,
          changeReason: reason,
          amount: subscription.items.data[0]?.price?.unit_amount || 0,
          currency: subscription.currency || 'usd',
          periodStart: new Date(subscription.current_period_start * 1000),
          periodEnd: new Date(subscription.current_period_end * 1000),
          metadata: {
            stripePriceId: subscription.items.data[0]?.price?.id,
            stripeProductId: subscription.items.data[0]?.price?.product
          }
        }], { session });

        console.log(`Updated user ${user.email} from ${previousRole} to ${newRole}`);
      });
    } catch (error) {
      console.error('Error handling subscription change:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // Handle subscription cancellation
  static async handleSubscriptionCancellation(subscription) {
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        const user = await User.findOne({
          stripeCustomerId: subscription.customer
        }).session(session);

        if (!user) {
          throw new Error(`User not found for Stripe customer: ${subscription.customer}`);
        }

        const previousRole = user.role;

        // Update user to free tier
        user.role = 'Tiare';
        user.subscriptionStatus = 'canceled';
        user.subscriptionEndDate = new Date(subscription.ended_at * 1000);

        await user.save({ session });

        // Log the cancellation
        await SubscriptionStatusChange.create([{
          userId: user._id,
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: subscription.id,
          previousStatus: previousRole,
          newStatus: 'Tiare',
          subscriptionStatus: 'canceled',
          changeReason: 'cancellation',
          periodEnd: new Date(subscription.ended_at * 1000)
        }], { session });

        console.log(`Canceled subscription for user ${user.email}`);
      });
    } catch (error) {
      console.error('Error handling subscription cancellation:', error);
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
          stripeCustomerId: invoice.customer
        });

        if (user) {
          // Update last payment date or any other success logic
          user.lastPaymentAt = new Date();
          await user.save();

          console.log(`Payment succeeded for user ${user.email}`);
        }
      }
    } catch (error) {
      console.error('Error handling payment success:', error);
      throw error;
    }
  }

  // Handle failed payment
  static async handlePaymentFailure(invoice) {
    try {
      const user = await User.findOne({
        stripeCustomerId: invoice.customer
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
        subscriptionStatus: 'past_due',
        changeReason: 'payment_failed',
        amount: invoice.amount_due,
        currency: invoice.currency
      });

      console.log(`Payment failed for user ${user.email}`);
    } catch (error) {
      console.error('Error handling payment failure:', error);
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
      console.error('Error handling customer creation:', error);
      throw error;
    }
  }

  // Determine user role from Stripe subscription
  static determineRoleFromSubscription(subscription) {
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return 'Tiare';
    }

    // Check the price/product to determine if monthly or annual
    const priceId = subscription.items.data[0]?.price?.id;
    const interval = subscription.items.data[0]?.price?.recurring?.interval;

    if (interval === 'month') {
      return 'Diademe';
    } else if (interval === 'year') {
      return 'Couronne';
    }

    return 'Tiare'; // Default fallback
  }

  // Manually upgrade user (admin function)
  static async manualUpgrade(userId, newRole, adminUserId, notes = '') {
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        const user = await User.findById(userId).session(session);
        if (!user) {
          throw new Error('User not found');
        }

        const previousRole = user.role;
        user.role = newRole;
        await user.save({ session });

        // Log the manual change
        await SubscriptionStatusChange.create([{
          userId: user._id,
          stripeCustomerId: user.stripeCustomerId,
          previousStatus: previousRole,
          newStatus: newRole,
          changeReason: 'manual_admin',
          metadata: {
            adminUserId,
            notes
          }
        }], { session });

        console.log(`Manually upgraded user ${user.email} from ${previousRole} to ${newRole}`);
      });
    } catch (error) {
      console.error('Error in manual upgrade:', error);
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
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$changeReason',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$amount' }
          }
        }
      ]);

      const userCounts = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        changes: analytics,
        userDistribution: userCounts
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

      if (user.role === 'Tiare') return false;
      if (!user.subscriptionEndDate) return false;

      return new Date() < user.subscriptionEndDate;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }
}

export default SubscriptionService;
