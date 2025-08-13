import { v4 as uuidv4 } from 'uuid';
import { PlaywrightService } from './playwrightService';
import { logger, testLogger } from '../utils/logger';
import { 
  TestExecution, 
  TestRequest, 
  PlaywrightConfig, 
  Website, 
  TestRoute 
} from '../types';
import path from 'path';
import fs from 'fs';

export class TestService {
  private executions: Map<string, TestExecution> = new Map();
  private websites: Map<string, Website> = new Map();
  private routes: Map<string, TestRoute> = new Map();

  constructor() {
    this.loadMockData();
  }

  private loadMockData(): void {
    // Mock websites
    const mockWebsites: Website[] = [
      {
        id: '1',
        name: 'Example Website',
        baseUrl: 'https://example.com',
        description: 'A sample website for testing',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        name: 'Test Site',
        baseUrl: 'https://httpbin.org',
        description: 'HTTP testing and debugging site',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Mock routes
    const mockRoutes: TestRoute[] = [
      {
        id: '1',
        websiteId: '1',
        path: '/',
        method: 'GET',
        name: 'Homepage Test',
        description: 'Test the homepage loads correctly',
        expectedStatus: 200,
        timeout: 10000,
        screenshot: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        websiteId: '2',
        path: '/get',
        method: 'GET',
        name: 'API Test',
        description: 'Test API endpoint',
        expectedStatus: 200,
        timeout: 5000,
        screenshot: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    mockWebsites.forEach(website => this.websites.set(website.id, website));
    mockRoutes.forEach(route => this.routes.set(route.id, route));
  }

  async executeTest(testRequest: TestRequest): Promise<TestExecution> {
    const executionId = uuidv4();
    const startTime = new Date();

    const execution: TestExecution = {
      id: executionId,
      websiteId: testRequest.websiteId,
      routeId: testRequest.routeId,
      status: 'pending',
      startTime,
      result: {
        success: false,
        logs: []
      },
      createdAt: startTime
    };

    this.executions.set(executionId, execution);
    testLogger.info(`Starting test execution: ${executionId}`);

    try {
      // Update status to running
      execution.status = 'running';
      this.executions.set(executionId, execution);

      // Get website and route information
      const website = this.websites.get(testRequest.websiteId);
      if (!website) {
        throw new Error(`Website with ID ${testRequest.websiteId} not found`);
      }

      let targetUrl = testRequest.customUrl;
      let route: TestRoute | undefined;

      if (testRequest.routeId) {
        route = this.routes.get(testRequest.routeId);
        if (!route) {
          throw new Error(`Route with ID ${testRequest.routeId} not found`);
        }
        targetUrl = `${website.baseUrl}${route.path}`;
      } else if (!targetUrl) {
        targetUrl = website.baseUrl;
      }

      // Initialize Playwright
      const playwrightConfig: PlaywrightConfig = {
        browser: testRequest.playwrightConfig?.browser || 'chromium',
        headless: testRequest.playwrightConfig?.headless ?? true,
        timeout: testRequest.playwrightConfig?.timeout || 30000,
        viewport: testRequest.playwrightConfig?.viewport,
        userAgent: testRequest.playwrightConfig?.userAgent
      };

      const playwright = new PlaywrightService(playwrightConfig);
      await playwright.initialize();

      // Navigate to the target URL
      await playwright.navigateToUrl(targetUrl);
      execution.result.logs.push(`Navigated to: ${targetUrl}`);

      // Get page information
      const pageTitle = await playwright.getPageTitle();
      const pageContent = await playwright.getPageContent();
      const performance = await playwright.getPagePerformance();

      // Take screenshot if requested
      let screenshotPath: string | undefined;
      if (testRequest.screenshot || route?.screenshot) {
        const screenshotDir = process.env.SCREENSHOT_PATH || './screenshots';
        const fileName = `${executionId}_${Date.now()}.png`;
        screenshotPath = path.join(screenshotDir, fileName);
        await playwright.takeScreenshot(screenshotPath);
        execution.result.logs.push(`Screenshot saved: ${screenshotPath}`);
      }

      // Validate response
      const success = this.validateResponse(pageContent, route);
      execution.result.success = success;
      execution.result.performance = performance;
      execution.result.screenshotPath = screenshotPath;

      if (success) {
        execution.result.logs.push('Test completed successfully');
      } else {
        execution.result.logs.push('Test failed validation');
      }

      // Close browser
      await playwright.close();

      // Update execution
      execution.status = 'completed';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - startTime.getTime();

      this.executions.set(executionId, execution);
      testLogger.info(`Test execution ${executionId} completed successfully`);

      return execution;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - startTime.getTime();
      execution.result.error = errorMessage;
      execution.result.logs.push(`Error: ${errorMessage}`);

      this.executions.set(executionId, execution);
      testLogger.error(`Test execution ${executionId} failed: ${errorMessage}`);

      return execution;
    }
  }

  private validateResponse(content: string, route?: TestRoute): boolean {
    if (!route) {
      return true; // No specific validation criteria
    }

    // Check for expected content if specified
    if (route.expectedContent && !content.includes(route.expectedContent)) {
      return false;
    }

    // Add more validation logic as needed
    return true;
  }

  getExecution(executionId: string): TestExecution | undefined {
    return this.executions.get(executionId);
  }

  getAllExecutions(): TestExecution[] {
    return Array.from(this.executions.values());
  }

  getWebsiteExecutions(websiteId: string): TestExecution[] {
    return Array.from(this.executions.values()).filter(
      execution => execution.websiteId === websiteId
    );
  }

  getWebsites(): Website[] {
    return Array.from(this.websites.values());
  }

  getRoutes(websiteId?: string): TestRoute[] {
    const routes = Array.from(this.routes.values());
    if (websiteId) {
      return routes.filter(route => route.websiteId === websiteId);
    }
    return routes;
  }

  addWebsite(website: Omit<Website, 'id' | 'createdAt' | 'updatedAt'>): Website {
    const newWebsite: Website = {
      ...website,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.websites.set(newWebsite.id, newWebsite);
    return newWebsite;
  }

  addRoute(route: Omit<TestRoute, 'id' | 'createdAt' | 'updatedAt'>): TestRoute {
    const newRoute: TestRoute = {
      ...route,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.routes.set(newRoute.id, newRoute);
    return newRoute;
  }
} 