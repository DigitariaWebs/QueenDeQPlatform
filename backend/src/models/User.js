import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    // Basic Profile Information
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      // Removed index: true since unique: true already creates an index
    },

    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
      minlength: 8,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // Authentication & Provider Info
    authProvider: {
      type: String,
      enum: ["local", "auth0"],
      default: "local",
    },

    authProviderId: {
      type: String,
      sparse: true, // Used for Auth0 users (both OAuth and database connections)
    },

    // Subscription & Role Management
    role: {
      type: String,
      enum: ["Tiare", "Diademe", "Couronne", "admin"],
      default: "Tiare",
      index: true,
    },

    // Stripe Integration
    stripeCustomerId: {
      type: String,
      sparse: true,
      index: true,
    },

    stripeSubscriptionId: {
      type: String,
      sparse: true,
    },

    subscriptionStatus: {
      type: String,
      enum: [
        "active",
        "canceled",
        "past_due",
        "unpaid",
        "trialing",
        "incomplete",
      ],
      default: null,
    },

    subscriptionEndDate: {
      type: Date,
      default: null,
    },

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },

    //   isEmailVerified: {
    //     type: Boolean,
    //     default: false
    //   },

    lastMonthlyReset: {
      type: Date,
      default: Date.now,
    },

    // Security
    lastLoginAt: {
      type: Date,
      default: null,
    },

    passwordResetToken: {
      type: String,
      default: null,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
    },

    emailVerificationToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.passwordResetToken;
        delete ret.emailVerificationToken;
        return ret;
      },
    },
  }
);

// Indexes for performance (removed duplicates)
userSchema.index({ createdAt: -1 });
userSchema.index({ authProvider: 1, providerId: 1 });

// Virtual for isPremium check (Diademe and Couronne are premium tiers)
userSchema.virtual('isPremium').get(function() {
  return this.role === 'Diademe' || this.role === 'Couronne';
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user can send messages (unlimited for all users)
userSchema.methods.canSendMessage = function() {
  // All users can send unlimited messages
  return true;
};

// Method to increment message count (no-op since limits are removed)
userSchema.methods.incrementMessageCount = function() {
  // No usage tracking needed since limits are removed
  return;
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find premium users (Diademe and Couronne tiers)
userSchema.statics.findPremiumUsers = function() {
  return this.find({ 
    role: { $in: ['Diademe', 'Couronne'] },
    isActive: true 
  });
};

const User = mongoose.model('User', userSchema);

export default User;