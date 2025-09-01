import fetch from 'node-fetch';

async function testPoicheOnly() {
  console.log('🎴 Testing Poiche System Only...\n');
  
  // First, test if server is running
  try {
    console.log('🔍 Checking if server is running...');
    const healthResponse = await fetch('http://localhost:5000/api/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Server is running:', healthData.message);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
      return;
    }
  } catch (error) {
    console.log('❌ Cannot connect to server. Make sure it\'s running on port 5001');
    console.log('Run: npm run dev');
    return;
  }
  
  const poicheTest = {
    messages: [
      {
        role: 'user',
        content: "Debut"
      }
    ],
    chatType: 'poiche'
  };
  
  try {
    console.log('📤 Sending poiche test...');
    
    const response = await fetch('http://localhost:5000/api/ai/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token', // Required for authentication
        'x-user-id': '68989ac1a5af8810fb2ae4c2' // Real user ID from database
      },
      body: JSON.stringify(poicheTest)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Poiche System Working');
      console.log('📋 Response preview:', data.message?.content?.substring(0, 300) + '...');
      
      if (data.selectionName) {
        console.log('🎭 Archetype Selected:', data.selectionName);
      }
      
      if (data.sessionId) {
        console.log('💬 Session ID:', data.sessionId);
      }
    } else {
      const errorData = await response.text();
      console.log('❌ Poiche system error:', response.status);
      console.log('📄 Error details:', errorData);
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

testPoicheOnly(); 