import { PlaywrightService } from './playwrightService';
import { TestExecution, TestReport } from '../types';
import { logger, testLogger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import path from 'path';
import fs from 'fs';

export class ChoiceAiTestService {
  private playwrightService: PlaywrightService;

  constructor() {
    this.playwrightService = new PlaywrightService({
      browser: (process.env.PLAYWRIGHT_BROWSER as 'chrome' | 'chromium' | 'firefox' | 'webkit') || 'chrome',
      headless: process.env.PLAYWRIGHT_HEADLESS === 'true',
      timeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT || '30000'),
      viewport: { width: 1280, height: 720 }
    });
  }

  async executeChoiceAiLoginTest(): Promise<TestExecution> {
    const executionId = uuidv4();
    const startTime = new Date();
    
    const execution: TestExecution = {
      id: executionId,
      websiteId: 'choice-ai',
      routeId: 'login',
      status: 'running',
      startTime: startTime,
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
      testLogger.info(`Starting Choice-AI login test - Execution ID: ${executionId}`);
      execution.result.logs.push(`Test started at ${moment(startTime).format('YYYY-MM-DD HH:mm:ss')}`);

      // Initialize browser
      await this.playwrightService.initialize();
      execution.result.logs.push('Browser initialized successfully');

      // Navigate to login page
      const loginUrl = 'https://qtw9nd7zyi.execute-api.ap-south-1.amazonaws.com/login';
      await this.playwrightService.navigateToUrl(loginUrl);
      execution.result.logs.push(`Navigated to login page: ${loginUrl}`);

      // Wait for page to load and verify we're on login page
      await this.playwrightService.waitForElement('input[name="userId"]', 10000);
      execution.result.logs.push('Login form elements loaded successfully');

      // Get page title and content for verification
      const pageTitle = await this.playwrightService.getPageTitle();
      const pageContent = await this.playwrightService.getPageContent();
      
      execution.result.logs.push(`Page title: ${pageTitle}`);
      execution.result.logs.push(`Page content preview: ${pageContent.substring(0, 200)}...`);

      // Take screenshot before login
      const beforeLoginScreenshot = path.join(
        process.env.SCREENSHOT_PATH || './screenshots',
        `choice-ai-login-before-${executionId}.png`
      );
      await this.playwrightService.takeScreenshot(beforeLoginScreenshot);
      execution.result.screenshotPath = beforeLoginScreenshot;
      execution.result.logs.push('Screenshot taken before login attempt');

      // Fill in login credentials
      const userId = process.env.CHOICE_UID;
      const password = process.env.CHOICE_PASS;

      if (!userId || !password) {
        throw new Error('Choice-AI credentials not found in environment variables');
      }

      // Fill user ID
      await this.playwrightService.fillInput('input[name="userId"]', userId);
      execution.result.logs.push('User ID filled successfully');

      // Fill password
      await this.playwrightService.fillInput('input[type="password"]', password);
      execution.result.logs.push('Password filled successfully');

      // Take screenshot after filling credentials
      const afterFillScreenshot = path.join(
        process.env.SCREENSHOT_PATH || './screenshots',
        `choice-ai-login-filled-${executionId}.png`
      );
      await this.playwrightService.takeScreenshot(afterFillScreenshot);
      execution.result.logs.push('Screenshot taken after filling credentials');

      // Click login button
      await this.playwrightService.clickElement('button[type="submit"]');
      execution.result.logs.push('Login button clicked');

      // Wait for navigation or error
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for redirect

      // Take screenshot after login attempt
      const afterLoginScreenshot = path.join(
        process.env.SCREENSHOT_PATH || './screenshots',
        `choice-ai-login-after-${executionId}.png`
      );
      await this.playwrightService.takeScreenshot(afterLoginScreenshot);
      execution.result.logs.push('Screenshot taken after login attempt');

      // Get performance metrics
      const performance = await this.playwrightService.getPagePerformance();
      execution.result.performance = performance;
      execution.result.logs.push(`Page load time: ${performance.loadTime}ms`);

      // Verify login success (check for redirect or dashboard elements)
      const currentUrl = await this.playwrightService.getCurrentUrl();
      execution.result.logs.push(`Current URL after login: ${currentUrl}`);

      // Check if we're still on login page (failed login) or redirected (successful login)
      if (currentUrl.includes('/login')) {
        // Check for error messages
        const errorContent = await this.playwrightService.getPageContent();
        if (errorContent.toLowerCase().includes('error') || errorContent.toLowerCase().includes('invalid')) {
          throw new Error('Login failed - Invalid credentials or error message displayed');
        }
        throw new Error('Login failed - Still on login page after submission');
      }

      // Success - we've been redirected away from login page
      execution.result.success = true;
      execution.result.logs.push('Login successful - Redirected from login page');

      // Get final page details
      const finalPageTitle = await this.playwrightService.getPageTitle();
      const finalPageContent = await this.playwrightService.getPageContent();
      
      execution.result.logs.push(`Final page title: ${finalPageTitle}`);
      execution.result.logs.push(`Final page content preview: ${finalPageContent.substring(0, 200)}...`);

      // Take final screenshot
      const finalScreenshot = path.join(
        process.env.SCREENSHOT_PATH || './screenshots',
        `choice-ai-login-success-${executionId}.png`
      );
      await this.playwrightService.takeScreenshot(finalScreenshot);
      execution.result.screenshotPath = finalScreenshot;
      execution.result.logs.push('Final screenshot taken after successful login');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      testLogger.error(`Choice-AI login test failed: ${errorMessage}`);
      
      execution.status = 'failed';
      execution.result.success = false;
      execution.result.error = errorMessage;
      execution.result.logs.push(`Error: ${errorMessage}`);

      // Take error screenshot
      try {
        const errorScreenshot = path.join(
          process.env.SCREENSHOT_PATH || './screenshots',
          `choice-ai-login-error-${executionId}.png`
        );
        await this.playwrightService.takeScreenshot(errorScreenshot);
        execution.result.screenshotPath = errorScreenshot;
        execution.result.logs.push('Error screenshot captured');
      } catch (screenshotError) {
        execution.result.logs.push(`Failed to capture error screenshot: ${screenshotError}`);
      }
    } finally {
      // Close browser
      try {
        await this.playwrightService.close();
        execution.result.logs.push('Browser closed successfully');
      } catch (closeError) {
        execution.result.logs.push(`Error closing browser: ${closeError}`);
      }

      // Calculate duration
      const endTime = new Date();
      execution.endTime = endTime;
      execution.duration = endTime.getTime() - startTime.getTime();

      // Set final status
      if (execution.status === 'running') {
        execution.status = execution.result.success ? 'completed' : 'failed';
      }

      testLogger.info(`Choice-AI login test completed - Status: ${execution.status}, Duration: ${execution.duration}ms`);
      execution.result.logs.push(`Test completed at ${moment(endTime).format('YYYY-MM-DD HH:mm:ss')}`);
    }

    return execution;
  }

  async generateChoiceAiTestReport(execution: TestExecution): Promise<TestReport> {
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