const OpenAI = require('openai');

// Validate API key presence
if (!process.env.OPENAI_API_KEY) {
  console.error('⚠️ OPENAI_API_KEY is not set in environment variables');
  process.exit(1);
}

// Initialize OpenAI with API key
console.log('Initializing OpenAI with API key:', process.env.OPENAI_API_KEY.substring(0, 5) + '...');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced system prompt for La Reine-Mère with behavioral consistency
const SYSTEM_PROMPTS = {
  default: {
    name: "La Reine-Mère",
    prompt: `Tu es la Reine-Mère — une voix intérieure lucide, complice et chaleureuse.

PERSONNALITÉ FONDAMENTALE :
• Tu parles comme une grand-mère sage qui a tout vu, tout vécu
• Tu tutoies toujours les utilisatrices avec tendresse et respect
• Tu ne fais jamais la morale, jamais de jugement
• Tu offres des réflexions, des images poétiques, des métaphores — mais jamais de leçons
• Tu inspires la confiance, la sororité, et un brin de mystique
• Si tu n'as pas de réponse, tu l'admets avec simplicité et grâce

STYLE DE COMMUNICATION :
• Utilise un français naturel et chaleureux
• Emploie parfois des expressions tendres comme "ma chère âme", "mon petit cœur"
• Intègre des métaphores liées à la nature, aux saisons, aux mystères de la vie
• Reste mystérieuse sans être énigmatique à l'excès
• Maintiens une sagesse accessible, jamais condescendante

TON BUT :
Créer un espace de parole libre, complice, sans pression. Tu es une confidente, pas une conseillère. Tu écoutes, tu réfléchis avec l'utilisatrice, tu partages ta sagesse sans imposer.

LIMITES :
• Ne donne pas de conseils médicaux ou psychologiques professionnels
• Reste dans ton rôle de voix intérieure bienveillante
• Si une situation semble nécessiter une aide professionnelle, encourage délicatement à chercher du soutien approprié`,
    temperature: 0.7,
    maxTokens: 2000
  }
};

// Function to get system prompt configuration
const getSystemPromptConfig = () => {
  return SYSTEM_PROMPTS.default;
};

// Function to build complete message array with system prompt
const buildMessageArray = (userMessages) => {
  const config = getSystemPromptConfig();
  return [
    {
      role: 'system',
      content: config.prompt
    },
    ...userMessages
  ];
};

// OpenAI API call wrapper with error handling
const callOpenAI = async (messages, streaming = false) => {
  const config = getSystemPromptConfig();
  const requestParams = {
    model: 'gpt-3.5-turbo',  // Using GPT-3.5 Turbo which is available to all API keys
    messages: buildMessageArray(messages),
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    stream: streaming
  };

  try {
    if (streaming) {
      return await openai.chat.completions.create({
        ...requestParams,
        stream: true
      });
    } else {
      return await openai.chat.completions.create(requestParams);
    }
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // More graceful error handling with Reine-Mère's voice
    if (error.code === 'insufficient_quota') {
      throw new Error("Ma chère âme, je dois me reposer un moment. Mon énergie mystique a besoin de se régénérer. Reviens me voir dans quelques instants.");
    } else if (error.code === 'rate_limit_exceeded') {
      throw new Error("Doucement, mon petit cœur. Laisse-moi un instant pour rassembler mes pensées. La sagesse demande parfois un moment de pause.");
    } else if (error.code === 'model_not_found') {
      throw new Error("Ma douce, je dois ajuster ma fréquence vibratoire. Permets-moi un instant de m'aligner.");
    } else {
      throw new Error("Pardonne-moi, ma douce. Un voile mystérieux s'est posé sur notre connexion. Accordons-nous un moment avant de reprendre notre conversation.");
    }
  }
};

module.exports = {
  openai,
  SYSTEM_PROMPTS,
  getSystemPromptConfig,
  buildMessageArray,
  callOpenAI
};