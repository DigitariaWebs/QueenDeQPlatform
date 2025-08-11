import { User, ChatSession, Message, SubscriptionStatusChange } from '../models/index.js';
import mongoose from 'mongoose';

class ChatService {
  // Create a new chat session
  static async createChatSession(userId, title = 'New Chat', options = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const session = new ChatSession({
        userId,
        title,
        chatType: options.chatType || 'poiche',
        systemPrompt: options.systemPrompt || null,
        settings: {
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 4000
        }
      });

      await session.save();
      return session;
    } catch (error) {
      throw new Error(`Failed to create chat session: ${error.message}`);
    }
  }

  // Add a message to a session
  static async addMessage(sessionId, userId, content, sender = 'user', metadata = {}) {
    const session = await mongoose.startSession();
    let savedMessage;
    
    try {
      await session.withTransaction(async () => {
        // Verify session exists and belongs to user
        const chatSession = await ChatSession.findOne({
          _id: sessionId,
          userId: userId
        }).session(session);

        if (!chatSession) {
          throw new Error('Chat session not found or access denied');
        }

        // Get the next order number for this session
        const lastMessage = await Message.findOne({ sessionId })
          .sort({ order: -1 })
          .session(session);
        
        const nextOrder = lastMessage ? lastMessage.order + 1 : 1;

        // Create the message
        const message = new Message({
          sessionId,
          userId,
          content,
          sender,
          metadata,
          order: nextOrder
        });

        savedMessage = await message.save({ session });

        // Auto-generate title if it's the first user message
        if (sender === 'user' && chatSession.messageCount === 0) {
          chatSession.generateAutoTitle(content);
          await chatSession.save({ session });
        }

        return message;
      });

      // Return the message with populated data
      const newMessage = await Message.findById(savedMessage._id);
      return newMessage;
    } catch (error) {
      throw new Error(`Failed to add message: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }

  // Get chat session with messages
  static async getChatSession(sessionId, userId, includeMessages = true) {
    try {
      const chatSession = await ChatSession.findOne({
        _id: sessionId,
        userId: userId,
        status: { $ne: 'deleted' }
      });

      if (!chatSession) {
        throw new Error('Chat session not found or access denied');
      }

      if (includeMessages) {
        const messages = await Message.findSessionMessages(sessionId, {
          sort: { order: 1 }
        });
        
        return {
          ...chatSession.toJSON(),
          messages
        };
      }

      return chatSession;
    } catch (error) {
      throw new Error(`Failed to get chat session: ${error.message}`);
    }
  }

  // Get user's chat sessions
  static async getUserChatSessions(userId, options = {}) {
    try {
      const {
        status = 'active',
        limit = 50,
        page = 1,
        sortBy = 'lastMessageAt',
        sortOrder = -1
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder };

      const sessions = await ChatSession.find({
        userId,
        status
      })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('title messageCount lastMessageAt createdAt updatedAt model tags chatType');

      const total = await ChatSession.countDocuments({
        userId,
        status
      });

      return {
        sessions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get user chat sessions: ${error.message}`);
    }
  }

  // Update session title
  static async updateSessionTitle(sessionId, userId, newTitle) {
    try {
      const session = await ChatSession.findOneAndUpdate(
        { _id: sessionId, userId: userId },
        { 
          title: newTitle.trim(),
          autoTitle: false
        },
        { new: true }
      );

      if (!session) {
        throw new Error('Chat session not found or access denied');
      }

      return session;
    } catch (error) {
      throw new Error(`Failed to update session title: ${error.message}`);
    }
  }

  // Delete a chat session (soft delete)
  static async deleteChatSession(sessionId, userId) {
    try {
      const session = await ChatSession.findOne({
        _id: sessionId,
        userId: userId
      });

      if (!session) {
        throw new Error('Chat session not found or access denied');
      }

      await session.softDelete();
      return { success: true, message: 'Chat session deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete chat session: ${error.message}`);
    }
  }

  // Archive a chat session
  static async archiveChatSession(sessionId, userId) {
    try {
      const session = await ChatSession.findOne({
        _id: sessionId,
        userId: userId
      });

      if (!session) {
        throw new Error('Chat session not found or access denied');
      }

      await session.archive();
      return session;
    } catch (error) {
      throw new Error(`Failed to archive chat session: ${error.message}`);
    }
  }

  // Get user's message usage stats
  static async getUserMessageStats(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await Message.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            userMessages: {
              $sum: { $cond: [{ $eq: ['$sender', 'user'] }, 1, 0] }
            },
            assistantMessages: {
              $sum: { $cond: [{ $eq: ['$sender', 'assistant'] }, 1, 0] }
            },
            totalTokens: { $sum: '$openaiData.tokens.total' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      return stats;
    } catch (error) {
      throw new Error(`Failed to get user message stats: ${error.message}`);
    }
  }

  // Search messages
  static async searchMessages(userId, query, options = {}) {
    try {
      const {
        limit = 20,
        sessionId = null,
        sender = null
      } = options;

      const searchQuery = {
        userId,
        content: { $regex: query, $options: 'i' }
      };

      if (sessionId) {
        searchQuery.sessionId = sessionId;
      }

      if (sender) {
        searchQuery.sender = sender;
      }

      const messages = await Message.find(searchQuery)
        .populate('sessionId', 'title')
        .sort({ createdAt: -1 })
        .limit(limit);

      return messages;
    } catch (error) {
      throw new Error(`Failed to search messages: ${error.message}`);
    }
  }
}

export default ChatService;
