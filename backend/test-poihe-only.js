import fetch from 'node-fetch';

async function testPoicheOnly() {
  console.log('🎴 Testing Poiche System Only...\n');
  
  const poicheTest = {
    messages: [
      {
        role: 'user',
        content: "Bonjour"
      }
    ],
    chatType: 'poiche'
  };
  
  try {
    console.log('📤 Sending simple test to poiche system...');
    
    const response = await fetch('http://localhost:5000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(poicheTest)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Poiche System Working');
      console.log('Response:', data.message?.content?.substring(0, 200) + '...');
    } else {
      const errorData = await response.text();
      console.log('❌ Poiche system error:', response.status);
      console.log('Error details:', errorData);
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

testPoicheOnly(); 