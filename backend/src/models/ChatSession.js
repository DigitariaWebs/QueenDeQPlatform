import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Session Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    default: 'New Chat'
  },
  
  // Chat Type (Poiche=free, Miroir=paid, salon_de_the=paid)
  chatType: {
    type: String,
    enum: ['poiche', 'miroir', 'salon_de_the'],
    default: 'poiche',
    index: true
  },
  
  // Auto-generated title with AI (always enabled)
  autoTitle: {
    type: Boolean,
    default: true
  },
  
  // Tracks if AI title has been generated
  aiTitleGenerated: {
    type: Boolean,
    default: false
  },
  
  // Title generation method preference
  titleGenerationMethod: {
    type: String,
    enum: ['ai', 'simple'],
    default: 'ai'
  },
  
  // Session Status
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted', 'permanently_deleted'],
    default: 'active',
    index: true
  },
  
  // Soft delete audit trail
  deletedAt: {
    type: Date,
    default: null
  },
  
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  deleteReason: {
    type: String,
    enum: ['user_request', 'admin_action', 'policy_violation', 'data_cleanup', 'user_account_deleted'],
    default: null
  },
  
  // Message Statistics
  messageCount: {
    type: Number,
    default: 0
  },
  
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  
  // Session Metadata
  model: {
    type: String,
    default: 'gpt-4o'
  },
  
  // System prompt or context (if any)
  systemPrompt: {
    type: String,
    default: null,
    maxlength: 1000
  },
  
  // Session Settings
  settings: {
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2
    },
    maxTokens: {
      type: Number,
      default: 4000,
      min: 1,
      max: 8000
    }
  },
  
  // Tags for organization
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  
  // Sharing settings
  isPublic: {
    type: Boolean,
    default: false
  },
  
  shareToken: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Advanced sharing options
  shareSettings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      default: null
    },
    allowComments: {
      type: Boolean,
      default: false
    },
    viewCount: {
      type: Number,
      default: 0
    },
    maxViews: {
      type: Number,
      default: null // unlimited if null
    },
    requireAuth: {
      type: Boolean,
      default: false
    },
    allowedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Compound indexes for efficient queries
chatSessionSchema.index({ userId: 1, status: 1, updatedAt: -1 });
chatSessionSchema.index({ userId: 1, createdAt: -1 });
chatSessionSchema.index({ userId: 1, lastMessageAt: -1 });
chatSessionSchema.index({ 'shareSettings.isPublic': 1, 'shareSettings.viewCount': -1 });
chatSessionSchema.index({ status: 1, deletedAt: 1 });
chatSessionSchema.index({ 'shareSettings.expiresAt': 1 });

// Virtual for message count from Message collection
chatSessionSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'sessionId'
});

// Method to automatically generate title (AI by default)
chatSessionSchema.methods.generateAutoTitle = async function(firstMessage, messages = []) {
  if (!this.autoTitle || this.title !== 'New Chat') return;
  
  // Always try AI title generation first
  if (this.titleGenerationMethod === 'ai') {
    try {
      await this.generateAITitle(messages.length > 0 ? messages : [{ content: firstMessage, sender: 'user' }]);
      return;
    } catch (error) {
      console.error('AI title generation failed, falling back to simple:', error);
      // Fall back to simple title generation
    }
  }
  
  // Fallback: Simple title generation
  this.generateSimpleTitle(firstMessage);
};

// Method to generate simple title (fallback)
chatSessionSchema.methods.generateSimpleTitle = function(firstMessage) {
  // Take first 50 characters and clean up
  let title = firstMessage.substring(0, 50).trim();
  if (firstMessage.length > 50) {
    title += '...';
  }
  
  this.title = title;
  this.autoTitle = false;
};

// Method to generate AI-powered title (now the default)
chatSessionSchema.methods.generateAITitle = async function(messages) {
  if (!this.autoTitle || this.title !== 'New Chat') return;
  
  try {
    // Extract user messages for analysis
    const userMessages = Array.isArray(messages) 
      ? messages.filter(m => m.sender === 'user') 
      : [{ content: messages, sender: 'user' }];
    
    if (userMessages.length === 0) return;
    
    const firstUserMessage = userMessages[0]?.content || '';
    const lastUserMessage = userMessages[userMessages.length - 1]?.content || firstUserMessage;
    
    // Generate AI-powered title based on content analysis
    let title = this.analyzeContentForTitle(firstUserMessage, lastUserMessage);
    
    this.title = title;
    this.autoTitle = false;
    this.aiTitleGenerated = true;
    
    return this.save();
  } catch (error) {
    console.error('Error generating AI title:', error);
    // Fallback to simple title generation
    const firstMessage = Array.isArray(messages) ? messages[0]?.content : messages;
    this.generateSimpleTitle(firstMessage || 'New Chat');
    throw error; // Re-throw so calling method knows to handle fallback
  }
};

