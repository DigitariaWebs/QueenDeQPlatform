const fetch = require('node-fetch');

async function testBothSystems() {
  console.log('🧪 Final Test - Both Chat Systems...\n');
  
  // Test 1: Ritual System
  console.log('🔮 Testing Ritual System (reine_mere)...');
  const ritualTest = {
    messages: [{ role: 'user', content: "Je n'arrive pas à lâcher prise avec quelqu'un" }],
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
      console.log('✅ Ritual System: WORKING');
      console.log('Preview:', ritualData.message?.content?.substring(0, 100) + '...');
    } else {
      console.log('❌ Ritual System: FAILED');
    }
  } catch (error) {
    console.log('❌ Ritual System: ERROR -', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Poiche System
  console.log('🎴 Testing Poiche System (poiche)...');
  const poicheTest = {
    messages: [{ role: 'user', content: "Je veux que tu lises la carte de mon mec" }],
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
      console.log('✅ Poiche System: WORKING');
      console.log('Preview:', poicheData.message?.content?.substring(0, 100) + '...');
    } else {
      console.log('❌ Poiche System: FAILED');
    }
  } catch (error) {
    console.log('❌ Poiche System: ERROR -', error.message);
  }
  
  console.log('\n🎉 Test completed!');
}

testBothSystems(); 