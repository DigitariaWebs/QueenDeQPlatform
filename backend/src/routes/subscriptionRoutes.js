import express from 'express';
import Stripe from 'stripe';
import SubscriptionService from '../services/SubscriptionService.js';

const router = express.Router();

// Stripe webhook endpoint
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature (you'll need to set STRIPE_WEBHOOK_SECRET)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    console.log(`Received Stripe webhook: ${event.type}`);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    await SubscriptionService.handleStripeWebhook(event);
    
    // Return a response to acknowledge receipt of the event
    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      message: error.message 
    });
  }
});

// Get subscription analytics (admin only)
router.get('/subscription/analytics', async (req, res) => {
  try {
    // Add admin authentication here
    const { days = 30 } = req.query;
    
    const analytics = await SubscriptionService.getSubscriptionAnalytics(parseInt(days));
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manual upgrade endpoint (admin only)
router.post('/subscription/manual-upgrade', async (req, res) => {
  try {
    // Add admin authentication here
    const { userId, newRole, notes } = req.body;
    const adminUserId = req.user?._id; // Assuming admin is authenticated
    
    await SubscriptionService.manualUpgrade(userId, newRole, adminUserId, notes);
    
    res.json({
      success: true,
      message: 'User subscription updated successfully'
    });
  } catch (error) {
    console.error('Manual upgrade error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
