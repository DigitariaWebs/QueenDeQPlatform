import express from 'express';
import Stripe from 'stripe';
import SubscriptionService from '../services/SubscriptionService.js';

const router = express.Router();

// Stripe webhook endpoint
router.post('/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  console.log('Webhook received:', {
    method: req.method,
    url: req.url,
    headers: {
      'content-type': req.headers['content-type'],
      'stripe-signature': sig ? 'present' : 'missing'
    },
    bodyType: typeof req.body,
    bodyLength: req.body ? req.body.length : 'unknown'
  });

  let event;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Handle Vercel serverless environment where body might be base64 encoded
    let rawBody = req.body;
    if (req.headers['content-type'] === 'application/json' && typeof req.body === 'string') {
      // If body is a string, it might be base64 encoded in serverless
      try {
        rawBody = Buffer.from(req.body, 'base64');
        console.log('Decoded body from base64, length:', rawBody.length);
      } catch (e) {
        // If not base64, use as-is
        rawBody = Buffer.from(req.body);
        console.log('Used body as string, length:', rawBody.length);
      }
    } else if (Buffer.isBuffer(req.body)) {
      rawBody = req.body;
      console.log('Body is already a buffer, length:', rawBody.length);
    } else {
      // Fallback: convert to buffer
      rawBody = Buffer.from(JSON.stringify(req.body));
      console.log('Converted body to buffer, length:', rawBody.length);
    }

    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);

    console.log(`✅ Webhook signature verified for event: ${event.type}`);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
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

// Get all pending updates (admin only)
router.get('/admin/pending-updates', async (req, res) => {
  try {
    // Add admin authentication here
    const pendingUpdates = await SubscriptionService.getAllPendingUpdates();
    
    res.json({
      success: true,
      pendingUpdates,
      count: pendingUpdates.length
    });
  } catch (error) {
    console.error('Get pending updates error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update pending update email (admin only)
router.post('/admin/update-pending-email', async (req, res) => {
  try {
    // Add admin authentication here
    const { stripeCustomerId, realEmail } = req.body;
    
    if (!stripeCustomerId || !realEmail) {
      return res.status(400).json({
        success: false,
        error: 'Both stripeCustomerId and realEmail are required'
      });
    }
    
    const result = await SubscriptionService.updatePendingEmail(stripeCustomerId, realEmail);
    
    res.json({
      success: true,
      message: `Updated ${result.updatedCount} pending updates`,
      ...result
    });
  } catch (error) {
    console.error('Update pending email error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manually apply pending update to user (admin only)
router.post('/admin/apply-pending-update', async (req, res) => {
  try {
    // Add admin authentication here
    const { pendingUpdateId, userEmail } = req.body;
    
    if (!pendingUpdateId || !userEmail) {
      return res.status(400).json({
        success: false,
        error: 'Both pendingUpdateId and userEmail are required'
      });
    }
    
    const result = await SubscriptionService.manuallyApplyUpdate(pendingUpdateId, userEmail);
    
    res.json({
      success: result.applied,
      ...result
    });
  } catch (error) {
    console.error('Apply pending update error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
