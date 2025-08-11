import 'dotenv/config';
import { callOpenAI } from '../src/config/ai.js';

async function testOpenAI() {
  try {
    console.log('🔍 Testing OpenAI Connection...\n');
    
    // Log environment
    console.log('Environment Check:');
    console.log('API Key present:', !!process.env.OPENAI_API_KEY);
    console.log('API Key length:', process.env.OPENAI_API_KEY?.length);
    console.log('First 4 chars:', process.env.OPENAI_API_KEY?.substring(0, 4));
    console.log('\n');

    // Test message
    const messages = [
      {
        role: 'user',
        content: 'Bonjour Reine-Mère, comment allez-vous?'
      }
    ];

    console.log('📨 Sending test message to OpenAI...');
    const response = await callOpenAI(messages, false);
    
    console.log('\n✅ Response received:');
    console.log('Status: Success');
    console.log('Message:', response.choices[0].message.content);
    console.log('\nTokens used:', response.usage.total_tokens);

  } catch (error) {
    console.log('\n❌ Error occurred:');
    console.log('Error name:', error.name);
    console.log('Error message:', error.message);
    if (error.response) {
      console.log('\nAPI Response Details:');
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

testOpenAI(); 