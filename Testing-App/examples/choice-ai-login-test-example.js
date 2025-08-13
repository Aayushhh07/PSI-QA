const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testChoiceAiLogin() {
  try {
    console.log('🧪 Starting Choice-AI Login Test...\n');

    // Execute Choice-AI login test
    console.log('📝 Executing Choice-AI login test...');
    const loginResponse = await axios.post(`${API_BASE_URL}/choice-ai/login`);
    
    if (loginResponse.data.success) {
      console.log('✅ Choice-AI login test executed successfully!');
      
      const execution = loginResponse.data.data.execution;
      const report = loginResponse.data.data.report;
      
      console.log('\n📊 Test Execution Details:');
      console.log(`   Execution ID: ${execution.id}`);
      console.log(`   Status: ${execution.status}`);
      console.log(`   Duration: ${execution.duration}ms`);
      console.log(`   Success: ${execution.result.success}`);
      
      if (execution.result.error) {
        console.log(`   Error: ${execution.result.error}`);
      }
      
      console.log(`   Screenshot: ${execution.result.screenshotPath || 'None'}`);
      
      if (execution.result.performance) {
        console.log(`   Load Time: ${execution.result.performance.loadTime}ms`);
        console.log(`   DOM Content Loaded: ${execution.result.performance.domContentLoaded}ms`);
        console.log(`   First Contentful Paint: ${execution.result.performance.firstContentfulPaint}ms`);
      }
      
      console.log('\n📋 Test Report Summary:');
      console.log(`   Total Tests: ${report.summary.totalTests}`);
      console.log(`   Passed: ${report.summary.passed}`);
      console.log(`   Failed: ${report.summary.failed}`);
      console.log(`   Success Rate: ${report.summary.successRate}%`);
      console.log(`   Average Duration: ${report.summary.averageDuration}ms`);
      
      console.log('\n📝 Test Logs:');
      execution.result.logs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log}`);
      });
      
      if (execution.result.screenshotPath) {
        console.log('\n📸 Screenshot saved to:');
        console.log(`   - ${execution.result.screenshotPath}`);
      }
      
    } else {
      console.log('❌ Choice-AI login test failed!');
      console.log(`Error: ${loginResponse.data.error}`);
    }
    
  } catch (error) {
    console.error('❌ Error executing Choice-AI login test:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Check if server is running
async function checkServerHealth() {
  try {
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ Server is running and healthy!');
    return true;
  } catch (error) {
    console.error('❌ Server is not running. Please start the server first:');
    console.error('   npm start');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Choice-AI Login Testing\n');
  console.log('=' .repeat(50));
  
  const serverHealthy = await checkServerHealth();
  if (serverHealthy) {
    await testChoiceAiLogin();
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Choice-AI Login Testing completed!');
}

main().catch(console.error); 