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
  body('mode')
    .optional()
    .isIn(['default', 'dreamsInterpreter', 'mysticalGuide'])
    .withMessage('Invalid mode specified')
];

// Standard chat endpoint
router.post('/chat', validateChatMessage, async (req, res) => {
  try {
    console.log('Received chat request:', {
      mode: req.body.mode,
      messagesCount: req.body.messages?.length
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

    const { messages, mode = 'default' } = req.body;

    // Call OpenAI with Reine-Mère configuration
    console.log('Calling OpenAI with mode:', mode);
    const response = await callOpenAI(messages, mode, false);
    
    const aiMessage = response.choices[0].message.content;
    console.log('OpenAI response received, length:', aiMessage.length);

    const responseData = {
      success: true,
      message: {
        role: 'assistant',
        content: aiMessage,
        timestamp: new Date().toISOString(),
        mode: mode
      },
      usage: response.usage
    };

    console.log('Sending response:', {
      success: true,
      messageLength: aiMessage.length,
      mode: mode
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
      mode: req.body.mode,
      messagesCount: req.body.messages?.length
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

    const { messages, mode = 'default' } = req.body;

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Call OpenAI with streaming
    console.log('Starting OpenAI stream with mode:', mode);
    const stream = await callOpenAI(messages, mode, true);

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
      mode: mode,
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

// Get available modes endpoint
router.get('/modes', (req, res) => {
  console.log('Fetching available modes');
  const { SYSTEM_PROMPTS } = require('../config/ai');
  
  const modes = Object.keys(SYSTEM_PROMPTS).map(key => ({
    id: key,
    name: SYSTEM_PROMPTS[key].name,
    isDefault: key === 'default'
  }));

  console.log('Available modes:', modes);
  res.json({
    success: true,
    modes: modes
  });
});

// Test OpenAI connection
router.get('/test', async (req, res) => {
  try {
    console.log('Testing OpenAI connection...');
    
    const testMessages = [
      { role: 'user', content: 'Bonjour, es-tu là?' }
    ];

    const response = await callOpenAI(testMessages, 'default', false);
    
    res.json({
      success: true,
      message: response.choices[0].message.content,
      model: response.model,
      usage: response.usage
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      type: error.type,
      code: error.code
    });
  }
});

module.exports = router; 