const axios = require('axios');

async function testOpticallChartInteraction() {
  try {
    console.log('🚀 Testing Opticall Chart Interaction...');
    console.log('This will test the updated bar chart clicking functionality');
    
    const response = await axios.post('http://localhost:3000/api/opticall/e2e', {}, {
      timeout: 180000 // 3 minutes timeout for full test
    });
    
    console.log('✅ Test completed successfully!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    // Check if the chart interaction was successful
    const logs = response.data.result?.logs || [];
    const chartInteractionLogs = logs.filter(log => 
      log.includes('first bar') || 
      log.includes('first data point') || 
      log.includes('Chart Interaction')
    );
    
    if (chartInteractionLogs.length > 0) {
      console.log('🎯 Chart interaction logs found:');
      chartInteractionLogs.forEach(log => console.log(`  - ${log}`));
    }
    
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
testOpticallChartInteraction();
