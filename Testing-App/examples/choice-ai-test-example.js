const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testChoiceAiE2E() {
  try {
    console.log('🧪 Starting Choice-AI Complete E2E Test...\n');

    // Execute Choice-AI complete E2E test
    console.log('📝 Executing Choice-AI complete E2E test...');
    const e2eResponse = await axios.post(`${API_BASE_URL}/choice-ai/`);
    
    if (e2eResponse.data.success) {
      console.log('✅ Choice-AI complete E2E test executed successfully!');
      
      const execution = e2eResponse.data.data.execution;
      const report = e2eResponse.data.data.report;
      
      console.log('\n📊 Test Execution Details:');
      console.log(`   Execution ID: ${execution.id}`);
      console.log(`   Status: ${execution.status}`);
      console.log(`   Duration: ${execution.duration}ms`);
      console.log(`   Success: ${execution.results.success}`);
      
      if (execution.results.error) {
        console.log(`   Error: ${execution.results.error}`);
      }
      
      console.log(`   Screenshots: ${execution.results.screenshots.length} taken`);
      
      if (execution.results.performance) {
        console.log(`   Load Time: ${execution.results.performance.loadTime}ms`);
        console.log(`   DOM Content Loaded: ${execution.results.performance.domContentLoaded}ms`);
        console.log(`   First Contentful Paint: ${execution.results.performance.firstContentfulPaint}ms`);
      }
      
      console.log('\n📋 Test Report Summary:');
      console.log(`   Total Steps: ${report.summary.totalSteps}`);
      console.log(`   Successful Steps: ${report.summary.successfulSteps}`);
      console.log(`   Failed Steps: ${report.summary.failedSteps}`);
      console.log(`   Warning Steps: ${report.summary.warningSteps}`);
      console.log(`   Screenshots Taken: ${report.summary.screenshotsTaken}`);
      
      console.log('\n📝 Test Logs:');
      execution.logs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log}`);
      });
      
      if (execution.results.screenshots.length > 0) {
        console.log('\n📸 Screenshots saved to:');
        execution.results.screenshots.forEach(screenshot => {
          console.log(`   - ${screenshot}`);
        });
      }
      
    } else {
      console.log('❌ Choice-AI complete E2E test failed!');
      console.log(`Error: ${e2eResponse.data.error}`);
    }
    
  } catch (error) {
    console.error('❌ Error executing Choice-AI complete E2E test:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

async function getChoiceAiE2ETestHistory() {
  try {
    console.log('\n📚 Getting Choice-AI E2E test history...');
    
    const historyResponse = await axios.get(`${API_BASE_URL}/choice-ai/e2e/history`);
    
    if (historyResponse.data.success) {
      const history = historyResponse.data.data;
      console.log('✅ E2E test history retrieved successfully!');
      console.log(`   Website: ${history.website}`);
      console.log(`   Test Type: ${history.testType}`);
      console.log(`   Total Tests: ${history.totalTests}`);
      console.log(`   Successful Tests: ${history.successfulTests}`);
      console.log(`   Failed Tests: ${history.failedTests}`);
      console.log(`   Average Duration: ${history.averageDuration}ms`);
      console.log(`   Last Test Date: ${history.lastTestDate || 'No tests yet'}`);
    } else {
      console.log('❌ Failed to get E2E test history');
      console.log(`Error: ${historyResponse.data.error}`);
    }
    
  } catch (error) {
    console.error('❌ Error getting E2E test history:', error.message);
  }
}

// Run the tests
async function runChoiceAiE2ETests() {
  console.log('🚀 Choice-AI Complete E2E Testing Suite\n');
  console.log('=' .repeat(50));
  
  await testChoiceAiE2E();
  await getChoiceAiE2ETestHistory();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Choice-AI Complete E2E Testing Suite completed!');
}

// Check if server is running
async function checkServerHealth() {
  try {
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ Server is running and healthy!');
    return true;
  } catch (error) {
    console.error('❌ Server is not running. Please start the server first:');
    console.error('   npm run dev');
    return false;
  }
}

// Main execution
async function main() {
  const serverHealthy = await checkServerHealth();
  if (serverHealthy) {
    await runChoiceAiE2ETests();
  }
}

main().catch(console.error); 