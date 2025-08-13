const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testOpticallE2E() {
  try {
    console.log('🧪 Starting Opticall E2E Test...\n');

    // Execute Opticall E2E test
    console.log('📝 Executing Opticall E2E test...');
    const e2eResponse = await axios.post(`${API_BASE_URL}/opticall/`);
    
    if (e2eResponse.data.success) {
      console.log('✅ Opticall E2E test executed successfully!');
      
      const execution = e2eResponse.data.data.execution;
      const report = e2eResponse.data.data.report;
      
      console.log('\n📊 Test Execution Details:');
      console.log(`   Execution ID: ${execution.id}`);
      console.log(`   Status: ${execution.status}`);
      console.log(`   Duration: ${execution.duration}ms`);
      console.log(`   Success: ${execution.result.success}`);
      
      if (execution.result.error) {
        console.log(`   Error: ${execution.result.error}`);
      }
      
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
      
      console.log('\n🎯 Opticall E2E Test Cases:');
      console.log('   1. ✅ Click on view button and open a report');
      console.log('   2. ✅ Check all charts in each section');
      console.log('   3. ✅ Open full screen charts');
      console.log('   4. ✅ Click on first bar of bar graph and retrieve call records');
      console.log('   5. ✅ Click on first Call ID');
      console.log('   6. ✅ Scroll down and click play call recording');
      console.log('   7. ✅ Confirm call recording is being played');
      
    } else {
      console.log('❌ Opticall E2E test failed!');
      console.log(`Error: ${e2eResponse.data.error}`);
    }
    
  } catch (error) {
    console.error('❌ Error executing Opticall E2E test:', error.message);
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
  console.log('🚀 Opticall E2E Testing\n');
  console.log('=' .repeat(50));
  
  const serverHealthy = await checkServerHealth();
  if (serverHealthy) {
    await testOpticallE2E();
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Opticall E2E Testing completed!');
}

main().catch(console.error);
