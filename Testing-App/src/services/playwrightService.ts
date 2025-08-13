import { chromium, firefox, webkit, Browser, BrowserContext, Page } from 'playwright';
import { logger, testLogger } from '../utils/logger';
import { PlaywrightConfig, TestExecution } from '../types';
import path from 'path';
import fs from 'fs';

export class PlaywrightService {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  constructor(private config: PlaywrightConfig) {}

  async initialize(): Promise<void> {
    try {
      // Launch browser based on configuration
      switch (this.config.browser) {
        case 'chrome':
          // Use system Chrome browser
          this.browser = await chromium.launch({
            headless: this.config.headless,
            channel: 'chrome', // Use system Chrome instead of bundled Chromium
            args: [
              '--no-sandbox', 
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-web-security',
              '--disable-features=VizDisplayCompositor'
            ]
          });
          break;
        case 'chromium':
          this.browser = await chromium.launch({
            headless: this.config.headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });
          break;
        case 'firefox':
          this.browser = await firefox.launch({
            headless: this.config.headless
          });
          break;
        case 'webkit':
          this.browser = await webkit.launch({
            headless: this.config.headless
          });
          break;
        default:
          throw new Error(`Unsupported browser: ${this.config.browser}`);
      }

      // Create browser context
      this.context = await this.browser.newContext({
        viewport: this.config.viewport || { width: 1280, height: 720 },
        userAgent: this.config.userAgent,
        recordHar: { path: './har-files/' }
      });

      // Create page
      this.page = await this.context.newPage();
      
      // Set default timeout
      this.page.setDefaultTimeout(this.config.timeout);

      testLogger.info(`Browser ${this.config.browser} initialized successfully`);
    } catch (error) {
      testLogger.error(`Failed to initialize browser: ${error}`);
      throw error;
    }
  }

  async navigateToUrl(url: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      testLogger.info(`Navigating to: ${url}`);
      await this.page.goto(url, { waitUntil: 'networkidle' });
      testLogger.info(`Successfully navigated to: ${url}`);
    } catch (error) {
      testLogger.error(`Failed to navigate to ${url}: ${error}`);
      throw error;
    }
  }

  async takeScreenshot(filePath: string): Promise<string> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await this.page.screenshot({ 
        path: filePath,
        fullPage: true 
      });

      testLogger.info(`Screenshot saved to: ${filePath}`);
      return filePath;
    } catch (error) {
      testLogger.error(`Failed to take screenshot: ${error}`);
      throw error;
    }
  }

  async getPagePerformance(): Promise<{
    loadTime: number;
    domContentLoaded: number;
    firstContentfulPaint: number;
  }> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      const performanceMetrics = await this.page.evaluate(() => {
        const navigation = (performance as any).getEntriesByType('navigation')[0];
        const paint = (performance as any).getEntriesByType('paint');
        const fcp = paint.find((entry: any) => entry.name === 'first-contentful-paint');

        return {
          loadTime: navigation ? (navigation.loadEventEnd - navigation.loadEventStart) : 0,
          domContentLoaded: navigation ? (navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart) : 0,
          firstContentfulPaint: fcp ? fcp.startTime : 0
        };
      });

      return performanceMetrics;
    } catch (error) {
      testLogger.error(`Failed to get performance metrics: ${error}`);
      return {
        loadTime: 0,
        domContentLoaded: 0,
        firstContentfulPaint: 0
      };
    }
  }

  async getPageContent(): Promise<string> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      return await this.page.content();
    } catch (error) {
      testLogger.error(`Failed to get page content: ${error}`);
      throw error;
    }
  }

  async getPageTitle(): Promise<string> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      return await this.page.title();
    } catch (error) {
      testLogger.error(`Failed to get page title: ${error}`);
      throw error;
    }
  }

  async waitForElement(selector: string, timeout?: number): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      await this.page.waitForSelector(selector, { timeout: timeout || this.config.timeout });
    } catch (error) {
      testLogger.error(`Failed to wait for element ${selector}: ${error}`);
      throw error;
    }
  }

  async clickElement(selector: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      await this.page.click(selector);
    } catch (error) {
      testLogger.error(`Failed to click element ${selector}: ${error}`);
      throw error;
    }
  }

  async fillInput(selector: string, value: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      await this.page.fill(selector, value);
    } catch (error) {
      testLogger.error(`Failed to fill input ${selector}: ${error}`);
      throw error;
    }
  }

  async pressKey(key: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      await this.page.keyboard.press(key);
    } catch (error) {
      testLogger.error(`Failed to press key ${key}: ${error}`);
      throw error;
    }
  }

  async typeText(text: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      await this.page.keyboard.type(text);
    } catch (error) {
      testLogger.error(`Failed to type text ${text}: ${error}`);
      throw error;
    }
  }

  async getCurrentUrl(): Promise<string> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      return this.page.url();
    } catch (error) {
      testLogger.error(`Failed to get current URL: ${error}`);
      throw error;
    }
  }

  async waitForNavigation(timeout?: number): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      await this.page.waitForLoadState('networkidle', { timeout: timeout || this.config.timeout });
      testLogger.info('Page navigation completed');
    } catch (error) {
      testLogger.error(`Failed to wait for navigation: ${error}`);
      throw error;
    }
  }

  async waitForUrlChange(currentUrl: string, timeout?: number): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      await this.page.waitForFunction(
        (url) => window.location.href !== url,
        currentUrl,
        { timeout: timeout || this.config.timeout }
      );
      testLogger.info('URL changed successfully');
    } catch (error) {
      testLogger.error(`Failed to wait for URL change: ${error}`);
      throw error;
    }
  }

  async getElements(selector: string): Promise<any[]> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      return await this.page.$$(selector);
    } catch (error) {
      testLogger.error(`Failed to get elements ${selector}: ${error}`);
      throw error;
    }
  }

  async playFirstAudio(): Promise<boolean> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      return await this.page.evaluate(async () => {
        const audio = document.querySelector('audio') as HTMLAudioElement | null;
        if (!audio) return false;
        try {
          await audio.play();
        } catch (e) {
          // Ignore and verify state below
        }
        return !audio.paused && audio.currentTime >= 0 && !audio.ended;
      });
    } catch (error) {
      testLogger.error(`Failed to play first audio: ${error}`);
      throw error;
    }
  }

  async isAnyAudioPlaying(): Promise<boolean> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      return await this.page.evaluate(() => {
        const audios = Array.from(document.querySelectorAll('audio')) as HTMLAudioElement[];
        return audios.some(a => !a.paused && a.currentTime > 0 && !a.ended);
      });
    } catch (error) {
      testLogger.error(`Failed to verify audio playback: ${error}`);
      throw error;
    }
  }

  async scrollToBottom(): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      await this.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      testLogger.info('Successfully scrolled to bottom of page');
    } catch (error) {
      testLogger.error(`Failed to scroll to bottom: ${error}`);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.context) {
        await this.context.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      testLogger.info('Browser closed successfully');
    } catch (error) {
      testLogger.error(`Failed to close browser: ${error}`);
      throw error;
    }
  }
} 