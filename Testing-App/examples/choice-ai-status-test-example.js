const { ChoiceAiE2EService } = require('../dist/services/choiceAiE2EService');

async function testChoiceAiStatusFiltering() {
  console.log('🚀 Starting Choice-AI Status Filtering Test...');
  
  const service = new ChoiceAiE2EService();
  
  try {
    // Execute the E2E test with status filtering
    const execution = await service.executeChoiceAiE2ETest();
    
    console.log('\n📊 Test Results:');
    console.log(`Status: ${execution.status}`);
    console.log(`Success: ${execution.result.success}`);
    console.log(`Duration: ${execution.duration}ms`);
    
    if (execution.result.error) {
      console.log(`Error: ${execution.result.error}`);
    }
    
    console.log('\n📝 Test Logs:');
    execution.result.logs.forEach((log, index) => {
      console.log(`${index + 1}. ${log}`);
    });
    
    // Generate and display report
    const report = await service.generateChoiceAiE2EReport(execution);
    
    console.log('\n📈 Test Report:');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Success Rate: ${report.summary.successRate}%`);
    console.log(`Average Duration: ${report.summary.averageDuration}ms`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testChoiceAiStatusFiltering(); 