// Enhanced AI-like content analysis for title generation
chatSessionSchema.methods.analyzeContentForTitle = function(firstMessage, lastMessage) {
  const content = (firstMessage + ' ' + lastMessage).toLowerCase();
  
  // Relationship categories with keywords and emojis
  const categories = {
    breakup: {
      keywords: ['ex', 'former', 'breakup', 'break up', 'separated', 'divorce', 'split'],
      title: '💔 Breakup Support'
    },
    dating: {
      keywords: ['dating', 'first date', 'tinder', 'bumble', 'online dating', 'date', 'crush'],
      title: '💕 Dating Advice'
    },
    marriage: {
      keywords: ['marriage', 'married', 'wedding', 'spouse', 'husband', 'wife', 'engagement'],
      title: '💍 Marriage Guidance'
    },
    communication: {
      keywords: ['talk', 'communicate', 'argue', 'fight', 'discussion', 'conversation'],
      title: '💬 Communication Help'
    },
    intimacy: {
      keywords: ['intimate', 'physical', 'affection', 'romance', 'passion', 'connection'],
      title: '💖 Intimacy & Romance'
    },
    family: {
      keywords: ['family', 'parents', 'children', 'kids', 'in-laws', 'relatives'],
      title: '👨‍👩‍👧‍👦 Family Relationships'
    },
    friendship: {
      keywords: ['friend', 'friendship', 'best friend', 'social', 'platonic'],
      title: '👥 Friendship Advice'
    },
    self_worth: {
      keywords: ['confidence', 'self-esteem', 'worth', 'insecure', 'anxiety', 'depression'],
      title: '🌟 Self-Worth & Confidence'
    },
    cheating: {
      keywords: ['cheat', 'affair', 'unfaithful', 'betrayal', 'trust', 'loyal'],
      title: '💔 Trust & Betrayal'
    },
    long_distance: {
      keywords: ['long distance', 'far away', 'ldr', 'distance', 'apart'],
      title: '🌍 Long Distance Love'
    }
  };
  
  // Find matching categories
  let bestMatch = null;
  let maxMatches = 0;
  
  for (const [category, data] of Object.entries(categories)) {
    const matches = data.keywords.filter(keyword => content.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = data;
    }
  }
  
  // If we found a good match, use the category title
  if (bestMatch && maxMatches > 0) {
    return bestMatch.title;
  }
  
  // General relationship advice if we have relationship keywords
  const generalKeywords = ['relationship', 'advice', 'help', 'question', 'problem', 'love', 'partner'];
  const hasGeneralKeywords = generalKeywords.some(keyword => content.includes(keyword));
  
  if (hasGeneralKeywords) {
    return '� Relationship Advice';
  }
  
  // Extract key phrases for a more personalized title
  const words = firstMessage.split(' ').filter(word => word.length > 3);
  if (words.length > 0) {
    const keyWord = words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
    return `🤔 ${keyWord} Question`;
  }
  
  // Final fallback to excerpt
  let title = firstMessage.substring(0, 40).trim();
  if (firstMessage.length > 40) {
    title += '...';
  }
  return title || '💭 New Conversation';
};

// Method to force regenerate title with AI (even if already set)
chatSessionSchema.methods.regenerateAITitle = async function(messages) {
  try {
    // Temporarily enable auto title to allow regeneration
    const originalAutoTitle = this.autoTitle;
    const originalTitle = this.title;
    
    this.autoTitle = true;
    this.title = 'New Chat';
    
    await this.generateAITitle(messages);
    
    return this.save();
  } catch (error) {
    console.error('Error regenerating AI title:', error);
    throw error;
  }
};

// Method to update last message timestamp
chatSessionSchema.methods.updateLastMessage = function() {
  this.lastMessageAt = new Date();
  this.messageCount += 1;
};

