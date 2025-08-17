import express from 'express';
import { body, validationResult } from 'express-validator';
import { callOpenAI, extractSelectedArchetypeName, getArchetypeByName } from '../config/ai.js';
import ChatService from '../services/ChatService.js';
import { User, ChatSession, Message } from '../models/index.js';
import authenticate from '../middleware/auth.js';

const router = express.Router();

// Use real JWT-based middleware
const authenticateUser = authenticate;

// Render a readable, sectioned portrait using only JSON fields (no paraphrasing)
const renderArchetypePortrait = (a) => {
  if (!a) return '';

  const get = (k) => (a[k] !== undefined && a[k] !== null ? String(a[k]) : '');
  const has = (k) => a[k] !== undefined && a[k] !== null && String(a[k]).trim().length > 0;
  const title = `${get('nom')}${has('surnom') ? ` — ${get('surnom')}` : ''}`;
  const type = [a.niveau, 'de', a.famille].filter(Boolean).join(' ');

  const sections = [];
  sections.push(`🎴 ${title}`);
  sections.push(`Type: ${type}`);
  if (has('surnom_complementaire')) sections.push(`Alias: ${get('surnom_complementaire')}`);

  if (has('ce_quil_donne_au_debut') || has('ce_quil_veut_vraiment')) {
    sections.push('');
    sections.push('📝 Profil');
    if (has('ce_quil_donne_au_debut')) sections.push(`• Ce qu'il donne au début: ${get('ce_quil_donne_au_debut')}`);
    if (has('ce_quil_veut_vraiment')) sections.push(`• Ce qu'il veut vraiment: ${get('ce_quil_veut_vraiment')}`);
  }

  if (has('comportement_relationnel_typique')) {
    sections.push('');
    sections.push('🎮 Comportements typiques');
    sections.push(get('comportement_relationnel_typique'));
  }

  if (has('besoin_de_controle') || has('perte_de_controle')) {
    sections.push('');
    sections.push('🎚 Contrôle');
    if (has('besoin_de_controle')) sections.push(`• Besoin de contrôle: ${get('besoin_de_controle')}`);
    if (has('perte_de_controle')) sections.push(`• Perte de contrôle: ${get('perte_de_controle')}`);
  }

  if (Array.isArray(a.red_flags_recurrents) && a.red_flags_recurrents.length) {
    sections.push('');
    sections.push('🚩 Red flags récurrents');
    for (const rf of a.red_flags_recurrents) sections.push(`• ${rf}`);
  }

  if (has('leurres_ou_illusions')) {
    sections.push('');
    sections.push('🎭 Leurres / illusions');
    sections.push(get('leurres_ou_illusions'));
  }

  if (has('pourquoi_difficile_a_quitter')) {
    sections.push('');
    sections.push('🧲 Pourquoi difficile à quitter');
    sections.push(get('pourquoi_difficile_a_quitter'));
  }

  if (has('ce_que_ca_fait_vivre_a_la_queen')) {
    sections.push('');
    sections.push('💥 Ce que ça te fait vivre');
    sections.push(get('ce_que_ca_fait_vivre_a_la_queen'));
  }

  if (has('talon_dachille')) {
    sections.push('');
    sections.push("🕳 Talon d'Achille");
    sections.push(get('talon_dachille'));
  }

  if (has('face_cachee')) {
    sections.push('');
    sections.push('🫥 Face cachée');
    sections.push(get('face_cachee'));
  }

  if (has('evolution_possible')) {
    sections.push('');
    sections.push('🌱 Évolution possible');
    sections.push(get('evolution_possible'));
  }

  if (has('carte_miroir')) {
    sections.push('');
    sections.push('🪞 Carte miroir');
    sections.push(get('carte_miroir'));
  }

  if (has('conseil_reine_mere')) {
    sections.push('');
    sections.push('👑 Conseil Reine-Mère');
    sections.push(get('conseil_reine_mere'));
  }

  if (has('phrase_flush_royal')) {
    sections.push('');
    sections.push('🚽 Phrase Flush Royal');
    sections.push(get('phrase_flush_royal'));
  }

  if (has('verdict_final')) {
    sections.push('');
    sections.push('⚖️ Verdict final');
    sections.push(get('verdict_final'));
  }

  return sections.join('\n');
};

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
    .withMessage('Chat type must be either reine_mere or poiche'),
  body('sessionId')
    .optional()
    .isMongoId()
    .withMessage('Session ID must be a valid MongoDB ObjectId')
];

