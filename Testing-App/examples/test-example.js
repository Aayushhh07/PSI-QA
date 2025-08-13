const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function runExample() {
  try {
    console.log('🚀 Starting Automated Testing Example...\n');

    // 1. Get all websites
    console.log('1. Getting all websites...');
    const websitesResponse = await axios.get(`${BASE_URL}/websites`);
    console.log('Websites:', websitesResponse.data.data);
    console.log('');

    // 2. Add a new website
    console.log('2. Adding a new website...');
    const newWebsite = {
      name: 'Test Website',
      baseUrl: 'https://httpbin.org',
      description: 'A test website for demonstration'
    };
    const addWebsiteResponse = await axios.post(`${BASE_URL}/websites`, newWebsite);
    console.log('Added website:', addWebsiteResponse.data.data);
    console.log('');

    // 3. Add a route to the website
    console.log('3. Adding a route to the website...');
    const newRoute = {
      path: '/get',
      method: 'GET',
      name: 'API Test Route',
      description: 'Test the /get endpoint',
      expectedStatus: 200,
      screenshot: true
    };
    const websiteId = addWebsiteResponse.data.data.id;
    const addRouteResponse = await axios.post(`${BASE_URL}/websites/${websiteId}/routes`, newRoute);
    console.log('Added route:', addRouteResponse.data.data);
    console.log('');

    // 4. Execute a test
    console.log('4. Executing a test...');
    const testRequest = {
      websiteId: websiteId,
      routeId: addRouteResponse.data.data.id,
      screenshot: true,
      playwrightConfig: {
        browser: 'chromium',
        headless: true,
        timeout: 30000
      }
    };
    const executeTestResponse = await axios.post(`${BASE_URL}/tests/execute`, testRequest);
    console.log('Test execution started:', executeTestResponse.data.data);
    console.log('');

    // 5. Wait a moment and get the execution result
    console.log('5. Waiting for test to complete...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const executionId = executeTestResponse.data.data.id;
    const executionResponse = await axios.get(`${BASE_URL}/tests/executions/${executionId}`);
    console.log('Test execution result:', executionResponse.data.data);
    console.log('');

    // 6. Get website summary
    console.log('6. Getting website summary...');
    const summaryResponse = await axios.get(`${BASE_URL}/reports/website/${websiteId}/summary`);
    console.log('Website summary:', summaryResponse.data.data);
    console.log('');

    // 7. Get system summary
    console.log('7. Getting system summary...');
    const systemSummaryResponse = await axios.get(`${BASE_URL}/reports/system/summary`);
    console.log('System summary:', systemSummaryResponse.data.data);
    console.log('');

    console.log('✅ Example completed successfully!');

  } catch (error) {
    console.error('❌ Error running example:', error.response?.data || error.message);
  }
}

// Run the example
runExample(); 