// Method to generate share token with advanced options
chatSessionSchema.methods.generateShareToken = function(options = {}) {
  const crypto = require('crypto');
  this.shareToken = crypto.randomBytes(32).toString('hex');
  
  // Set basic sharing
  this.isPublic = true;
  
  // Set advanced sharing options
  this.shareSettings = {
    isPublic: options.isPublic !== false,
    expiresAt: options.expiresAt || null,
    allowComments: options.allowComments || false,
    viewCount: 0,
    maxViews: options.maxViews || null,
    requireAuth: options.requireAuth || false,
    allowedUsers: options.allowedUsers || []
  };
  
  return this.save();
};

// Method to check if share is valid
chatSessionSchema.methods.isShareValid = function() {
  if (!this.shareToken || !this.shareSettings.isPublic) return false;
  
  // Check expiration
  if (this.shareSettings.expiresAt && new Date() > this.shareSettings.expiresAt) {
    return false;
  }
  
  // Check view limit
  if (this.shareSettings.maxViews && this.shareSettings.viewCount >= this.shareSettings.maxViews) {
    return false;
  }
  
  return true;
};

// Method to increment view count
chatSessionSchema.methods.incrementViewCount = function() {
  if (this.shareSettings.viewCount !== undefined) {
    this.shareSettings.viewCount += 1;
    return this.save();
  }
};

// Static method to find user sessions
chatSessionSchema.statics.findUserSessions = function(userId, options = {}) {
  const query = { 
    userId: userId,
    status: options.status || 'active'
  };
  
  return this.find(query)
    .sort(options.sort || { lastMessageAt: -1 })
    .limit(options.limit || 50)
    .populate(options.populate || null);
};

// Static method to find recent sessions
chatSessionSchema.statics.findRecentSessions = function(userId, limit = 10) {
  return this.find({ 
    userId: userId, 
    status: 'active',
    messageCount: { $gt: 0 }
  })
  .sort({ lastMessageAt: -1 })
  .limit(limit)
  .select('title lastMessageAt messageCount aiTitleGenerated');
};

// Static method to find shared sessions
chatSessionSchema.statics.findSharedSessions = function(options = {}) {
  const query = {
    'shareSettings.isPublic': true,
    shareToken: { $exists: true, $ne: null }
  };
  
  if (options.notExpired) {
    query.$or = [
      { 'shareSettings.expiresAt': null },
      { 'shareSettings.expiresAt': { $gt: new Date() } }
    ];
  }
  
  return this.find(query)
    .populate('userId', 'name')
    .sort({ 'shareSettings.viewCount': -1 })
    .limit(options.limit || 20);
};

// Static method to find deleted sessions for cleanup
chatSessionSchema.statics.findDeletedSessions = function(olderThanDays = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  
  return this.find({
    status: 'deleted',
    deletedAt: { $lt: cutoffDate }
  }).select('_id title deletedAt deleteReason');
};

// Static method to bulk restore sessions
chatSessionSchema.statics.bulkRestore = function(sessionIds, userId = null) {
  const query = { 
    _id: { $in: sessionIds },
    status: 'deleted'
  };
  
  if (userId) {
    query.userId = userId;
  }
  
  return this.updateMany(query, {
    $set: { status: 'active' },
    $unset: { deletedAt: 1, deletedBy: 1, deleteReason: 1 }
  });
};

// Pre-remove middleware to clean up messages
chatSessionSchema.pre('remove', async function(next) {
  try {
    await mongoose.model('Message').deleteMany({ sessionId: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

// Method to soft delete with audit trail
chatSessionSchema.methods.softDelete = function(deletedBy = null, reason = 'user_request') {
  this.status = 'deleted';
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.deleteReason = reason;
  return this.save();
};

// Method to permanently delete (admin only)
chatSessionSchema.methods.permanentDelete = async function(deletedBy = null) {
  this.status = 'permanently_deleted';
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.deleteReason = 'admin_action';
  
  // Also delete associated messages
  await mongoose.model('Message').deleteMany({ sessionId: this._id });
  
  return this.save();
};

// Method to restore from soft delete
chatSessionSchema.methods.restore = function() {
  if (this.status !== 'deleted') {
    throw new Error('Session is not in deleted state');
  }
  
  this.status = 'active';
  this.deletedAt = null;
  this.deletedBy = null;
  this.deleteReason = null;
  return this.save();
};

// Method to archive
chatSessionSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

export default ChatSession;