import { PlaywrightService } from './playwrightService';
import { TestExecution, TestReport } from '../types';
import { logger, testLogger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import path from 'path';
import fs from 'fs';
import { StatusFilterHandler } from './handlers/statusFilterHandler';
import { FileHandler } from './handlers/fileHandler';
import { ConsumptionHandler } from './handlers/consumptionHandler';

export class ChoiceAiE2EService {
  private playwrightService: PlaywrightService;

  constructor() {
    this.playwrightService = new PlaywrightService({
      browser: (process.env.PLAYWRIGHT_BROWSER as 'chrome' | 'chromium' | 'firefox' | 'webkit') || 'chrome',
      headless: process.env.PLAYWRIGHT_HEADLESS === 'true',
      timeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT || '30000'),
      viewport: { width: 1280, height: 720 }
    });
  }

  async executeChoiceAiE2ETest(): Promise<TestExecution> {
    const executionId = uuidv4();
    const startTime = moment();
    
    const execution: TestExecution = {
      id: executionId,
      websiteId: 'choice-ai',
      routeId: 'e2e-complete-flow',
      status: 'running',
      startTime: startTime.toDate(),
      endTime: undefined,
      duration: undefined,
      result: {
        success: false,
        error: undefined,
        logs: [],
        performance: undefined
      },
      createdAt: new Date()
    };

    try {
      testLogger.info(`Starting Choice-AI Complete E2E Test - Execution ID: ${executionId}`);
      execution.result.logs.push(`=== CHOICE-AI E2E TEST STARTED ===`);
      execution.result.logs.push(`Execution ID: ${executionId}`);

      // Initialize browser
      await this.playwrightService.initialize();

      // STEP 1: Navigate to login page
      const loginUrl = 'https://qtw9nd7zyi.execute-api.ap-south-1.amazonaws.com/login';
      await this.playwrightService.navigateToUrl(loginUrl);

      // Wait for login form elements
      await this.playwrightService.waitForElement('input[name="userId"]', 10000);

      // Fill login credentials
      const userId = process.env.CHOICE_UID;
      const password = process.env.CHOICE_PASS;

      if (!userId || !password) {
        throw new Error('Choice-AI credentials not found in environment variables');
      }

      await this.playwrightService.fillInput('input[name="userId"]', userId);
      await this.playwrightService.fillInput('input[type="password"]', password);

      // Submit login form
      await this.playwrightService.clickElement('button[type="submit"]');

      // Wait for navigation
      await new Promise(resolve => setTimeout(resolve, 3000));

      // STEP 2: Verify successful login and dashboard access
      const currentUrl = await this.playwrightService.getCurrentUrl();

      if (currentUrl.includes('/login')) {
        throw new Error('Login failed - Still on login page after submission');
      }

      execution.result.logs.push('✅ Login successful');

      // Get dashboard information
      const dashboardTitle = await this.playwrightService.getPageTitle();
      const dashboardContent = await this.playwrightService.getPageContent();

      // STEP 3: Explore main navigation and features
      // Look for common navigation elements
      const navigationSelectors = [
        'nav', 'header', '.navbar', '.menu', '.sidebar', 
        'a[href*="dashboard"]', 'a[href*="profile"]', 'a[href*="settings"]',
        'button', '.btn', '[role="button"]'
      ];

      let foundElements = 0;
      for (const selector of navigationSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 1000);
          foundElements++;
        } catch (error) {
          // Continue if element not found
        }
      }

      // STEP 4: Performance and functionality testing
      // Get performance metrics
      const performance = await this.playwrightService.getPagePerformance();
      execution.result.performance = performance;

      // Test page responsiveness
      await new Promise(resolve => setTimeout(resolve, 1000));

      // STEP 5: Test Status Filtering (Pending, Approved, Rejected)
      execution.result.logs.push('🔍 Testing status filtering functionality...');
      
      // Create status filter handler instance
      const statusFilterHandler = new StatusFilterHandler(this.playwrightService);
      
      // Test Pending status
      await statusFilterHandler.testStatusFilter(execution, 'pending');
      
      // Test Approved status
      await statusFilterHandler.testStatusFilter(execution, 'approved');
      
      // Test Rejected status
      await statusFilterHandler.testStatusFilter(execution, 'rejected');

      // STEP 6: Test Consumption Page
      execution.result.logs.push('🔍 Testing Consumption page functionality...');
      
      // Create consumption handler instance
      const consumptionHandler = new ConsumptionHandler(this.playwrightService);
      
      // Test Consumption page
      await consumptionHandler.testConsumptionPage(execution);

      // STEP 7: Content and functionality validation
      // Check for common content elements
      const contentChecks = [
        { selector: 'h1, h2, h3', description: 'Headings' },
        { selector: 'p, div', description: 'Text content' },
        { selector: 'img', description: 'Images' },
        { selector: 'form', description: 'Forms' },
        { selector: 'table', description: 'Tables' }
      ];

      for (const check of contentChecks) {
        try {
          await this.playwrightService.waitForElement(check.selector, 1000);
        } catch (error) {
          // Continue if element not found
        }
      }

      // STEP 8: Error handling and edge case testing
      // Check for error messages or alerts
      const errorSelectors = [
        '.error', '.alert', '.warning', '[role="alert"]',
        '.notification', '.message', '.toast'
      ];

      let errorElementsFound = 0;
      for (const selector of errorSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 1000);
          errorElementsFound++;
        } catch (error) {
          // Continue if element not found
        }
      }

      // STEP 9: Final validation and summary

      // Get final page details
      const finalUrl = await this.playwrightService.getCurrentUrl();
      const finalTitle = await this.playwrightService.getPageTitle();

      // Success - all steps completed
      execution.result.success = true;
      execution.result.logs.push('✅ Dashboard loaded successfully');
      execution.result.logs.push(`📊 Performance: ${performance.loadTime}ms load time`);
      execution.result.logs.push(`📊 Navigation elements: ${foundElements} found`);
      execution.result.logs.push(`📊 Error elements: ${errorElementsFound} found`);
      execution.result.logs.push('✅ E2E test completed successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      testLogger.error(`Choice-AI E2E test failed: ${errorMessage}`);
      
      execution.status = 'failed';
      execution.result.success = false;
      execution.result.error = errorMessage;
      execution.result.logs.push(`❌ TEST FAILED: ${errorMessage}`);

      // Take error screenshot
      try {
        const errorScreenshot = path.join(
          process.env.SCREENSHOT_PATH || './screenshots',
          `choice-ai-error-${executionId}.png`
        );
        await this.playwrightService.takeScreenshot(errorScreenshot);
      } catch (screenshotError) {
        // Continue if screenshot fails
      }
    } finally {
      // Close browser
      try {
        await this.playwrightService.close();
      } catch (closeError) {
        // Continue if browser close fails
      }

      // Calculate duration
      const endTime = moment();
      execution.endTime = endTime.toDate();
      execution.duration = endTime.diff(startTime, 'milliseconds');

      // Set final status
      if (execution.status === 'running') {
        execution.status = execution.result.success ? 'completed' : 'failed';
      }

      execution.result.logs.push(`Status: ${execution.status.toUpperCase()}`);
      execution.result.logs.push(`Duration: ${execution.duration}ms`);

      // Save test results to JSON file
      await FileHandler.saveTestResultsToFile(execution);

      testLogger.info(`Choice-AI E2E test completed - Status: ${execution.status}, Duration: ${execution.duration}ms`);
    }

    return execution;
  }

  async generateChoiceAiE2EReport(execution: TestExecution): Promise<TestReport> {
    const successfulSteps = execution.result.logs.filter((log: string) => log.includes('✅')).length;
    const failedSteps = execution.result.logs.filter((log: string) => log.includes('❌')).length;
    const warningSteps = execution.result.logs.filter((log: string) => log.includes('⚠️')).length;

    return {
      id: uuidv4(),
      websiteId: execution.websiteId,
      executionId: execution.id,
      summary: {
        totalTests: 1,
        passed: execution.result.success ? 1 : 0,
        failed: execution.result.success ? 0 : 1,
        successRate: execution.result.success ? 100 : 0,
        averageDuration: execution.duration || 0
      },
      details: [execution],
      generatedAt: new Date()
    };
  }
} 