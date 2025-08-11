import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  // Session Reference
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatSession',
    required: true,
    index: true
  },
  
  // User Reference (for quick user queries)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Message Content
  content: {
    type: String,
    required: true,
    maxlength: 10000 // Reasonable limit for chat messages
  },
  
  // Sender Information
  sender: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
    index: true
  },
  
  // Message Type (for different kinds of messages)
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'code', 'system_notification'],
    default: 'text'
  },
  
  // OpenAI API specific data
  openaiData: {
    model: {
      type: String,
      default: null
    },
    tokens: {
      prompt: { type: Number, default: 0 },
      completion: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    finishReason: {
      type: String,
      enum: ['stop', 'length', 'content_filter', 'tool_calls', null],
      default: null
    },
    responseTime: {
      type: Number, // milliseconds
      default: null
    }
  },
  
  // Message Status
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'error', 'retry'],
    default: 'sent',
    index: true
  },
  
  // Error information (if any)
  error: {
    message: { type: String, default: null },
    code: { type: String, default: null },
    retryCount: { type: Number, default: 0 }
  },
  
  // Metadata
  metadata: {
    userAgent: { type: String, default: null },
    ipAddress: { type: String, default: null },
    edited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    originalContent: { type: String, default: null }
  },
  
  // Attachments (for future file support)
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file', 'link']
    },
    url: String,
    filename: String,
    size: Number,
    mimeType: String
  }],
  
  // Thread/Reply support (for future features)
  parentMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  
  // Message order within session
  order: {
    type: Number,
    required: true,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Compound indexes for efficient queries
messageSchema.index({ sessionId: 1, order: 1 });
messageSchema.index({ sessionId: 1, createdAt: 1 });
messageSchema.index({ userId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ status: 1, createdAt: -1 });

// Virtual for replies (if implementing threading)
messageSchema.virtual('replies', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'parentMessageId'
});

// Method to mark as error
messageSchema.methods.markAsError = function(errorMessage, errorCode = null) {
  this.status = 'error';
  this.error.message = errorMessage;
  this.error.code = errorCode;
  this.error.retryCount += 1;
  return this.save();
};

// Method to retry message
messageSchema.methods.retry = function() {
  if (this.error.retryCount >= 3) {
    throw new Error('Maximum retry attempts exceeded');
  }
  
  this.status = 'retry';
  this.error.retryCount += 1;
  return this.save();
};

// Method to edit message content
messageSchema.methods.editContent = function(newContent) {
  if (this.sender !== 'user') {
    throw new Error('Only user messages can be edited');
  }
  
  this.metadata.originalContent = this.content;
  this.content = newContent;
  this.metadata.edited = true;
  this.metadata.editedAt = new Date();
  
  return this.save();
};

// Static method to find session messages
messageSchema.statics.findSessionMessages = function(sessionId, options = {}) {
  const query = { sessionId: sessionId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .sort(options.sort || { order: 1 })
    .limit(options.limit || 1000)
    .select(options.select || null);
};

// Static method to get message count for session
messageSchema.statics.getSessionMessageCount = function(sessionId) {
  return this.countDocuments({ sessionId: sessionId });
};

// Static method to find latest message in session
messageSchema.statics.findLatestInSession = function(sessionId) {
  return this.findOne({ sessionId: sessionId })
    .sort({ order: -1 })
    .limit(1);
};

// Static method to get user's total token usage
messageSchema.statics.getUserTokenUsage = function(userId, startDate = null) {
  const match = { userId: userId, sender: 'assistant' };
  
  if (startDate) {
    match.createdAt = { $gte: startDate };
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalTokens: { $sum: '$openaiData.tokens.total' },
        totalMessages: { $sum: 1 },
        avgResponseTime: { $avg: '$openaiData.responseTime' }
      }
    }
  ]);
};

// Pre-save middleware to set order
messageSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const lastMessage = await this.constructor
        .findOne({ sessionId: this.sessionId })
        .sort({ order: -1 })
        .limit(1);
      
      this.order = lastMessage ? lastMessage.order + 1 : 1;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Post-save middleware to update session
messageSchema.post('save', async function() {
  try {
    const ChatSession = mongoose.model('ChatSession');
    await ChatSession.findByIdAndUpdate(
      this.sessionId,
      {
        $set: { lastMessageAt: this.createdAt },
        $inc: { messageCount: this.isNew ? 1 : 0 }
      }
    );
  } catch (error) {
    console.error('Error updating chat session:', error);
  }
});

const Message = mongoose.model('Message', messageSchema);

export default Message;