// Create new chat session
router.post('/sessions', authenticateUser, async (req, res) => {
  try {
    const { title, chatType = 'poiche' } = req.body;
    
    const session = await ChatService.createChatSession(
      req.user._id, 
      title || 'New Chat',
      { chatType }
    );
    
    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user's chat sessions
router.get('/sessions', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'active' } = req.query;
    
    const result = await ChatService.getUserChatSessions(req.user._id, {
      page: parseInt(page),
      limit: parseInt(limit),
      status
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific chat session with messages
router.get('/sessions/:sessionId', authenticateUser, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await ChatService.getChatSession(
      sessionId, 
      req.user._id, 
      true
    );
    
    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// Update session title
router.patch('/sessions/:sessionId', authenticateUser, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;
    
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }
    
    const session = await ChatService.updateSessionTitle(
      sessionId, 
      req.user._id, 
      title
    );
    
    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete chat session
router.delete('/sessions/:sessionId', authenticateUser, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await ChatService.deleteChatSession(
      sessionId, 
      req.user._id
    );
    
    res.json(result);
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Standard chat endpoint with session support
router.post('/chat', authenticateUser, validateChatMessage, async (req, res) => {
  try {
    // Header validation for mobile compatibility
    const userIdHeader = req.headers['x-user-id'];
    const apiVersion = req.headers['api-version'] || '1.0.0';
    // You can set your current API version here
    const CURRENT_API_VERSION = '1.0.0';
    if (!userIdHeader) {
      return res.status(400).json({
        success: false,
        error: 'Missing x-user-id header. Please update your app or browser.'
      });
    }
    if (apiVersion !== CURRENT_API_VERSION) {
      return res.status(426).json({
        success: false,
        error: `Unsupported API version. Please update your app. Required: ${CURRENT_API_VERSION}, received: ${apiVersion}`
      });
    }

    console.log('Received chat request:', {
      messagesCount: req.body.messages?.length,
      chatType: req.body.chatType || 'reine_mere',
      sessionId: req.body.sessionId,
      userId: req.user._id
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

    const { messages, chatType = 'reine_mere', sessionId } = req.body;

    let currentSession = null;
    
    // Get or create session
    if (sessionId) {
      try {
        currentSession = await ChatSession.findOne({
          _id: sessionId,
          userId: req.user._id,
          status: 'active'
        });
        
        if (!currentSession) {
          // Instead of throwing, return a clear error with redirect suggestion
          return res.status(404).json({
            success: false,
            error: 'Chat session not found',
            redirect: '/'
          });
        }
      } catch (error) {
        return res.status(404).json({
          success: false,
          error: 'Chat session not found',
          redirect: '/'
        });
      }
    } else {
      // Create new session from first user message
      const firstUserMessage = messages.find(m => m.role === 'user');
      const title = firstUserMessage?.content?.substring(0, 50) || 'New Chat';
      
      currentSession = await ChatService.createChatSession(
        req.user._id,
        title
      );
    }

    // Save user message to database
    const userMessage = messages[messages.length - 1]; // Get the latest user message
    if (userMessage.role === 'user') {
      await ChatService.addMessage(
        currentSession._id,
        req.user._id,
        userMessage.content,
        'user',
        {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip
        }
      );
    }

    const startTime = Date.now();

    // Call OpenAI with appropriate configuration
    const response = await callOpenAI(messages, false, chatType);
    const aiMessage = response.choices[0].message.content;
    const responseTime = Date.now() - startTime;
    
    console.log('OpenAI response received, length:', aiMessage.length, 'time:', responseTime + 'ms');

    // If Poiche, try to capture the selected archetype name from the model output
    let selectionName = null;
    let selectedArchetype = null;
    if (chatType === 'poiche') {
      const parsed = extractSelectedArchetypeName(aiMessage) || null;
      if (parsed) {
        selectedArchetype = getArchetypeByName(parsed) || null;
        // Use canonical name from JSON for display if found
        selectionName = selectedArchetype?.nom || parsed;
        console.log('Poiche selection parsed:', selectionName, 'found:', !!selectedArchetype);
      }
    }

    // If we have a selected archetype, append a server-rendered portrait to the assistant message
    const finalContent = selectedArchetype
      ? `${aiMessage}\n\n—\n${renderArchetypePortrait(selectedArchetype)}`
      : aiMessage;

    // Save assistant message to database
    await ChatService.addMessage(
      currentSession._id,
      req.user._id,
      finalContent,
      'assistant',
      {
        openaiData: {
          model: response.model,
          tokens: {
            prompt: response.usage?.prompt_tokens || 0,
            completion: response.usage?.completion_tokens || 0,
            total: response.usage?.total_tokens || 0
          },
          finishReason: response.choices[0]?.finish_reason,
          responseTime
        }
      }
    );

    const responseData = {
      success: true,
      message: {
        role: 'assistant',
        content: finalContent,
        timestamp: new Date().toISOString()
      },
      sessionId: currentSession._id,
      usage: response.usage,
      // Non-breaking extras for Poiche selection flow
      selectionName,
      archetype: selectedArchetype
    };

    console.log('Sending response:', {
      success: true,
      messageLength: aiMessage.length,
      chatType: chatType,
      sessionId: currentSession._id
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

// Streaming chat endpoint with session support
router.post('/chat/stream', authenticateUser, validateChatMessage, async (req, res) => {
  try {
    console.log('Received streaming request:', {
      messagesCount: req.body.messages?.length,
      chatType: req.body.chatType || 'reine_mere',
      sessionId: req.body.sessionId,
      userId: req.user._id
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

    const { messages, chatType = 'reine_mere', sessionId } = req.body;

    let currentSession = null;
    
    // Get or create session
    if (sessionId) {
      currentSession = await ChatSession.findOne({
        _id: sessionId,
        userId: req.user._id,
        status: 'active'
      });
      
      if (!currentSession) {
        return res.status(404).json({
          success: false,
          error: 'Chat session not found'
        });
      }
    } else {
      // Create new session from first user message
      const firstUserMessage = messages.find(m => m.role === 'user');
      const title = firstUserMessage?.content?.substring(0, 50) || 'New Chat';
      
      currentSession = await ChatService.createChatSession(
        req.user._id,
        title
      );
    }

    // Save user message to database
    const userMessage = messages[messages.length - 1];
    if (userMessage.role === 'user') {
      await ChatService.addMessage(
        currentSession._id,
        req.user._id,
        userMessage.content,
        'user',
        {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip
        }
      );
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const startTime = Date.now();

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
          sessionId: currentSession._id,
          timestamp: new Date().toISOString()
        };
        console.log('Sending chunk, length:', content.length);
        res.write(JSON.stringify(chunkData) + '\n');
      }
    }

    const responseTime = Date.now() - startTime;

    // If Poiche, try to capture the selected archetype from the full streamed message
    let selectionName = null;
    let selectedArchetype = null;
    if (chatType === 'poiche') {
      const parsed = extractSelectedArchetypeName(fullResponse) || null;
      if (parsed) {
        selectedArchetype = getArchetypeByName(parsed) || null;
        selectionName = selectedArchetype?.nom || parsed;
        if (selectedArchetype) {
          // Append a server-rendered portrait to the final message for clients that only read the completion
          fullResponse = `${fullResponse}\n\n—\n${renderArchetypePortrait(selectedArchetype)}`;
        }
      }
    }

    // Save assistant message to database
    await ChatService.addMessage(
      currentSession._id,
      req.user._id,
      fullResponse,
      'assistant',
      {
        openaiData: {
          responseTime
        }
      }
    );

    // Send completion signal (with optional selection metadata)
    const completionData = {
      type: 'complete',
      fullMessage: fullResponse,
      sessionId: currentSession._id,
      selectionName,
      archetype: selectedArchetype,
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

// Search messages across user's sessions
router.get('/search', authenticateUser, async (req, res) => {
  try {
    const { q: query, limit = 20, sessionId } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const results = await ChatService.searchMessages(req.user._id, query, {
      limit: parseInt(limit),
      sessionId
    });
    
    res.json({
      success: true,
      results,
      query
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user's message usage statistics
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const stats = await ChatService.getUserMessageStats(req.user._id, parseInt(days));
    
    res.json({
      success: true,
      stats,
      user: {
        role: req.user.role,
        isPremium: req.user.isPremium
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router; 