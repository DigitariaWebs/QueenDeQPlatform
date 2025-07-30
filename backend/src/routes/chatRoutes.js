const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { callOpenAI } = require('../config/ai');

// Validation middleware for chat messages
const validateChatMessage = [
  body('messages')
    .isArray()
    .withMessage('Messages must be an array')
    .custom((messages) => {
      if (!messages.length) {
        throw new Error('Messages array cannot be empty');
      }
      for (const message of messages) {
        if (!message.role || !message.content) {
          throw new Error('Each message must have role and content');
        }
        if (!['user', 'assistant'].includes(message.role)) {
          throw new Error('Message role must be either user or assistant');
        }
      }
      return true;
    }),
  body('chatType')
    .optional()
    .isIn(['reine_mere', 'poiche'])
    .withMessage('Chat type must be either reine_mere or poiche')
];

// Standard chat endpoint
router.post('/chat', validateChatMessage, async (req, res) => {
  try {
    console.log('Received chat request:', {
      messagesCount: req.body.messages?.length,
      chatType: req.body.chatType || 'reine_mere'
    });

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Invalid request format',
        details: errors.array()
      });
    }

    const { messages, chatType = 'reine_mere' } = req.body;

    // Call OpenAI with appropriate configuration
    const response = await callOpenAI(messages, false, chatType);
    const aiMessage = response.choices[0].message.content;
    console.log('OpenAI response received, length:', aiMessage.length);

    const responseData = {
      success: true,
      message: {
        role: 'assistant',
        content: aiMessage,
        timestamp: new Date().toISOString()
      },
      usage: response.usage
    };

    console.log('Sending response:', {
      success: true,
      messageLength: aiMessage.length,
      chatType: chatType
    });

    res.json(responseData);

  } catch (error) {
    console.error('Chat endpoint error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      type: error.type
    });
    
    res.status(500).json({
      success: false,
      error: error.message || 'Une erreur est survenue. La Reine-Mère vous prie de l\'excuser.',
      fallbackMessage: "Pardonne-moi, ma chère âme, mais je rencontre quelques difficultés en ce moment. Peux-tu réessayer dans quelques instants ?"
    });
  }
});

// Streaming chat endpoint
router.post('/chat/stream', validateChatMessage, async (req, res) => {
  try {
    console.log('Received streaming request:', {
      messagesCount: req.body.messages?.length,
      chatType: req.body.chatType || 'reine_mere'
    });

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Invalid request format',
        details: errors.array()
      });
    }

    const { messages, chatType = 'reine_mere' } = req.body;

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Call OpenAI with streaming and appropriate chat type
    const stream = await callOpenAI(messages, true, chatType);

    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        // Send each chunk to the client
        const chunkData = {
          type: 'chunk',
          content: content,
          timestamp: new Date().toISOString()
        };
        console.log('Sending chunk, length:', content.length);
        res.write(JSON.stringify(chunkData) + '\n');
      }
    }

    // Send completion signal
    const completionData = {
      type: 'complete',
      fullMessage: fullResponse,
      timestamp: new Date().toISOString()
    };
    console.log('Stream complete, total length:', fullResponse.length);
    res.write(JSON.stringify(completionData) + '\n');

    res.end();

  } catch (error) {
    console.error('Stream endpoint error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      type: error.type
    });
    // Send error in streaming format
    const errorData = {
      type: 'error',
      error: error.message || 'Une erreur est survenue. La Reine-Mère vous prie de l\'excuser.',
      fallbackMessage: "Pardonne-moi, ma chère âme, mais je rencontre quelques difficultés en ce moment. Peux-tu réessayer dans quelques instants ?",
      timestamp: new Date().toISOString()
    };
    res.write(JSON.stringify(errorData) + '\n');
    res.end();
  }
});

module.exports = router; 