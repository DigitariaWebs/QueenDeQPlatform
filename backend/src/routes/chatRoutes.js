import express from 'express';
import { body, validationResult } from 'express-validator';
import { callOpenAI, extractSelectedArchetypeName, getArchetypeByName } from '../config/ai.js';


const router = express.Router();

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

    const responseData = {
      success: true,
      message: {
        role: 'assistant',
        content: finalContent,
        timestamp: new Date().toISOString()
      },
      usage: response.usage,
      // Non-breaking extras for Poiche selection flow
      selectionName,
      archetype: selectedArchetype
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

    // Send completion signal (with optional selection metadata)
    const completionData = {
      type: 'complete',
      fullMessage: fullResponse,
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

export default router; 