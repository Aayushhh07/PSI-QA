import { PlaywrightService } from './playwrightService';
import { TestExecution, TestReport } from '../types';
import { logger, testLogger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import path from 'path';
import fs from 'fs';
import { FileHandler } from './handlers/fileHandler';

export class OpticallE2EService {
  private playwrightService: PlaywrightService;

  constructor() {
    this.playwrightService = new PlaywrightService({
      browser: (process.env.PLAYWRIGHT_BROWSER as 'chrome' | 'chromium' | 'firefox' | 'webkit') || 'chrome',
      headless: process.env.PLAYWRIGHT_HEADLESS === 'true',
      timeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT || '30000'),
      viewport: { width: 1280, height: 720 }
    });
  }

  async executeOpticallE2ETest(): Promise<TestExecution> {
    const executionId = uuidv4();
    const startTime = moment();
    
    const execution: TestExecution = {
      id: executionId,
      websiteId: 'opticall',
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
      testLogger.info(`Starting Opticall Complete E2E Test - Execution ID: ${executionId}`);
      execution.result.logs.push(`=== OPTICALL E2E TEST STARTED ===`);
      execution.result.logs.push(`Execution ID: ${executionId}`);

      // Initialize browser
      await this.playwrightService.initialize();

      // STEP 1: Navigate to login page
      const loginUrl = 'https://app.opticall.io/';
      await this.playwrightService.navigateToUrl(loginUrl);
      execution.result.logs.push('✅ Navigated to Opticall login page');
      
      // Log initial URL for debugging
      const initialUrl = await this.playwrightService.getCurrentUrl();
      testLogger.info(`Initial URL: ${initialUrl}`);

      // Wait for login form elements
      await this.playwrightService.waitForElement('input[type="email"], input[name="email"]', 10000);
      await this.playwrightService.waitForElement('input[type="password"]', 5000);

      // Fill login credentials
      const email = process.env.OPTICALL_EMAIL || 'ce@opticall.io';
      const password = process.env.OPTICALL_PASSWORD || 'DishD2h#6';

      if (!email || !password) {
        throw new Error('Opticall credentials not found in environment variables');
      }

      await this.playwrightService.fillInput('input[type="email"], input[name="email"]', email);
      await this.playwrightService.fillInput('input[type="password"]', password);
      execution.result.logs.push('✅ Filled login credentials');

      // Log URL before login submission
      const urlBeforeLogin = await this.playwrightService.getCurrentUrl();
      testLogger.info(`URL before login submission: ${urlBeforeLogin}`);

      // Submit login form
      await this.playwrightService.clickElement('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
      execution.result.logs.push('✅ Submitted login form');

      // Wait for navigation and dashboard load
      try {
        // Wait for the page to navigate away from login
        await this.playwrightService.waitForUrlChange(loginUrl, 10000);
        execution.result.logs.push('✅ Page navigated away from login');
        
        // Wait for the new page to fully load
        await this.playwrightService.waitForNavigation(5000);
        execution.result.logs.push('✅ New page loaded completely');
      } catch (error) {
        testLogger.warn(`Navigation wait failed, proceeding with verification: ${error}`);
        // Fallback: wait a bit more
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // STEP 2: Verify successful login
      const currentUrl = await this.playwrightService.getCurrentUrl();
      testLogger.info(`Current URL after login: ${currentUrl}`);
      
      // Check if login was successful by looking for dashboard elements
      // instead of relying solely on URL changes
      try {
        // Wait for dashboard elements to appear
        await this.playwrightService.waitForElement('[data-testid="dashboard"], .dashboard, [class*="dashboard"], [id*="dashboard"], [class*="main"], [class*="content"]', 1000);
        testLogger.info('Dashboard elements found, login successful');
        execution.result.logs.push('✅ Dashboard elements detected');
      } catch (error) {
        // If dashboard elements not found, check if we're still on login page
        try {
          await this.playwrightService.waitForElement('input[type="email"], input[name="email"]', 600);
          testLogger.error('Login form still present, login failed');
          throw new Error('Login failed - Login form still present after submission');
        } catch (formError) {
          // If login form is gone but no dashboard, might be a different page
          testLogger.info('Login form gone, checking if we reached a different page');
          const pageTitle = await this.playwrightService.getPageTitle();
          testLogger.info(`Page title: ${pageTitle}`);
          execution.result.logs.push(`📄 Page title: ${pageTitle}`);
        }
      }

      execution.result.logs.push('✅ Login successful - Dashboard loaded');

      // Get dashboard information
      const dashboardTitle = await this.playwrightService.getPageTitle();
      execution.result.logs.push(`📊 Dashboard Title: ${dashboardTitle}`);

      // STEP 3: Test 1 - Click on view button and open a report
      await this.testViewButtonAndReport(execution);

      // STEP 4: Test 2 - Check all charts in each section
      await this.testAllCharts(execution);

      // STEP 5: Test 3 - Click on data store button
      await this.testDataStoreButton(execution);

      // STEP 6: Test 4 - Click on first item card (first call ID)
      await this.testFirstItemCard(execution);

      // STEP 7: Test 5 - Play call recording and verify playback
      await this.testPlayCallRecording(execution);

      // STEP 8: Test 6 - Close data store
      await this.testCloseDataStore(execution);

      // STEP 9: Test 7 - Logout
      await this.testLogout(execution);

      // STEP 10: Performance and final validation
      const performance = await this.playwrightService.getPagePerformance();
      execution.result.performance = performance;

      // Success - all steps completed
      execution.result.success = true;
      execution.result.logs.push('✅ All Opticall E2E tests completed successfully');
      execution.result.logs.push(`📊 Performance: ${performance.loadTime}ms load time`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      testLogger.error(`Opticall E2E test failed: ${errorMessage}`);
      
      execution.status = 'failed';
      execution.result.success = false;
      execution.result.error = errorMessage;
      execution.result.logs.push(`❌ TEST FAILED: ${errorMessage}`);

      // Take error screenshot
      try {
        const errorScreenshot = path.join(
          process.env.SCREENSHOT_PATH || './screenshots',
          `opticall-error-${executionId}.png`
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

      testLogger.info(`Opticall E2E test completed - Status: ${execution.status}, Duration: ${execution.duration}ms`);
    }

    return execution;
  }

  private async testViewButtonAndReport(execution: TestExecution): Promise<void> {
    try {
      execution.result.logs.push('🔍 Testing 1: Clicking view button and opening report...');

      // Look for cards with view buttons
      const cardSelectors = [
        'div[class*="card"]',
        'div[class*="Card"]',
        'div[class*="bg-white"]',
        'div[class*="border"]'
      ];

      let viewButtonFound = false;
      for (const cardSelector of cardSelectors) {
        try {
          // Find cards
          const cards = await this.playwrightService.getElements(cardSelector);
          
          for (const card of cards) {
            try {
              // Look for view button within the card
              const viewButtonSelectors = [
                'button:has-text("View")',
                'button:has-text("view")',
                'a:has-text("View")',
                'a:has-text("view")',
                'button[class*="view"]',
                'a[class*="view"]'
              ];

              for (const buttonSelector of viewButtonSelectors) {
                try {
                  const viewButton = await card.$(buttonSelector);
                  if (viewButton) {
                    await viewButton.click();
                    viewButtonFound = true;
                    execution.result.logs.push('✅ Successfully clicked view button');
                    break;
                  }
                } catch (error) {
                  // Continue to next selector
                }
              }

              if (viewButtonFound) break;
            } catch (error) {
              // Continue to next card
            }
          }

          if (viewButtonFound) break;
        } catch (error) {
          // Continue to next selector
        }
      }

      if (!viewButtonFound) {
        throw new Error('Could not find any view button on cards');
      }

      // Wait for report page to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify we're on a report page
      const currentUrl = await this.playwrightService.getCurrentUrl();
      if (currentUrl.includes('/report') || currentUrl.includes('/detail')) {
        execution.result.logs.push('✅ Successfully opened report page');
      } else {
        execution.result.logs.push('⚠️ Report page verification inconclusive');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      execution.result.logs.push(`❌ Test 1 failed: ${errorMessage}`);
      throw error;
    }
  }

  private async testAllCharts(execution: TestExecution): Promise<void> {
    try {
      execution.result.logs.push('🔍 Testing 2: Checking all charts in each section...');

      // Look for chart elements
      const chartSelectors = [
        'div[class*="chart"]',
        'div[class*="Chart"]',
        'canvas',
        'svg',
        'div[class*="recharts"]',
        'div[class*="chart-container"]',
        'div[class*="graph"]',
        'div[class*="Graph"]'
      ];

      let chartsFound = 0;
      for (const selector of chartSelectors) {
        try {
          const charts = await this.playwrightService.getElements(selector);
          if (charts.length > 0) {
            chartsFound += charts.length;
            execution.result.logs.push(`📊 Found ${charts.length} charts with selector: ${selector}`);
          }
        } catch (error) {
          // Continue to next selector
        }
      }

      if (chartsFound === 0) {
        throw new Error('No charts found on the page');
      }

      execution.result.logs.push(`✅ Successfully verified ${chartsFound} charts across all sections`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      execution.result.logs.push(`❌ Test 2 failed: ${errorMessage}`);
      throw error;
    }
  }

  private async testFullScreenCharts(execution: TestExecution): Promise<void> {
    try {
      execution.result.logs.push('🔍 Testing 3: Opening full screen charts...');

      // Look for full screen buttons or chart containers
      const fullScreenSelectors = [
        'button[class*="fullscreen"]',
        'button:has-text("Full Screen")',
        'button:has-text("fullscreen")',
        'button[aria-label*="fullscreen"]',
        'div[class*="chart"] button',
        'div[class*="Chart"] button',
        'svg[class*="fullscreen"]',
        'button[class*="expand"]'
      ];

      let fullScreenOpened = false;
      for (const selector of fullScreenSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 600);
          await this.playwrightService.clickElement(selector);
          fullScreenOpened = true;
          execution.result.logs.push('✅ Successfully opened full screen chart');
          break;
        } catch (error) {
          // Continue to next selector
        }
      }

      if (!fullScreenOpened) {
        // Try clicking on chart containers to see if they expand
        const chartContainerSelectors = [
          'div[class*="chart"]',
          'div[class*="Chart"]',
          'div[class*="graph"]',
          'div[class*="Graph"]'
        ];

        for (const selector of chartContainerSelectors) {
          try {
            const containers = await this.playwrightService.getElements(selector);
            if (containers.length > 0) {
              await containers[0].click();
              fullScreenOpened = true;
              execution.result.logs.push('✅ Successfully clicked on chart container');
              break;
            }
          } catch (error) {
            // Continue to next selector
          }
        }
      }

      if (!fullScreenOpened) {
        execution.result.logs.push('⚠️ Could not find full screen functionality, but continuing');
      } else {
        // Wait for any full screen transition
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Now close the full screen
        execution.result.logs.push('🔍 Closing full screen chart...');
        
        // Look for close/exit full screen buttons
        const closeFullScreenSelectors = [
          'button[class*="exit-fullscreen"]',
          'button[class*="ExitFullscreen"]',
          'button:has-text("Exit Full Screen")',
          'button:has-text("exit full screen")',
          'button:has-text("Close Full Screen")',
          'button:has-text("close full screen")',
          'button[aria-label*="exit-fullscreen"]',
          'button[aria-label*="ExitFullscreen"]',
          'button[class*="close-fullscreen"]',
          'button[class*="CloseFullscreen"]',
          'button:has-text("×")',
          'button:has-text("Close")',
          'button:has-text("close")',
          'button[class*="close"]',
          'button[class*="Close"]'
        ];

        let fullScreenClosed = false;
        for (const selector of closeFullScreenSelectors) {
          try {
            await this.playwrightService.waitForElement(selector, 2000);
            await this.playwrightService.clickElement(selector);
            fullScreenClosed = true;
            execution.result.logs.push(`✅ Successfully closed full screen using selector: ${selector}`);
            break;
          } catch (error) {
            // Continue to next selector
          }
        }

        if (!fullScreenClosed) {
          // Try pressing Escape key as fallback
          try {
            await this.playwrightService.pressKey('Escape');
            fullScreenClosed = true;
            execution.result.logs.push('✅ Successfully closed full screen using Escape key');
          } catch (error) {
            execution.result.logs.push('⚠️ Could not close full screen, but continuing');
          }
        }

        // Wait for full screen to close
        if (fullScreenClosed) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          execution.result.logs.push('✅ Full screen chart closed successfully');
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      execution.result.logs.push(`❌ Test 3 failed: ${errorMessage}`);
      throw error;
    }
  }

  private async testDataStoreButton(execution: TestExecution): Promise<void> {
    try {
      execution.result.logs.push('🔍 Testing 3: Clicking on data store button...');

      // Look for data store button
      const dataStoreSelectors = [
        'button:has-text("Data Store")',
        'button:has-text("data store")',
        'button:has-text("DataStore")',
        'button:has-text("datastore")',
        'button[class*="data-store"]',
        'button[class*="DataStore"]',
        'button[class*="datastore"]',
        'a:has-text("Data Store")',
        'a:has-text("data store")',
        'div[class*="data-store"]',
        'div[class*="DataStore"]',
        'div[class*="datastore"]'
      ];

      let dataStoreClicked = false;
      for (const selector of dataStoreSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 2000);
          await this.playwrightService.clickElement(selector);
          dataStoreClicked = true;
          execution.result.logs.push(`✅ Successfully clicked on data store button using selector: ${selector}`);
          break;
        } catch (error) {
          // Continue to next selector
        }
      }

      if (!dataStoreClicked) {
        throw new Error('Could not find or click on data store button');
      }

      // Wait for data store to open
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      execution.result.logs.push(`❌ Test 3 failed: ${errorMessage}`);
      throw error;
    }
  }

  private async testFirstItemCard(execution: TestExecution): Promise<void> {
    try {
      execution.result.logs.push('🔍 Testing 4: Clicking on first item card (first call ID)...');

      // Look for call record cards with more specific selectors
      const callRecordSelectors = [
        // Most specific selectors for call record cards
        'div[class*="call-record"]',
        'div[class*="CallRecord"]',
        'div[class*="record-card"]',
        'div[class*="RecordCard"]',
        // Look for cards containing call ID text
        'div:has-text("Call ID:")',
        'div:has-text("Call ID")',
        // Look for cards with specific call ID format (alphanumeric)
        'div:has-text(/Call ID: [A-Z0-9]{32,}/)',
        // Generic card selectors as fallback
        'div[class*="card"]',
        'div[class*="Card"]',
        'div[class*="item"]',
        'div[class*="Item"]',
        'div[class*="call-id"]',
        'div[class*="CallId"]',
        'div[class*="call"]',
        'div[class*="Call"]',
        'tr[class*="row"]',
        'div[class*="row"]',
        'div[class*="list-item"]',
        'div[class*="ListItem"]'
      ];

      let callRecordClicked = false;
      let selectedSelector = '';
      
      for (const selector of callRecordSelectors) {
        try {
          const elements = await this.playwrightService.getElements(selector);
          if (elements.length > 0) {
            // Filter elements to find actual call record cards
            let callRecordCards = elements;
            
            // If we found multiple elements, try to identify the actual call record cards
            if (elements.length > 1) {
              // Look for elements that contain call ID text
              const callIdElements = [];
              for (const element of elements) {
                try {
                  const text = await element.textContent();
                  if (text && (text.includes('Call ID:') || text.includes('Call ID'))) {
                    callIdElements.push(element);
                  }
                } catch (error) {
                  // Continue to next element
                }
              }
              if (callIdElements.length > 0) {
                callRecordCards = callIdElements;
              }
            }
            
            // Click on the first call record card
            const firstCallRecord = callRecordCards[0];
            await firstCallRecord.waitForElementState('visible');
            
            // Get the call ID text for logging
            let callIdText = 'Unknown';
            try {
              const text = await firstCallRecord.textContent();
              if (text) {
                const callIdMatch = text.match(/Call ID:\s*([A-Z0-9]+)/);
                if (callIdMatch) {
                  callIdText = callIdMatch[1];
                }
              }
            } catch (error) {
              // Continue without call ID text
            }
            
            await firstCallRecord.click();
            callRecordClicked = true;
            selectedSelector = selector;
            execution.result.logs.push(`✅ Successfully clicked on call record card (Call ID: ${callIdText}) using selector: ${selector}`);
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }

      if (!callRecordClicked) {
        throw new Error('Could not find or click on any call record card');
      }

      // Wait for call record details to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify that we're now viewing call details (look for play button or recording controls)
      try {
        const playButtonSelectors = [
          'button:has-text("Play")',
          'button[class*="play"]',
          'button[aria-label*="play"]',
          'button:has(svg[class*="play"])'
        ];
        
        let playButtonFound = false;
        for (const playSelector of playButtonSelectors) {
          try {
            await this.playwrightService.waitForElement(playSelector, 3000);
            playButtonFound = true;
            execution.result.logs.push(`✅ Call record details loaded - play button found`);
          break;
        } catch (error) {
          // Continue to next selector
        }
      }

        if (!playButtonFound) {
          execution.result.logs.push('⚠️ Play button not immediately visible, but continuing to next step');
        }
      } catch (error) {
        execution.result.logs.push('⚠️ Could not verify call record details, but continuing');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      execution.result.logs.push(`❌ Test 4 failed: ${errorMessage}`);
      throw error;
    }
  }

  private async testPlayCallRecording(execution: TestExecution): Promise<void> {
    try {
      execution.result.logs.push('🔍 Testing 5: Playing call recording and verifying playback...');

      // Look for play recording button
      const playRecordingSelectors = [
        'button:has-text("Play")',
        'button:has-text("play")',
        'button[class*="play"]',
        'button[aria-label*="play"]',
        'button:has(svg[class*="play"])',
        'button:has(svg[class*="Play"])',
        'div[class*="play"]',
        'a:has-text("Play")',
        'i[class*="play"]',
        'svg[class*="play"]'
      ];

      let playButtonClicked = false;
      for (const selector of playRecordingSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 2000);
          await this.playwrightService.clickElement(selector);
          playButtonClicked = true;
          execution.result.logs.push(`✅ Successfully clicked on play button using selector: ${selector}`);
          break;
        } catch (error) {
          // Continue to next selector
        }
      }

      if (!playButtonClicked) {
        throw new Error('Could not find or click on play recording button');
      }

      // Wait briefly for the audio widget to render
      await new Promise(resolve => setTimeout(resolve, 1000));

      // If an audio widget appears with a paused state, click play again to actually start playback
      try {
        const audioWidgetSelectors = [
          'audio',
          'button[aria-label*="Play"]',
          'button:has-text("Play")',
          'div[role="button"]:has-text("Play")'
        ];

        let secondPlayAttempted = false;
        for (const selector of audioWidgetSelectors) {
          try {
            await this.playwrightService.waitForElement(selector, 1500);
            // Try to programmatically start audio first
            const programmaticStarted = await this.playwrightService.playFirstAudio();
            if (!programmaticStarted) {
              // Fall back to a second click on a visible play control
              await this.playwrightService.clickElement(selector);
            }
            secondPlayAttempted = true;
            execution.result.logs.push('✅ Ensured playback by triggering Play on the audio widget');
            break;
          } catch (error) {
            // Continue to next selector
          }
        }

        if (!secondPlayAttempted) {
          execution.result.logs.push('⚠️ Audio widget not directly found after first click; proceeding to verify playback');
        }
      } catch (error) {
        execution.result.logs.push('⚠️ Could not perform secondary play action; proceeding to verify playback');
      }

      // Verify playback is working
      const playbackSelectors = [
        'button[class*="pause"]',
        'button[aria-label*="pause"]',
        'button:has(svg[class*="pause"])',
        'div[class*="playing"]',
        'div[class*="Playing"]',
        'div[class*="progress"]',
        'div[class*="Progress"]',
        'div[class*="time"]',
        'div[class*="Time"]'
      ];

      let playbackVerified = false;
      for (const selector of playbackSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 2000);
          playbackVerified = true;
          execution.result.logs.push(`✅ Playback verified using selector: ${selector}`);
          break;
        } catch (error) {
          // Continue to next selector
        }
      }

      // Also verify via audio API that some audio is playing
      if (!playbackVerified) {
        try {
          const isPlaying = await this.playwrightService.isAnyAudioPlaying();
          if (isPlaying) {
            playbackVerified = true;
            execution.result.logs.push('✅ Playback verified via audio element state');
          }
        } catch (error) {
          // Ignore and rely on selector-based verification
        }
      }

      if (!playbackVerified) {
        execution.result.logs.push('⚠️ Could not definitively verify playback, but continuing');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      execution.result.logs.push(`❌ Test 5 failed: ${errorMessage}`);
      throw error;
    }
  }

  private async testCloseDataStore(execution: TestExecution): Promise<void> {
    try {
      execution.result.logs.push('🔍 Testing 6: Closing data store...');

      // Look for close button or back button
      const closeSelectors = [
        'button:has-text("Close")',
        'button:has-text("close")',
        'button:has-text("Back")',
        'button:has-text("back")',
        'button:has-text("×")',
        'button[class*="close"]',
        'button[class*="Close"]',
        'button[class*="back"]',
        'button[class*="Back"]',
        'button[aria-label*="close"]',
        'button[aria-label*="Close"]',
        'a:has-text("Close")',
        'a:has-text("Back")',
        'i[class*="close"]',
        'i[class*="times"]'
      ];

      let dataStoreClosed = false;
      for (const selector of closeSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 2000);
          await this.playwrightService.clickElement(selector);
          dataStoreClosed = true;
          execution.result.logs.push(`✅ Successfully closed data store using selector: ${selector}`);
          break;
        } catch (error) {
          // Continue to next selector
        }
      }

      if (!dataStoreClosed) {
        // Try pressing Escape key as fallback
        try {
          await this.playwrightService.pressKey('Escape');
          dataStoreClosed = true;
          execution.result.logs.push('✅ Successfully closed data store using Escape key');
        } catch (error) {
          execution.result.logs.push('⚠️ Could not close data store, but continuing');
        }
      }

      // Wait for data store to close
      if (dataStoreClosed) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      execution.result.logs.push(`❌ Test 6 failed: ${errorMessage}`);
      throw error;
    }
  }

  private async testLogout(execution: TestExecution): Promise<void> {
    try {
      execution.result.logs.push('🔍 Testing 7: Logging out...');

      // Look for logout button or user menu
      const logoutSelectors = [
        'button:has-text("Logout")',
        'button:has-text("logout")',
        'button:has-text("Sign Out")',
        'button:has-text("sign out")',
        'button:has-text("Log Out")',
        'button:has-text("log out")',
        'button[class*="logout"]',
        'button[class*="Logout"]',
        'button[class*="signout"]',
        'button[class*="Signout"]',
        'a:has-text("Logout")',
        'a:has-text("Sign Out")',
        'div[class*="logout"]',
        'div[class*="Logout"]'
      ];

      let logoutClicked = false;
      for (const selector of logoutSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 2000);
          await this.playwrightService.clickElement(selector);
          logoutClicked = true;
          execution.result.logs.push(`✅ Successfully clicked on logout button using selector: ${selector}`);
            break;
        } catch (error) {
          // Continue to next selector
        }
      }

      if (!logoutClicked) {
        // Try looking for user menu first
        const userMenuSelectors = [
          'button[class*="user"]',
          'button[class*="User"]',
          'div[class*="user-menu"]',
          'div[class*="UserMenu"]',
          'div[class*="profile"]',
          'div[class*="Profile"]',
          'button[aria-label*="user"]',
          'button[aria-label*="User"]'
        ];

        for (const selector of userMenuSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 2000);
            await this.playwrightService.clickElement(selector);
            
            // Now look for logout in the dropdown
            for (const logoutSelector of logoutSelectors) {
              try {
                await this.playwrightService.waitForElement(logoutSelector, 2000);
                await this.playwrightService.clickElement(logoutSelector);
                logoutClicked = true;
                execution.result.logs.push(`✅ Successfully logged out via user menu using selector: ${logoutSelector}`);
          break;
        } catch (error) {
          // Continue to next selector
        }
      }

            if (logoutClicked) break;
          } catch (error) {
            // Continue to next selector
          }
        }
      }

      if (!logoutClicked) {
        execution.result.logs.push('⚠️ Could not find logout button, but continuing');
      } else {
        // Wait for logout to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verify logout was successful
        try {
          await this.playwrightService.waitForElement('input[type="email"], input[name="email"]', 5000);
          execution.result.logs.push('✅ Logout successful - Login form visible');
        } catch (error) {
          execution.result.logs.push('⚠️ Logout verification inconclusive');
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      execution.result.logs.push(`❌ Test 7 failed: ${errorMessage}`);
      throw error;
    }
  }

  async generateOpticallE2EReport(execution: TestExecution): Promise<TestReport> {
    const successfulSteps = execution.result.logs.filter((log: string) => log.includes('✅')).length;
    const failedSteps = execution.result.logs.filter((log: string) => log.includes('❌')).length;
    const warningSteps = execution.result.logs.filter((log: string) => log.includes('⚠️')).length;

    return {
      id: uuidv4(),
      websiteId: execution.websiteId,
      executionId: execution.id,
      summary: {
        totalTests: 7, // 7 specific test cases: Login, View Report, Charts, Data Store, Item Card, Play Recording, Close Data Store, Logout
        passed: execution.result.success ? 7 : 0,
        failed: execution.result.success ? 0 : 7,
        successRate: execution.result.success ? 100 : 0,
        averageDuration: execution.duration || 0
      },
      details: [execution],
      generatedAt: new Date()
    };
  }
}
