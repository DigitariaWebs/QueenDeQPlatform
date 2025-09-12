import mongoose from 'mongoose';

const stripeEmailsSchema = new mongoose.Schema({
  // Stripe customer information
  stripeCustomerId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Customer email
  email: {
    type: String,
    required: true,
    trim: true,
    index: true
  },

  // Customer metadata from Stripe
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Customer creation info
  stripeCreated: {
    type: Date,
    required: true
  },

  // Customer description
  description: {
    type: String,
    trim: true
  },

  // Subscription information (initially empty, to be updated from PendingUserUpdate)
  subscription: {
    stripeSubscriptionId: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete', null],
      default: null
    },
    role: {
      type: String,
      enum: ['Tiare', 'Diademe', 'Couronne', null],
      default: null
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    priceId: {
      type: String,
      default: null
    },
    productId: {
      type: String,
      default: null
    },
    amount: {
      type: Number,
      default: null
    },
    currency: {
      type: String,
      default: null
    },
    lastUpdated: {
      type: Date,
      default: null
    }
  },

  // Processing flags
  subscriptionUpdated: {
    type: Boolean,
    default: false
  },

  lastSyncAttempt: {
    type: Date,
    default: null
  },

  syncErrors: [{
    error: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
stripeEmailsSchema.index({ email: 1 });
stripeEmailsSchema.index({ stripeCustomerId: 1 });
stripeEmailsSchema.index({ subscriptionUpdated: 1 });
stripeEmailsSchema.index({ 'subscription.stripeSubscriptionId': 1 });

// Static method to find by customer ID
stripeEmailsSchema.statics.findByCustomerId = function(stripeCustomerId) {
  return this.findOne({ stripeCustomerId });
};

// Static method to find by email
stripeEmailsSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find customers without subscription updates
stripeEmailsSchema.statics.findNeedingSubscriptionUpdate = function() {
  return this.find({ subscriptionUpdated: false });
};

// Instance method to update subscription from PendingUserUpdate
stripeEmailsSchema.methods.updateSubscriptionFromPending = async function(pendingUpdate) {
  this.subscription = {
    stripeSubscriptionId: pendingUpdate.stripeSubscriptionId,
    status: pendingUpdate.subscriptionStatus,
    role: pendingUpdate.pendingRole,
    endDate: pendingUpdate.subscriptionEndDate,
    priceId: pendingUpdate.metadata?.stripePriceId,
    productId: pendingUpdate.metadata?.stripeProductId,
    amount: pendingUpdate.metadata?.amount,
    currency: pendingUpdate.metadata?.currency,
    lastUpdated: new Date()
  };
  
  this.subscriptionUpdated = true;
  this.lastSyncAttempt = new Date();
  
  return this.save();
};

// Instance method to log sync errors
stripeEmailsSchema.methods.logSyncError = function(errorMessage) {
  this.syncErrors.push({
    error: errorMessage,
    timestamp: new Date()
  });
  
  this.lastSyncAttempt = new Date();
  
  // Keep only last 5 errors
  if (this.syncErrors.length > 5) {
    this.syncErrors = this.syncErrors.slice(-5);
  }
  
  return this.save();
};

export default mongoose.model('StripeEmails', stripeEmailsSchema);