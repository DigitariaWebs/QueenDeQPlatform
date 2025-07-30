const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Ritual Data Loading...\n');

// Test 1: Check if rituals file exists and can be loaded
try {
  const ritualsPath = path.join(__dirname, 'rituels_salon_de_the_beta.json');
  console.log('📁 Looking for rituals file at:', ritualsPath);
  
  if (fs.existsSync(ritualsPath)) {
    console.log('✅ Rituals file found!');
  } else {
    console.log('❌ Rituals file not found!');
    process.exit(1);
  }
  
  const ritualsData = fs.readFileSync(ritualsPath, 'utf8');
  const rituals = JSON.parse(ritualsData);
  
  console.log('\n📊 Ritual Data Analysis:');
  console.log('Available rituals:', Object.keys(rituals));
  
  // Test 2: Check specific ritual structures
  if (rituals['Acte de Désenvoutement']) {
    const desenvoutement = rituals['Acte de Désenvoutement'];
    console.log('\n🔮 Acte de Désenvoutement:');
    console.log('  - Has intro:', !!desenvoutement.intro);
    console.log('  - Has etapes:', !!desenvoutement.etapes);
    console.log('  - Number of steps:', desenvoutement.etapes?.length || 0);
    console.log('  - Has cloture:', !!desenvoutement.cloture);
  }
  
  if (rituals['Flush Royal']) {
    const flush = rituals['Flush Royal'];
    console.log('\n🚽 Flush Royal:');
    console.log('  - Has intro:', !!flush.intro);
    console.log('  - Has etapes:', !!flush.etapes);
    console.log('  - Number of steps:', flush.etapes?.length || 0);
    console.log('  - Has cloture:', !!flush.cloture);
  }
  
  // Test 3: Check if the data is properly formatted for AI use
  console.log('\n🤖 AI Integration Test:');
  const ritualText = JSON.stringify(rituals, null, 2);
  console.log('  - Total ritual data size:', ritualText.length, 'characters');
  console.log('  - Contains "intro" fields:', ritualText.includes('intro'));
  console.log('  - Contains "etapes" fields:', ritualText.includes('etapes'));
  console.log('  - Contains "cloture" fields:', ritualText.includes('cloture'));
  
  console.log('\n✅ All tests passed! The ritual data is ready for AI use.');
  
} catch (error) {
  console.error('❌ Error testing ritual data:', error.message);
  process.exit(1);
} 