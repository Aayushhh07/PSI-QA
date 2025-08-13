const axios = require('axios');

async function testOpticallLogin() {
  try {
    console.log('🚀 Testing Opticall Login...');
    
    const response = await axios.post('http://localhost:3000/api/opticall/e2e', {}, {
      timeout: 120000 // 2 minutes timeout
    });
    
    console.log('✅ Test completed successfully!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testOpticallLogin();
