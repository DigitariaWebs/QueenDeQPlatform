import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { ManagementClient } from 'auth0';
import SubscriptionService from '../services/SubscriptionService.js';

const router = express.Router();

// Auth0 Management Client
const auth0 = new ManagementClient({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
});

// Validation middleware
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be less than 100 characters')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Auth0 authentication callback
router.post("/auth0", async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: "Access token is required",
      });
    }

    // Verify the token with Auth0
    const auth0Domain = process.env.AUTH0_DOMAIN;
    const response = await fetch(`https://${auth0Domain}/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return res.status(401).json({
        success: false,
        error: "Invalid access token",
      });
    }

    const userInfo = await response.json();

    // Log user info for debugging different auth methods
    console.log("Auth0 userInfo:", {
      sub: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      nickname: userInfo.nickname,
      picture: userInfo.picture ? "present" : "not present",
      email_verified: userInfo.email_verified,
    });

    // Check if user exists in our database
    let user = await User.findByEmail(userInfo.email);

    if (!user) {
      // Create new user from Auth0 data
      // For database users, name might be email, so try to create a better display name
      let displayName = userInfo.name;
      if (userInfo.name === userInfo.email) {
        // For database users, name is often the email, so use nickname or create from email
        displayName =
          userInfo.nickname || userInfo.email.split("@")[0] || "Auth0 User";
      }

      user = new User({
        email: userInfo.email,
        name: displayName,
        authProvider: "auth0",
        authProviderId: userInfo.sub,
        avatar: userInfo.picture,
        isActive: true,
        emailVerified: userInfo.email_verified || false,
      });
      await user.save();
    } else {
      // Update user info if needed
      if (user.authProvider !== "auth0") {
        user.authProvider = "auth0";
        user.authProviderId = userInfo.sub;
        if (userInfo.picture && !user.avatar) {
          user.avatar = userInfo.picture;
        }
        await user.save();
      }

      // Update name if it's still the default or email for database users
      if (user.name === "Auth0 User" || user.name === userInfo.email) {
        let displayName = userInfo.name;
        if (userInfo.name === userInfo.email) {
          displayName =
            userInfo.nickname || userInfo.email.split("@")[0] || "Auth0 User";
        }
        if (displayName !== user.name) {
          user.name = displayName;
          await user.save();
        }
      }
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Search for Stripe customer and link if not already linked
    if (!user.stripeCustomerId) {
      try {
        console.log(
          `User ${userInfo.email} has no Stripe customer ID, searching Stripe...`
        );
        const stripeCustomer =
          await SubscriptionService.findStripeCustomerByEmail(userInfo.email);

        if (stripeCustomer) {
          console.log(
            `Linking Stripe customer ${stripeCustomer.id} to user ${userInfo.email}`
          );
          user.stripeCustomerId = stripeCustomer.id;

          // Also get active subscription if available
          if (stripeCustomer.subscriptions?.data?.length > 0) {
            const activeSubscription = stripeCustomer.subscriptions.data.find(
              (sub) => sub.status === "active" || sub.status === "trialing"
            );
            if (activeSubscription) {
              console.log(
                `Found active subscription ${activeSubscription.id} for customer ${stripeCustomer.id}`
              );
              user.stripeSubscriptionId = activeSubscription.id;
            }
          }

          await user.save();
          console.log(
            `Successfully linked Stripe customer ${stripeCustomer.id} to user ${userInfo.email}`
          );
        } else {
          console.log(`No Stripe customer found for email ${userInfo.email}`);
        }
      } catch (error) {
        console.error("Error linking Stripe customer:", error);
        // Continue with login even if Stripe linking fails
      }
    } else {
      console.log(
        `User ${userInfo.email} already has Stripe customer ID: ${user.stripeCustomerId}`
      );
    }

    // Apply any pending subscription updates
    try {
      const updateResult = await SubscriptionService.applyPendingUpdates(
        userInfo.email
      );
      if (updateResult.applied) {
        console.log(
          `Applied pending update for ${userInfo.email}: ${updateResult.previousRole} -> ${updateResult.newRole}`
        );
        // Refresh user data after update
        user = await User.findById(user._id);
      }
    } catch (error) {
      console.error("Error applying pending updates:", error);
      // Don't fail login if pending update fails
    }

    // Check for StripeEmails subscription updates
    try {
      const stripeEmailsUpdate =
        await SubscriptionService.applyStripeEmailsUpdates(userInfo.email);
      if (stripeEmailsUpdate.applied) {
        console.log(
          `Applied StripeEmails update for ${userInfo.email}: ${stripeEmailsUpdate.previousRole} -> ${stripeEmailsUpdate.newRole}`
        );

        // If role changed, force logout by returning special response
        if (stripeEmailsUpdate.requiresLogout) {
          return res.status(200).json({
            success: true,
            requiresLogout: true,
            message:
              "Your subscription has been updated. Please log in again to access your new features.",
            updatedRole: stripeEmailsUpdate.newRole,
            previousRole: stripeEmailsUpdate.previousRole,
          });
        }

        // Refresh user data after update
        user = await User.findById(user._id);
      }
    } catch (error) {
      console.error("Error applying StripeEmails updates:", error);
      // Don't fail login if StripeEmails update fails
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Auth0 authentication successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isPremium: user.isPremium,
        avatar: user.avatar,
        authProvider: user.authProvider,
        lastLoginAt: user.lastLoginAt,
      },
      token,
    });
  } catch (error) {
    console.error("Auth0 authentication error:", error);
    res.status(500).json({
      success: false,
      error: "Auth0 authentication failed",
      message: error.message,
    });
  }
});

// Register new user
router.post("/register", validateRegistration, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      if (existingUser.authProvider === "auth0") {
        return res.status(409).json({
          success: false,
          error:
            "This email is already registered with Auth0. Please use Auth0 to login.",
        });
      }
      return res.status(409).json({
        success: false,
        error: "User with this email already exists",
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name,
      authProvider: "local",
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isPremium: user.isPremium,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Registration failed",
      message: error.message,
    });
  }
});

// Login user
router.post("/login", validateLogin, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Check if user is an Auth0 user
    if (user.authProvider === "auth0") {
      return res.status(401).json({
        success: false,
        error:
          "This email is registered with Auth0. Please use Auth0 to login.",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: "Account is deactivated. Please contact support.",
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Apply any pending subscription updates
    try {
      const updateResult = await SubscriptionService.applyPendingUpdates(
        user.email
      );
      if (updateResult.applied) {
        console.log(
          `Applied pending update for ${user.email}: ${updateResult.previousRole} -> ${updateResult.newRole}`
        );
        // Refresh user data after update
        user = await User.findById(user._id);
      }
    } catch (error) {
      console.error("Error applying pending updates:", error);
      // Don't fail login if pending update fails
    }

    // Check for StripeEmails subscription updates
    try {
      const stripeEmailsUpdate =
        await SubscriptionService.applyStripeEmailsUpdates(user.email);
      if (stripeEmailsUpdate.applied) {
        console.log(
          `Applied StripeEmails update for ${user.email}: ${stripeEmailsUpdate.previousRole} -> ${stripeEmailsUpdate.newRole}`
        );

        // If role changed, force logout by returning special response
        if (stripeEmailsUpdate.requiresLogout) {
          return res.status(200).json({
            success: true,
            requiresLogout: true,
            message:
              "Your subscription has been updated. Please log in again to access your new features.",
            updatedRole: stripeEmailsUpdate.newRole,
            previousRole: stripeEmailsUpdate.previousRole,
          });
        }

        // Refresh user data after update
        user = await User.findById(user._id);
      }
    } catch (error) {
      console.error("Error applying StripeEmails updates:", error);
      // Don't fail login if StripeEmails update fails
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isPremium: user.isPremium,
        avatar: user.avatar,
        preferences: user.preferences,
        lastLoginAt: user.lastLoginAt,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Login failed",
      message: error.message,
    });
  }
});

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isPremium: user.isPremium,
        avatar: user.avatar,
        preferences: user.preferences,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndDate: user.subscriptionEndDate,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

// Update user profile
router.patch('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'avatar', 'preferences'];
    const updates = {};

    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    Object.assign(user, updates);
    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isPremium: user.isPremium,
        avatar: user.avatar,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Change password
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters'
      });
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

// Logout (client-side token removal, but we can log it)
router.post('/logout', async (req, res) => {
  try {
    // In a stateless JWT system, logout is mainly handled client-side
    // But we can log the logout event
    console.log('User logout request');

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

export default router;
