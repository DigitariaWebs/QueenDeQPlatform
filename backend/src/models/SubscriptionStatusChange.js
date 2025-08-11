import mongoose from 'mongoose';

const subscriptionStatusChangeSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Stripe Information
  stripeCustomerId: {
    type: String,
    required: true,
    index: true
  },
  
  stripeSubscriptionId: {
    type: String,
    default: null
  },
  
  stripeEventId: {
    type: String,
    unique: true,
    sparse: true // Unique but allows null values
  },
  
  // Status Change Information
  previousStatus: {
    type: String,
    enum: ['Court', 'Diademe', 'Couronne', 'admin'],
    required: true
  },
  
  newStatus: {
    type: String,
    enum: ['Court', 'Diademe', 'Couronne', 'admin'],
    required: true
  },
  
  // Subscription Details
  subscriptionStatus: {
    type: String,
    enum: ['active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete', 'incomplete_expired'],
    default: null
  },
  
  // Change Trigger
  changeReason: {
    type: String,
    enum: [
      'stripe_webhook',
      'manual_admin',
      'upgrade',
      'downgrade',
      'cancellation',
      'renewal',
      'payment_failed',
      'trial_ended',
      'refund'
    ],
    required: true,
    index: true
  },
  
  // Financial Information
  amount: {
    type: Number, // Amount in cents
    default: null
  },
  
  currency: {
    type: String,
    default: 'usd',
    maxlength: 3
  },
  
  // Billing Period
  periodStart: {
    type: Date,
    default: null
  },
  
  periodEnd: {
    type: Date,
    default: null
  },
  
  // Metadata
  metadata: {
    adminUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    notes: {
      type: String,
      maxlength: 500,
      default: null
    },
    stripePriceId: {
      type: String,
      default: null
    },
    stripeProductId: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    },
    ipAddress: {
      type: String,
      default: null
    }
  },
  
  // Processing Status
  processed: {
    type: Boolean,
    default: true
  },
  
  processedAt: {
    type: Date,
    default: Date.now
  },
  
  errorMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes for performance
subscriptionStatusChangeSchema.index({ userId: 1, createdAt: -1 });
subscriptionStatusChangeSchema.index({ stripeCustomerId: 1, createdAt: -1 });
subscriptionStatusChangeSchema.index({ changeReason: 1, createdAt: -1 });
subscriptionStatusChangeSchema.index({ processed: 1, createdAt: -1 });

// Virtual for change type
subscriptionStatusChangeSchema.virtual('changeType').get(function() {
  const statusValues = {
    'Court': 0,
    'Diademe': 1,
    'Couronne': 2,
    'admin': 3
  };
  
  const prevValue = statusValues[this.previousStatus] || 0;
  const newValue = statusValues[this.newStatus] || 0;
  
  if (newValue > prevValue) return 'upgrade';
  if (newValue < prevValue) return 'downgrade';
  return 'lateral';
});

// Static method to log status change
subscriptionStatusChangeSchema.statics.logChange = async function(data) {
  try {
    const change = new this({
      userId: data.userId,
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      stripeEventId: data.stripeEventId,
      previousStatus: data.previousStatus,
      newStatus: data.newStatus,
      subscriptionStatus: data.subscriptionStatus,
      changeReason: data.changeReason,
      amount: data.amount,
      currency: data.currency,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      metadata: data.metadata || {}
    });
    
    return await change.save();
  } catch (error) {
    console.error('Error logging subscription change:', error);
    throw error;
  }
};

// Static method to get user subscription history
subscriptionStatusChangeSchema.statics.getUserHistory = function(userId, limit = 50) {
  return this.find({ userId: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('metadata.adminUserId', 'name email');
};

// Static method to get subscription analytics
subscriptionStatusChangeSchema.statics.getAnalytics = function(startDate, endDate) {
  const match = {
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          changeReason: '$changeReason',
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          }
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    },
    {
      $sort: { '_id.date': -1 }
    }
  ]);
};

// Static method to find recent upgrades
subscriptionStatusChangeSchema.statics.getRecentUpgrades = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    createdAt: { $gte: startDate },
    changeReason: { $in: ['upgrade', 'stripe_webhook'] },
    newStatus: { $in: ['Diademe', 'Couronne'] }
  })
  .populate('userId', 'name email')
  .sort({ createdAt: -1 });
};

// Static method to find failed payments
subscriptionStatusChangeSchema.statics.getFailedPayments = function(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    createdAt: { $gte: startDate },
    changeReason: 'payment_failed'
  })
  .populate('userId', 'name email')
  .sort({ createdAt: -1 });
};

// Method to mark as processed
subscriptionStatusChangeSchema.methods.markAsProcessed = function() {
  this.processed = true;
  this.processedAt = new Date();
  return this.save();
};

// Method to mark as failed
subscriptionStatusChangeSchema.methods.markAsFailed = function(errorMessage) {
  this.processed = false;
  this.errorMessage = errorMessage;
  return this.save();
};

const SubscriptionStatusChange = mongoose.model('SubscriptionStatusChange', subscriptionStatusChangeSchema);

export default SubscriptionStatusChange;
