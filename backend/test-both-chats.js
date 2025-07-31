import fetch from 'node-fetch';

async function testBothChatSystems() {
  console.log('🧪 Testing Both Chat Systems...\n');
  
  // Test 1: Ritual System (reine_mere)
  console.log('🔮 Testing Ritual System (reine_mere)...');
  const ritualTest = {
    messages: [
      {
        role: 'user',
        content: "Je n'arrive pas à lâcher prise avec quelqu'un qui ne me traite pas bien"
      }
    ],
    chatType: 'reine_mere'
  };
  
  try {
    const ritualResponse = await fetch('http://localhost:5000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ritualTest)
    });
    
    if (ritualResponse.ok) {
      const ritualData = await ritualResponse.json();
      console.log('✅ Ritual System Working');
      console.log('Response preview:', ritualData.message?.content?.substring(0, 150) + '...');
      
      // Check for ritual-specific content
      const content = ritualData.message?.content || '';
      if (content.includes('Désenvoûtement') || content.includes('Flush') || content.includes('rituel')) {
        console.log('🎯 Ritual content detected!');
      }
    } else {
      console.log('❌ Ritual system error:', ritualResponse.status);
    }
  } catch (error) {
    console.log('❌ Ritual system network error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Poiche System (poiche)
  console.log('🎴 Testing Poiche System (poiche)...');
  const poicheTest = {
    messages: [
      {
        role: 'user',
        content: "Je veux que tu lises la carte de mon mec"
      }
    ],
    chatType: 'poiche'
  };
  
  try {
    const poicheResponse = await fetch('http://localhost:5000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(poicheTest)
    });
    
    if (poicheResponse.ok) {
      const poicheData = await poicheResponse.json();
      console.log('✅ Poiche System Working');
      console.log('Response preview:', poicheData.message?.content?.substring(0, 150) + '...');
      
      // Check for poiche-specific content
      const content = poicheData.message?.content || '';
      if (content.includes('Queen') || content.includes('questions') || content.includes('carte')) {
        console.log('🎯 Poiche content detected!');
      }
    } else {
      console.log('❌ Poiche system error:', poicheResponse.status);
    }
  } catch (error) {
    console.log('❌ Poiche system network error:', error.message);
  }
  
  console.log('\n🎉 Test completed!');
}

// Run the test
testBothChatSystems(); 