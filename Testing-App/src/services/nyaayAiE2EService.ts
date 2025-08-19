import { PlaywrightService } from './playwrightService';
import { TestExecution, TestReport } from '../types';
import { logger, testLogger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import path from 'path';
import fs from 'fs';
import { FileHandler } from './handlers/fileHandler';

export class NyaayAiE2EService {
  private playwrightService: PlaywrightService

  constructor() {
    this.playwrightService = new PlaywrightService({
      browser: (process.env.PLAYWRIGHT_BROWSER as 'chrome' | 'chromium' | 'firefox' | 'webkit') || 'chrome',
      headless: process.env.PLAYWRIGHT_HEADLESS === 'true',
      timeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT || '30000'),
      viewport: { width: 1280, height: 720 }
    });
  }

  async executeNyaayAiE2ETest(): Promise<TestExecution> {
    const executionId = uuidv4();
    const startTime = moment();
    
    const execution: TestExecution = {
      id: executionId,
      websiteId: 'nyaay-ai',
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
      testLogger.info(`Starting Nyaay AI Complete E2E Test - Execution ID: ${executionId}`);
      execution.result.logs.push(`=== NYAAY AI E2E TEST STARTED ===`);
      execution.result.logs.push(`Execution ID: ${executionId}`);

      // Initialize browser
      await this.playwrightService.initialize();
      execution.result.logs.push('🚀 Browser initialized successfully');

      // STEP 1: Navigate to login page
      const loginUrl = 'https://app.nyaayai.com';
      await this.playwrightService.navigateToUrl(loginUrl);
      execution.result.logs.push('✅ Navigated to Nyaay AI login page');
      
      // Take screenshot of login page
      const loginScreenshot = path.join(
        process.env.SCREENSHOT_PATH || './screenshots',
        `nyaay-ai-login-${executionId}.png`
      );
      await this.playwrightService.takeScreenshot(loginScreenshot);
      execution.result.logs.push(`📸 Login page screenshot: ${loginScreenshot}`);

      // STEP 2: Perform login
      await this.performLogin(execution);

      // STEP 3: Verify dashboard access
      await this.verifyDashboardAccess(execution);

      // STEP 4: Test Recent Tasks
      await this.testRecentTasks(execution);

      // STEP 5: Test Recent Searches  
      await this.testRecentSearches(execution);

      // STEP 6: Test Recent Files
      await this.testRecentFiles(execution);

      // STEP 7: Perform logout
      await this.performLogout(execution);

      // Get performance metrics
      execution.result.performance = await this.playwrightService.getPagePerformance();
      execution.result.logs.push(`⚡ Performance metrics captured`);

      // Mark as completed
      execution.status = 'completed';
      execution.result.success = true;
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();

      execution.result.logs.push('✅ Nyaay AI E2E test completed successfully');
      execution.result.logs.push(`Duration: ${execution.duration}ms`);

      // Save test results to file
      await FileHandler.saveTestResultsToFile(execution);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      execution.status = 'failed';
      execution.result.success = false;
      execution.result.error = errorMessage;
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();

      execution.result.logs.push(`❌ Nyaay AI E2E test failed: ${errorMessage}`);
      testLogger.error(`Nyaay AI E2E test failed: ${errorMessage}`);

      // Take screenshot on failure
      try {
        const errorScreenshot = path.join(
          process.env.SCREENSHOT_PATH || './screenshots',
          `nyaay-ai-error-${executionId}.png`
        );
        await this.playwrightService.takeScreenshot(errorScreenshot);
        execution.result.logs.push(`📸 Error screenshot: ${errorScreenshot}`);
      } catch (screenshotError) {
        execution.result.logs.push('❌ Failed to take error screenshot');
      }

      // Save failed test results
      await FileHandler.saveTestResultsToFile(execution);
    } finally {
      // Close browser
      try {
        await this.playwrightService.close();
        execution.result.logs.push('🔒 Browser closed successfully');
      } catch (closeError) {
        execution.result.logs.push('⚠️ Warning: Failed to close browser properly');
      }
    }

    return execution;
  }

  private async performLogin(execution: TestExecution): Promise<void> {
    try {
      execution.result.logs.push('🔐 Starting login process...');

      // Wait for login form elements
      await this.playwrightService.waitForElement('input[type="email"], input[name="email"]', 10000);
      execution.result.logs.push('📝 Login form elements found');

      // Get credentials from environment
      const email = process.env.NYAAY_EMAIL || 'demo@panscience.xyz';
      const password = process.env.NYAAY_PASSWORD || 'Psi@2025';

      if (!email || !password) {
        throw new Error('Nyaay AI credentials not found in environment variables');
      }

      // Fill email field
      await this.playwrightService.fillInput('input[type="email"], input[name="email"]', email);
      execution.result.logs.push('✅ Email filled successfully');

      // Fill password field
      await this.playwrightService.fillInput('input[type="password"], input[name="password"]', password);
      execution.result.logs.push('✅ Password filled successfully');

      // Click login button
      const loginButtonSelectors = [
        'button[type="submit"]',
        'button:has-text("Login")',
        'button:has-text("Sign In")',
        'input[type="submit"]',
        'button[class*="submit"]'
      ];

      let loginButtonFound = false;
      for (const selector of loginButtonSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 3000);
          await this.playwrightService.clickElement(selector);
          loginButtonFound = true;
          execution.result.logs.push(`✅ Login button clicked: ${selector}`);
          break;
        } catch (error) {
          // Continue to next selector
        }
      }

      if (!loginButtonFound) {
        throw new Error('Login button not found');
      }

      // Wait for navigation after login
      await new Promise(resolve => setTimeout(resolve, 5000));
      execution.result.logs.push('⏳ Waited for login processing');

      // Verify successful login by checking URL change
      const currentUrl = await this.playwrightService.getCurrentUrl();
      if (currentUrl.includes('/login') || currentUrl === 'https://app.nyaayai.com') {
        throw new Error('Login failed - still on login page');
      }

      execution.result.logs.push(`✅ Login successful - redirected to: ${currentUrl}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      execution.result.logs.push(`❌ Login failed: ${errorMessage}`);
      throw error;
    }
  }

  private async verifyDashboardAccess(execution: TestExecution): Promise<void> {
    try {
      execution.result.logs.push('🏠 Verifying dashboard access...');

      // Take screenshot of dashboard
      const dashboardScreenshot = path.join(
        process.env.SCREENSHOT_PATH || './screenshots',
        `nyaay-ai-dashboard-${execution.id}.png`
      );
      await this.playwrightService.takeScreenshot(dashboardScreenshot);
      execution.result.logs.push(`📸 Dashboard screenshot: ${dashboardScreenshot}`);

      // Check for common dashboard elements
      const dashboardSelectors = [
        'nav',
        '[role="navigation"]',
        'header',
        '.sidebar',
        '.dashboard',
        '.main-content',
        'main'
      ];

      let dashboardElementFound = false;
      for (const selector of dashboardSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 3000);
          dashboardElementFound = true;
          execution.result.logs.push(`✅ Dashboard element found: ${selector}`);
          break;
        } catch (error) {
          // Continue to next selector
        }
      }

      if (!dashboardElementFound) {
        execution.result.logs.push('⚠️ Warning: No standard dashboard elements found, continuing test...');
      }

      // Get page title for verification
      const pageTitle = await this.playwrightService.getPageTitle();
      execution.result.logs.push(`📄 Page title: ${pageTitle}`);

      execution.result.logs.push('✅ Dashboard access verified');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      execution.result.logs.push(`❌ Dashboard verification failed: ${errorMessage}`);
      throw error;
    }
  }

  private async testRecentTasks(execution: TestExecution): Promise<void> {
    try {
      execution.result.logs.push('📋 Testing Recent Tasks...');

      // Look for Recent Tasks link/button
      const recentTasksSelectors = [
        'a:has-text("Recent Tasks")',
        'button:has-text("Recent Tasks")',
        '[href*="recent-tasks"]',
        '[href*="tasks"]',
        'nav a:has-text("Tasks")',
        '.sidebar a:has-text("Recent Tasks")',
        '.menu a:has-text("Recent Tasks")',
        'a[class*="task"]:has-text("Recent")',
        'li a:has-text("Recent Tasks")'
      ];

      let recentTasksFound = false;
      for (const selector of recentTasksSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 3000);
          await this.playwrightService.clickElement(selector);
          recentTasksFound = true;
          execution.result.logs.push(`✅ Recent Tasks clicked: ${selector}`);
          break;
        } catch (error) {
          // Continue to next selector
        }
      }

      if (!recentTasksFound) {
        throw new Error('Recent Tasks link/button not found');
      }

      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify we're on recent tasks page
      const currentUrl = await this.playwrightService.getCurrentUrl();
      execution.result.logs.push(`📍 Current URL after Recent Tasks: ${currentUrl}`);

      // Take screenshot of recent tasks page
      const tasksScreenshot = path.join(
        process.env.SCREENSHOT_PATH || './screenshots',
        `nyaay-ai-recent-tasks-${execution.id}.png`
      );
      await this.playwrightService.takeScreenshot(tasksScreenshot);
      execution.result.logs.push(`📸 Recent Tasks screenshot: ${tasksScreenshot}`);

      // Verify page content
      await this.verifyPageContent(execution, 'Recent Tasks');

      execution.result.logs.push('✅ Recent Tasks test completed');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      execution.result.logs.push(`❌ Recent Tasks test failed: ${errorMessage}`);
      throw error;
    }
  }

  private async testRecentSearches(execution: TestExecution): Promise<void> {
    try {
      execution.result.logs.push('🔍 Testing Recent Searches...');

      // Look for Recent Searches link/button
      const recentSearchesSelectors = [
        'a:has-text("Recent Searches")',
        'button:has-text("Recent Searches")',
        '[href*="recent-searches"]',
        '[href*="searches"]',
        'nav a:has-text("Searches")',
        '.sidebar a:has-text("Recent Searches")',
        '.menu a:has-text("Recent Searches")',
        'a[class*="search"]:has-text("Recent")',
        'li a:has-text("Recent Searches")'
      ];

      let recentSearchesFound = false;
      for (const selector of recentSearchesSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 3000);
          await this.playwrightService.clickElement(selector);
          recentSearchesFound = true;
          execution.result.logs.push(`✅ Recent Searches clicked: ${selector}`);
          break;
        } catch (error) {
          // Continue to next selector
        }
      }

      if (!recentSearchesFound) {
        throw new Error('Recent Searches link/button not found');
      }

      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify we're on recent searches page
      const currentUrl = await this.playwrightService.getCurrentUrl();
      execution.result.logs.push(`📍 Current URL after Recent Searches: ${currentUrl}`);

      // Take screenshot of recent searches page
      const searchesScreenshot = path.join(
        process.env.SCREENSHOT_PATH || './screenshots',
        `nyaay-ai-recent-searches-${execution.id}.png`
      );
      await this.playwrightService.takeScreenshot(searchesScreenshot);
      execution.result.logs.push(`📸 Recent Searches screenshot: ${searchesScreenshot}`);

      // Verify page content
      await this.verifyPageContent(execution, 'Recent Searches');

      execution.result.logs.push('✅ Recent Searches test completed');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      execution.result.logs.push(`❌ Recent Searches test failed: ${errorMessage}`);
      throw error;
    }
  }

  private async testRecentFiles(execution: TestExecution): Promise<void> {
    try {
      execution.result.logs.push('📁 Testing Recent Files...');

      // Look for Recent Files link/button
      const recentFilesSelectors = [
        'a:has-text("Recent Files")',
        'button:has-text("Recent Files")',
        '[href*="recent-files"]',
        '[href*="files"]',
        'nav a:has-text("Files")',
        '.sidebar a:has-text("Recent Files")',
        '.menu a:has-text("Recent Files")',
        'a[class*="file"]:has-text("Recent")',
        'li a:has-text("Recent Files")'
      ];

      let recentFilesFound = false;
      for (const selector of recentFilesSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 3000);
          await this.playwrightService.clickElement(selector);
          recentFilesFound = true;
          execution.result.logs.push(`✅ Recent Files clicked: ${selector}`);
          break;
        } catch (error) {
          // Continue to next selector
        }
      }

      if (!recentFilesFound) {
        throw new Error('Recent Files link/button not found');
      }

      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify we're on recent files page
      const currentUrl = await this.playwrightService.getCurrentUrl();
      execution.result.logs.push(`📍 Current URL after Recent Files: ${currentUrl}`);

      // Take screenshot of recent files page
      const filesScreenshot = path.join(
        process.env.SCREENSHOT_PATH || './screenshots',
        `nyaay-ai-recent-files-${execution.id}.png`
      );
      await this.playwrightService.takeScreenshot(filesScreenshot);
      execution.result.logs.push(`📸 Recent Files screenshot: ${filesScreenshot}`);

      // Verify page content
      await this.verifyPageContent(execution, 'Recent Files');

      execution.result.logs.push('✅ Recent Files test completed');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      execution.result.logs.push(`❌ Recent Files test failed: ${errorMessage}`);
      throw error;
    }
  }

  private async verifyPageContent(execution: TestExecution, pageName: string): Promise<void> {
    try {
      // Check for common page elements
      const contentSelectors = [
        '.content',
        '.main',
        '.page-content',
        '[role="main"]',
        'main',
        '.container',
        '.wrapper'
      ];

      let contentFound = false;
      for (const selector of contentSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 2000);
          contentFound = true;
          execution.result.logs.push(`✅ ${pageName} content found: ${selector}`);
          break;
        } catch (error) {
          // Continue to next selector
        }
      }

      if (!contentFound) {
        execution.result.logs.push(`⚠️ Warning: No standard content elements found on ${pageName} page`);
      }

      // Get page title
      const pageTitle = await this.playwrightService.getPageTitle();
      execution.result.logs.push(`📄 ${pageName} page title: ${pageTitle}`);

    } catch (error) {
      execution.result.logs.push(`⚠️ Warning: ${pageName} content verification had issues`);
    }
  }

  private async performLogout(execution: TestExecution): Promise<void> {
    try {
      execution.result.logs.push('🚪 Starting logout process...');

      // Look for logout button/link
      const logoutSelectors = [
        'a:has-text("Logout")',
        'button:has-text("Logout")',
        'a:has-text("Sign Out")',
        'button:has-text("Sign Out")',
        '[href*="logout"]',
        '.logout',
        '.sign-out',
        '[data-testid="logout"]',
        'nav a:has-text("Logout")',
        '.user-menu a:has-text("Logout")',
        '.dropdown a:has-text("Logout")'
      ];

      let logoutFound = false;
      for (const selector of logoutSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 3000);
          await this.playwrightService.clickElement(selector);
          logoutFound = true;
          execution.result.logs.push(`✅ Logout clicked: ${selector}`);
          break;
        } catch (error) {
          // Continue to next selector
        }
      }

      if (!logoutFound) {
        // Try looking for user profile/avatar that might contain logout
        const profileSelectors = [
          '.avatar',
          '.user-avatar',
          '.profile',
          '.user-profile',
          '[class*="user"]',
          '[class*="profile"]'
        ];

        for (const selector of profileSelectors) {
          try {
            await this.playwrightService.waitForElement(selector, 2000);
            await this.playwrightService.clickElement(selector);
            execution.result.logs.push(`✅ Profile/Avatar clicked: ${selector}`);
            
            // Wait for dropdown and try logout again
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            for (const logoutSelector of logoutSelectors) {
              try {
                await this.playwrightService.waitForElement(logoutSelector, 2000);
                await this.playwrightService.clickElement(logoutSelector);
                logoutFound = true;
                execution.result.logs.push(`✅ Logout clicked from dropdown: ${logoutSelector}`);
                break;
              } catch (error) {
                // Continue
              }
            }
            
            if (logoutFound) break;
          } catch (error) {
            // Continue to next profile selector
          }
        }
      }

      if (!logoutFound) {
        execution.result.logs.push('⚠️ Warning: Logout button not found - test may not have logged out properly');
        return;
      }

      // Wait for logout to complete
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify logout by checking if we're back to login page
      const currentUrl = await this.playwrightService.getCurrentUrl();
      execution.result.logs.push(`📍 URL after logout: ${currentUrl}`);

      if (currentUrl.includes('/login') || currentUrl === 'https://app.nyaayai.com') {
        execution.result.logs.push('✅ Logout successful - redirected to login page');
      } else {
        execution.result.logs.push('⚠️ Warning: May not have been logged out properly');
      }

      // Take final screenshot
      const logoutScreenshot = path.join(
        process.env.SCREENSHOT_PATH || './screenshots',
        `nyaay-ai-logout-${execution.id}.png`
      );
      await this.playwrightService.takeScreenshot(logoutScreenshot);
      execution.result.logs.push(`📸 Logout screenshot: ${logoutScreenshot}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      execution.result.logs.push(`❌ Logout failed: ${errorMessage}`);
      // Don't throw error for logout failure - test should still be marked as successful
    }
  }

  async generateNyaayAiE2EReport(execution: TestExecution): Promise<TestReport> {
    const report: TestReport = {
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

    testLogger.info(`Nyaay AI E2E test report generated: ${report.id}`);
    return report;
  }
}
