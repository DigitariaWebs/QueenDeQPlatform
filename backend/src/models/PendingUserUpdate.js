import mongoose from 'mongoose';

const pendingUserUpdateSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    index: true
  },

  // Stripe customer ID for reference
  stripeCustomerId: {
    type: String,
    sparse: true,
    index: true
  },

  // Pending role update
  pendingRole: {
    type: String,
    enum: ['Tiare', 'Diademe', 'Couronne'],
    required: true
  },

  // Subscription details
  stripeSubscriptionId: {
    type: String,
    sparse: true
  },

  subscriptionStatus: {
    type: String,
    enum: ['active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete'],
    default: null
  },

  subscriptionEndDate: {
    type: Date,
    default: null
  },

  // Source of the update (webhook event type)
  sourceEvent: {
    type: String,
    required: true
  },

  // Stripe event ID for idempotency
  stripeEventId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Expiration date (30 days from creation)
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    index: { expires: 0 } // TTL index
  },

  // Metadata
  metadata: {
    stripePriceId: String,
    stripeProductId: String,
    checkoutSessionId: String,
    amount: Number,
    currency: String
  },

  // Processing status
  isProcessed: {
    type: Boolean,
    default: false
  },

  processedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
pendingUserUpdateSchema.index({ email: 1, isProcessed: 1 });
pendingUserUpdateSchema.index({ stripeCustomerId: 1, isProcessed: 1 });

// Static method to find pending updates for an email
pendingUserUpdateSchema.statics.findPendingForEmail = function(email) {
  // Check if this looks like a fallback email (starts with stripe_customer_)
  const isFallbackEmail = email.toLowerCase().startsWith('stripe_customer_');
  
  if (isFallbackEmail) {
    // For fallback emails, do exact match (preserve case)
    return this.find({
      email: email,
      isProcessed: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });
  } else {
    // For real emails, do case-insensitive match
    return this.find({
      $or: [
        { email: email.toLowerCase() },
        { email: email },
        { email: `stripe_customer_${email}` }
      ],
      isProcessed: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });
  }
};

// Static method to find pending updates by Stripe customer ID
pendingUserUpdateSchema.statics.findPendingForCustomer = function(stripeCustomerId) {
  return this.find({
    stripeCustomerId: stripeCustomerId,
    isProcessed: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

// Static method to mark as processed
pendingUserUpdateSchema.statics.markAsProcessed = function(id) {
  return this.findByIdAndUpdate(id, {
    isProcessed: true,
    processedAt: new Date()
  });
};

export default mongoose.model('PendingUserUpdate', pendingUserUpdateSchema);
