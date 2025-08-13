import { PlaywrightService } from '../playwrightService';
import { TestExecution } from '../../types';

export class StatusFilterHandler {
  constructor(private playwrightService: PlaywrightService) {}

  async testStatusFilter(execution: TestExecution, status: 'pending' | 'approved' | 'rejected'): Promise<void> {
    try {
      execution.result.logs.push(`🔍 Testing ${status.toUpperCase()} filter...`);
      
      // Find and click the status filter Select component
      const selectButtonSelectors = [
        'button[role="combobox"][aria-expanded="false"]',
        'button[role="combobox"]',
        'button:has-text("All Statuses")',
        'button[class*="flex h-10"]',
        '[role="combobox"]'
      ];
      
      let selectButtonFound = false;
      for (const selector of selectButtonSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 2000);
          await this.playwrightService.clickElement(selector);
          selectButtonFound = true;
          break;
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (!selectButtonFound) {
        throw new Error(`Could not find status filter Select component for ${status} test`);
      }
        
      // Wait for the dropdown to open
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Look for the specific status option in the dropdown
      const statusSelectors = [
        `[data-radix-popper-content-wrapper] [role="option"]:has-text("${status.charAt(0).toUpperCase() + status.slice(1)}")`,
        `[data-radix-popper-content-wrapper] div:has-text("${status.charAt(0).toUpperCase() + status.slice(1)}")`,
        `[data-radix-popper-content-wrapper] span:has-text("${status.charAt(0).toUpperCase() + status.slice(1)}")`,
        `[role="option"]:has-text("${status.charAt(0).toUpperCase() + status.slice(1)}")`,
        `[data-value="${status}"]`,
        `div:has-text("${status.charAt(0).toUpperCase() + status.slice(1)}")`,
        `span:has-text("${status.charAt(0).toUpperCase() + status.slice(1)}")`
      ];
      
      let statusOptionFound = false;
      for (const selector of statusSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 2000);
          await this.playwrightService.clickElement(selector);
          statusOptionFound = true;
          break;
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (!statusOptionFound) {
        // Try keyboard navigation as fallback
        try {
          await this.playwrightService.typeText(status.charAt(0).toUpperCase() + status.slice(1));
          await new Promise(resolve => setTimeout(resolve, 500));
          await this.playwrightService.pressKey('Enter');
          statusOptionFound = true;
        } catch (error) {
          throw new Error(`Could not find "${status.charAt(0).toUpperCase() + status.slice(1)}" option in dropdown`);
        }
      }
      
      // Wait for the selection to take effect and content to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify the content shows only items with the selected status
      await this.verifyStatusContent(execution, status);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      execution.result.logs.push(`❌ ${status.toUpperCase()} filter test failed: ${errorMessage}`);
      throw error;
    }
  }

  private async verifyStatusContent(execution: TestExecution, expectedStatus: 'pending' | 'approved' | 'rejected'): Promise<void> {
    try {
      execution.result.logs.push(`🔍 Checking ${expectedStatus.toUpperCase()} status content...`);
      
      // Look for video content divisions (max 10 as mentioned)
      const videoContentSelectors = [
        'div.group.flex.items-center.justify-between',
        'div[class*="group flex items-center justify-between"]',
        'div[class*="border-gray-800 hover:border-orange-500"]',
        'div[class*="cursor-pointer"]'
      ];
      
      let videoDivs: any[] = [];
      for (const selector of videoContentSelectors) {
        try {
          const elements = await this.playwrightService.getElements(selector);
          if (elements.length > 0) {
            videoDivs = elements;
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (videoDivs.length === 0) {
        execution.result.logs.push(`❌ No video content divisions found for ${expectedStatus} status`);
        return;
      }
      
      // Verify each division has the correct status
      let correctStatusCount = 0;
      let incorrectStatusCount = 0;
      
      for (let i = 0; i < Math.min(videoDivs.length, 10); i++) {
        try {
          const div = videoDivs[i];
          
          // Check for status indicators in the division
          const statusSelectors = [
            'div[class*="bg-yellow-500"] span:has-text("pending")',
            'div[class*="bg-green-500"] span:has-text("approved")',
            'div[class*="bg-red-500"] span:has-text("rejected")',
            'span:has-text("pending")',
            'span:has-text("approved")',
            'span:has-text("rejected")',
            'div[class*="capitalize"]'
          ];
          
          let statusFound = false;
          let actualStatus = '';
          
          for (const statusSelector of statusSelectors) {
            try {
              const statusElement = await div.$(statusSelector);
              if (statusElement) {
                const statusText = await statusElement.textContent();
                if (statusText) {
                  actualStatus = statusText.toLowerCase().trim();
                  statusFound = true;
                  break;
                }
              }
            } catch (error) {
              // Continue to next selector
            }
          }
          
          if (statusFound) {
            if (actualStatus === expectedStatus) {
              correctStatusCount++;
            } else {
              incorrectStatusCount++;
            }
          } else {
            incorrectStatusCount++;
          }
          
        } catch (error) {
          incorrectStatusCount++;
        }
      }
      
      // Summary for this status - only log the essential result
      if (incorrectStatusCount === 0) {
        execution.result.logs.push(`✅ ${expectedStatus.toUpperCase()} status check: All ${correctStatusCount} items are correct`);
      } else {
        execution.result.logs.push(`❌ ${expectedStatus.toUpperCase()} status check: ${correctStatusCount} correct, ${incorrectStatusCount} incorrect items found`);
      }
      
      // Click on first division to open video details page
      if (videoDivs.length > 0) {
        await this.verifyVideoDetailsPage(execution, expectedStatus, videoDivs[0]);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      execution.result.logs.push(`❌ ${expectedStatus.toUpperCase()} status check failed: ${errorMessage}`);
    }
  }

  private async verifyVideoDetailsPage(execution: TestExecution, status: 'pending' | 'approved' | 'rejected', firstDivision: any): Promise<void> {
    try {
      execution.result.logs.push(`🔍 Opening video details for ${status.toUpperCase()} status...`);
      
      // Click on the first division to open video details
      await firstDivision.click();
      
      // Wait for navigation to video details page
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify we're on video details page
      const currentUrl = await this.playwrightService.getCurrentUrl();
      if (!currentUrl.includes('video-details')) {
        execution.result.logs.push(`❌ Failed to navigate to video details page for ${status} status`);
        return;
      }
      
      execution.result.logs.push(`✅ Successfully opened video details page for ${status} status`);
      
      // Check Content Labels tab
      const contentLabelsResult = await this.verifyContentLabelsTab(execution, status);
      
      // Check Audio Labels tab
      const audioLabelsResult = await this.verifyAudioLabelsTab(execution, status);
      
      // For rejected status, check if both tabs are missing content
      if (status === 'rejected' && !contentLabelsResult && !audioLabelsResult) {
        execution.result.logs.push(`❌ REJECTED status verification failed: Both Content Labels and Audio Labels have no data (rejected videos should have content in at least one tab)`);
        execution.result.success = false; // Set test as failed
      } else if (status === 'rejected' && (contentLabelsResult || audioLabelsResult)) {
        execution.result.logs.push(`✅ REJECTED status verification successful: At least one tab has content`);
      }
      
      // Check timeline section
      await this.verifyTimelineSection(execution, status);
      
      // Click the close button (X) to return to previous page
      await this.clickCloseButton(execution, status);
      
      execution.result.logs.push(`✅ Video details verification completed for ${status} status`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      execution.result.logs.push(`❌ Video details verification failed for ${status} status: ${errorMessage}`);
    }
  }

  private async clickCloseButton(execution: TestExecution, status: 'pending' | 'approved' | 'rejected'): Promise<void> {
    try {
      // Look for the close button (X) with multiple selectors
      const closeButtonSelectors = [
        'div.rounded-full.bg-gray-800.w-8.h-8.flex.items-center.justify-center.cursor-pointer',
        'div[class*="rounded-full bg-gray-800 w-8 h-8"]',
        'div[class*="cursor-pointer"] svg[class*="lucide-x"]',
        'button[aria-label="Close"]',
        'button:has-text("×")',
        'div[class*="bg-gray-800"]:has(svg)',
        'svg[class*="lucide-x"]'
      ];
      
      let closeButtonFound = false;
      for (const selector of closeButtonSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 2000);
          await this.playwrightService.clickElement(selector);
          closeButtonFound = true;
          execution.result.logs.push(`✅ Successfully clicked close button for ${status} status`);
          break;
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (!closeButtonFound) {
        // Try alternative approach - look for any clickable element with X icon
        try {
          const xIconSelectors = [
            'svg:has(path[d="M18 6 6 18"])',
            'svg:has(path[d="m6 6 12 12"])',
            'div:has(svg[class*="lucide-x"])'
          ];
          
          for (const xSelector of xIconSelectors) {
            try {
              await this.playwrightService.waitForElement(xSelector, 1000);
              await this.playwrightService.clickElement(xSelector);
              closeButtonFound = true;
              execution.result.logs.push(`✅ Successfully clicked X icon for ${status} status`);
              break;
            } catch (error) {
              // Continue to next selector
            }
          }
        } catch (error) {
          // Continue if this approach also fails
        }
      }
      
      if (!closeButtonFound) {
        // Fallback to browser back button
        try {
          await this.playwrightService.pressKey('Escape');
          execution.result.logs.push(`⚠️ Using Escape key as fallback for ${status} status`);
        } catch (error) {
          execution.result.logs.push(`❌ Failed to close video details page for ${status} status`);
        }
      }
      
      // Wait for navigation back to previous page
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      execution.result.logs.push(`❌ Close button click failed for ${status} status: ${errorMessage}`);
    }
  }

  private async verifyContentLabelsTab(execution: TestExecution, status: 'pending' | 'approved' | 'rejected'): Promise<boolean> {
    try {
      if (status === 'rejected') {
        // For rejected status, first check if there's "No content labels" message
        const noContentLabelsSelectors = [
          'div:has-text("No content labels with timeline data available for this video.")',
          'p:has-text("No content labels with timeline data available for this video.")',
          'div[class*="bg-[#1a1a1a]"] p:has-text("No content labels")',
          'div[class*="rounded-lg"] p:has-text("No content labels")'
        ];
        
        let noContentMessageFound = false;
        for (const selector of noContentLabelsSelectors) {
          try {
            await this.playwrightService.waitForElement(selector, 2000);
            noContentMessageFound = true;
            break;
          } catch (error) {
            // Continue to next selector
          }
        }
        
        if (noContentMessageFound) {
          execution.result.logs.push(`❌ Content Labels tab: No content labels found for ${status} status`);
          return false; // Return false to indicate no content found
        } else {
          // Check for actual content components
          const contentLabelsComponents = [
            'div[role="tabpanel"][data-state="active"] div[class*="bg-[#1a1a1a]"]',
            'div[role="tabpanel"] div[class*="rounded-lg"]',
            'div[role="tabpanel"] span[class*="text-white"]',
            'div[role="tabpanel"] button[class*="hover:bg-modera-orange"]',
            'div[data-state="active"] div[class*="bg-[#1a1a1a]"]',
            'div[data-state="active"] span[class*="text-white"]'
          ];
          
          let contentFound = false;
          for (const selector of contentLabelsComponents) {
            try {
              await this.playwrightService.waitForElement(selector, 2000);
              contentFound = true;
              break;
            } catch (error) {
              // Continue to next selector
            }
          }
          
          if (contentFound) {
            execution.result.logs.push(`✅ Content Labels tab has data for ${status} status`);
            
            // For rejected status with content, verify timeline for each label
            await this.verifyContentLabelsTimeline(execution, status);
            
            return true; // Return true to indicate content was found
          } else {
            execution.result.logs.push(`❌ Content Labels tab has no data for ${status} status`);
            return false; // Return false to indicate no content found
          }
        }
      } else {
        // For pending and approved status, check for "No content labels" message
        const noContentLabelsSelectors = [
          'div:has-text("No content labels with timeline data available for this video.")',
          'p:has-text("No content labels with timeline data available for this video.")',
          'div[class*="bg-[#1a1a1a]"] p:has-text("No content labels")',
          'div[class*="rounded-lg"] p:has-text("No content labels")'
        ];
        
        let messageFound = false;
        for (const selector of noContentLabelsSelectors) {
          try {
            await this.playwrightService.waitForElement(selector, 2000);
            messageFound = true;
            break;
          } catch (error) {
            // Continue to next selector
          }
        }
        
        if (messageFound) {
          execution.result.logs.push(`✅ Content Labels tab: No content labels found for ${status} status (expected)`);
          return true;
        } else {
          // Check if there's actual content (which would be an error for pending/approved)
          const contentLabelsComponents = [
            'div[role="tabpanel"][data-state="active"] div[class*="bg-[#1a1a1a]"]',
            'div[role="tabpanel"] div[class*="rounded-lg"]',
            'div[role="tabpanel"] span[class*="text-white"]',
            'div[role="tabpanel"] button[class*="hover:bg-modera-orange"]',
            'div[data-state="active"] div[class*="bg-[#1a1a1a]"]',
            'div[data-state="active"] span[class*="text-white"]'
          ];
          
          let contentFound = false;
          for (const selector of contentLabelsComponents) {
            try {
              await this.playwrightService.waitForElement(selector, 2000);
              contentFound = true;
              break;
            } catch (error) {
              // Continue to next selector
            }
          }
          
          if (contentFound) {
            execution.result.logs.push(`❌ Content Labels tab: Unexpected content found for ${status} status (should be empty)`);
            execution.result.success = false; // Set test as failed
            return false;
          } else {
            execution.result.logs.push(`❌ Content Labels tab: No "no content" message found for ${status} status`);
            return false;
          }
        }
      }
      
    } catch (error) {
      execution.result.logs.push(`❌ Content Labels tab verification error for ${status} status`);
      return false;
    }
  }

  private async verifyContentLabelsTimeline(execution: TestExecution, status: 'pending' | 'approved' | 'rejected'): Promise<void> {
    try {
      execution.result.logs.push(`🔍 Verifying timeline content for Content Labels in ${status} status...`);
      
      // Find all content label buttons (clock icons)
      const labelButtonSelectors = [
        'button[class*="hover:bg-modera-orange"] svg[class*="lucide-clock"]',
        'button:has(svg[class*="lucide-clock"])',
        'div[class*="bg-[#1a1a1a]"] button:has(svg)',
        'div[class*="rounded-lg"] button:has(svg)'
      ];
      
      let labelButtons: any[] = [];
      for (const selector of labelButtonSelectors) {
        try {
          const buttons = await this.playwrightService.getElements(selector);
          if (buttons.length > 0) {
            labelButtons = buttons;
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (labelButtons.length === 0) {
        execution.result.logs.push(`❌ No content label buttons found for timeline verification`);
        execution.result.success = false; // Set test as failed
        return;
      }
      
      execution.result.logs.push(`📊 Found ${labelButtons.length} content label buttons to verify`);
      
      let successfulTimelineChecks = 0;
      let failedTimelineChecks = 0;
      
      // Click each label button and verify timeline table
      for (let i = 0; i < labelButtons.length; i++) {
        try {
          const button = labelButtons[i];
          
          // Get the label name before clicking
          const labelNameElement = await button.evaluateHandle((el: any) => {
            const parent = el.closest('div[class*="bg-[#1a1a1a]"]');
            const labelSpan = parent?.querySelector('span[class*="text-white"]');
            return labelSpan?.textContent || 'Unknown Label';
          });
          const labelName = await labelNameElement.jsonValue();
          
          execution.result.logs.push(`🔍 Clicking label button: ${labelName}`);
          
          // Click the button
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check for timeline table
          const timelineTableSelectors = [
            'table[class*="w-full"]',
            'table thead th:has-text("Start Time")',
            'table thead th:has-text("End Time")',
            'table thead th:has-text("Action")'
          ];
          
          let tableFound = false;
          for (const tableSelector of timelineTableSelectors) {
            try {
              await this.playwrightService.waitForElement(tableSelector, 2000);
              tableFound = true;
              break;
            } catch (error) {
              // Continue to next selector
            }
          }
          
          if (tableFound) {
            // Check for table rows with start time, end time, and play buttons
            const tableRowSelectors = [
              'table tbody tr',
              'table tr td:has-text(":")', // Time format
              'table tr button:has-text("Play")'
            ];
            
            let rowsFound = 0;
            for (const rowSelector of tableRowSelectors) {
              try {
                const rows = await this.playwrightService.getElements(rowSelector);
                if (rows.length > 0) {
                  rowsFound = rows.length;
                  break;
                }
              } catch (error) {
                // Continue to next selector
              }
            }
            
            if (rowsFound > 0) {
              execution.result.logs.push(`✅ Timeline table verified for "${labelName}": ${rowsFound} timeline entries found`);
              successfulTimelineChecks++;
            } else {
              execution.result.logs.push(`❌ Timeline table found but no entries for "${labelName}"`);
              failedTimelineChecks++;
            }
          } else {
            execution.result.logs.push(`❌ No timeline table found for "${labelName}"`);
            failedTimelineChecks++;
          }
          
        } catch (error) {
          execution.result.logs.push(`❌ Error verifying timeline for label ${i + 1}: ${error}`);
          failedTimelineChecks++;
        }
      }
      
      // Summary
      if (failedTimelineChecks === 0) {
        execution.result.logs.push(`✅ All ${successfulTimelineChecks} content labels have valid timeline data`);
      } else {
        execution.result.logs.push(`⚠️ Timeline verification: ${successfulTimelineChecks} successful, ${failedTimelineChecks} failed`);
        // Set test as failed if timeline verification fails
        execution.result.success = false;
      }
      
    } catch (error) {
      execution.result.logs.push(`❌ Content Labels timeline verification error: ${error}`);
    }
  }

  private async verifyAudioLabelsTab(execution: TestExecution, status: 'pending' | 'approved' | 'rejected'): Promise<boolean> {
    try {
      // Look for Audio Labels tab button (it's inactive by default, needs to be clicked)
      const audioLabelsSelectors = [
        'button[role="tab"]:has-text("Audio Labels")',
        'button:has-text("Audio Labels")',
        'button[aria-controls*="audio-labels"]',
        'button[id*="trigger-audio-labels"]',
        '[data-radix-collection-item]:has-text("Audio Labels")'
      ];
      
      let audioLabelsTab = null;
      for (const selector of audioLabelsSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 2000);
          audioLabelsTab = selector;
          break;
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (!audioLabelsTab) {
        execution.result.logs.push(`❌ Audio Labels tab not found for ${status} status`);
        return false;
      }
      
      // Click on Audio Labels tab
      await this.playwrightService.clickElement(audioLabelsTab);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (status === 'rejected') {
        // For rejected status, first check if there's "No audio profanity labels" message
        const noAudioLabelsSelectors = [
          'div:has-text("No audio profanity labels found for this video.")',
          'p:has-text("No audio profanity labels found for this video.")',
          'div[class*="bg-[#1a1a1a]"] p:has-text("No audio profanity labels")',
          'div[class*="rounded-lg"] p:has-text("No audio profanity labels")'
        ];
        
        let noAudioMessageFound = false;
        for (const selector of noAudioLabelsSelectors) {
          try {
            await this.playwrightService.waitForElement(selector, 2000);
            noAudioMessageFound = true;
            break;
          } catch (error) {
            // Continue to next selector
          }
        }
        
        if (noAudioMessageFound) {
          execution.result.logs.push(`❌ Audio Labels tab: No audio profanity labels found for ${status} status`);
          return false; // Return false to indicate no content found
        } else {
          // Check for actual content components
          const audioLabelsComponents = [
            'div[role="tabpanel"][data-state="active"] div[class*="bg-[#1a1a1a]"]',
            'div[role="tabpanel"] div[class*="rounded-lg"]',
            'div[role="tabpanel"] span[class*="text-white"]',
            'div[role="tabpanel"] button[class*="hover:bg-modera-orange"]',
            'div[data-state="active"] div[class*="bg-[#1a1a1a]"]',
            'div[data-state="active"] span[class*="text-white"]',
            'span:has-text("instances")'
          ];
          
          let contentFound = false;
          for (const selector of audioLabelsComponents) {
            try {
              await this.playwrightService.waitForElement(selector, 2000);
              contentFound = true;
              break;
            } catch (error) {
              // Continue to next selector
            }
          }
          
          if (contentFound) {
            execution.result.logs.push(`✅ Audio Labels tab has data for ${status} status`);
            
            // For rejected status with content, verify timeline for each label
            await this.verifyAudioLabelsTimeline(execution, status);
            
            return true; // Return true to indicate content was found
          } else {
            execution.result.logs.push(`❌ Audio Labels tab has no data for ${status} status`);
            return false; // Return false to indicate no content found
          }
        }
      } else {
        // For pending and approved status, check for "No audio profanity labels" message
        const noAudioLabelsSelectors = [
          'div:has-text("No audio profanity labels found for this video.")',
          'p:has-text("No audio profanity labels found for this video.")',
          'div[class*="bg-[#1a1a1a]"] p:has-text("No audio profanity labels")',
          'div[class*="rounded-lg"] p:has-text("No audio profanity labels")'
        ];
        
        let messageFound = false;
        for (const selector of noAudioLabelsSelectors) {
          try {
            await this.playwrightService.waitForElement(selector, 2000);
            messageFound = true;
            break;
          } catch (error) {
            // Continue to next selector
          }
        }
        
        if (messageFound) {
          execution.result.logs.push(`✅ Audio Labels tab: No audio profanity labels found for ${status} status (expected)`);
          return true;
        } else {
          // Check if there's actual content (which would be an error for pending/approved)
          const audioLabelsComponents = [
            'div[role="tabpanel"][data-state="active"] div[class*="bg-[#1a1a1a]"]',
            'div[role="tabpanel"] div[class*="rounded-lg"]',
            'div[role="tabpanel"] span[class*="text-white"]',
            'div[role="tabpanel"] button[class*="hover:bg-modera-orange"]',
            'div[data-state="active"] div[class*="bg-[#1a1a1a]"]',
            'div[data-state="active"] span[class*="text-white"]',
            'span:has-text("instances")'
          ];
          
          let contentFound = false;
          for (const selector of audioLabelsComponents) {
            try {
              await this.playwrightService.waitForElement(selector, 2000);
              contentFound = true;
              break;
            } catch (error) {
              // Continue to next selector
            }
          }
          
          if (contentFound) {
            execution.result.logs.push(`❌ Audio Labels tab: Unexpected audio profanity content found for ${status} status (should be empty)`);
            execution.result.success = false; // Set test as failed
            return false;
          } else {
            execution.result.logs.push(`❌ Audio Labels tab: No "no audio profanity labels" message found for ${status} status`);
            return false;
          }
        }
      }
      
    } catch (error) {
      execution.result.logs.push(`❌ Audio Labels tab verification error for ${status} status`);
      return false;
    }
  }

  private async verifyAudioLabelsTimeline(execution: TestExecution, status: 'pending' | 'approved' | 'rejected'): Promise<void> {
    try {
      execution.result.logs.push(`🔍 Verifying timeline content for Audio Labels in ${status} status...`);
      
      // Find all audio label buttons (clock icons)
      const labelButtonSelectors = [
        'button[class*="hover:bg-modera-orange"] svg[class*="lucide-clock"]',
        'button:has(svg[class*="lucide-clock"])',
        'div[class*="bg-[#1a1a1a]"] button:has(svg)',
        'div[class*="rounded-lg"] button:has(svg)'
      ];
      
      let labelButtons: any[] = [];
      for (const selector of labelButtonSelectors) {
        try {
          const buttons = await this.playwrightService.getElements(selector);
          if (buttons.length > 0) {
            labelButtons = buttons;
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (labelButtons.length === 0) {
        execution.result.logs.push(`❌ No audio label buttons found for timeline verification`);
        execution.result.success = false; // Set test as failed
        return;
      }
      
      execution.result.logs.push(`📊 Found ${labelButtons.length} audio label buttons to verify`);
      
      let successfulTimelineChecks = 0;
      let failedTimelineChecks = 0;
      
      // Click each label button and verify timeline table
      for (let i = 0; i < labelButtons.length; i++) {
        try {
          const button = labelButtons[i];
          
          // Get the label name before clicking
          const labelNameElement = await button.evaluateHandle((el: any) => {
            const parent = el.closest('div[class*="bg-[#1a1a1a]"]');
            const labelSpan = parent?.querySelector('span[class*="text-white"]');
            return labelSpan?.textContent || 'Unknown Label';
          });
          const labelName = await labelNameElement.jsonValue();
          
          execution.result.logs.push(`🔍 Clicking audio label button: ${labelName}`);
          
          // Click the button
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check for timeline table with different structure for audio labels
          const timelineTableSelectors = [
            'table[class*="w-full"]',
            'table thead th:has-text("Time Range")',
            'table thead th:has-text("Words")',
            'table thead th:has-text("Action")'
          ];
          
          let tableFound = false;
          for (const tableSelector of timelineTableSelectors) {
            try {
              await this.playwrightService.waitForElement(tableSelector, 2000);
              tableFound = true;
              break;
            } catch (error) {
              // Continue to next selector
            }
          }
          
          if (tableFound) {
            // Check for table rows with time range, words, and play buttons
            const tableRowSelectors = [
              'table tbody tr',
              'table tr td:has-text(":")', // Time format
              'table tr button:has-text("Play")'
            ];
            
            let rowsFound = 0;
            for (const rowSelector of tableRowSelectors) {
              try {
                const rows = await this.playwrightService.getElements(rowSelector);
                if (rows.length > 0) {
                  rowsFound = rows.length;
                  break;
                }
              } catch (error) {
                // Continue to next selector
              }
            }
            
            if (rowsFound > 0) {
              execution.result.logs.push(`✅ Audio timeline table verified for "${labelName}": ${rowsFound} timeline entries found`);
              successfulTimelineChecks++;
            } else {
              execution.result.logs.push(`❌ Audio timeline table found but no entries for "${labelName}"`);
              failedTimelineChecks++;
            }
          } else {
            execution.result.logs.push(`❌ No audio timeline table found for "${labelName}"`);
            failedTimelineChecks++;
          }
          
        } catch (error) {
          execution.result.logs.push(`❌ Error verifying audio timeline for label ${i + 1}: ${error}`);
          failedTimelineChecks++;
        }
      }
      
      // Summary
      if (failedTimelineChecks === 0) {
        execution.result.logs.push(`✅ All ${successfulTimelineChecks} audio labels have valid timeline data`);
      } else {
        execution.result.logs.push(`⚠️ Audio timeline verification: ${successfulTimelineChecks} successful, ${failedTimelineChecks} failed`);
        // Set test as failed if timeline verification fails
        execution.result.success = false;
      }
      
    } catch (error) {
      execution.result.logs.push(`❌ Audio Labels timeline verification error: ${error}`);
    }
  }

  private async verifyTimelineSection(execution: TestExecution, status: 'pending' | 'approved' | 'rejected'): Promise<void> {
    try {
      // Check for the timeline section message
      const timelineSelectors = [
        'div[class*="flex-grow flex items-center justify-center mb-6 bg-[#0a0a0a]"] p:has-text("Select a profanity type from Audio Labels to show the timeline here.")',
        'div:has-text("Select a profanity type from Audio Labels to show the timeline here.")',
        'p:has-text("Select a profanity type from Audio Labels to show the timeline here.")',
        'div[class*="bg-[#0a0a0a]"] p[class*="text-gray-400"]:has-text("Select a profanity type")',
        'div[class*="flex-grow"] p[class*="text-gray-400"]:has-text("Select a profanity type")'
      ];
      
      let timelineFound = false;
      for (const selector of timelineSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 2000);
          timelineFound = true;
          break;
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (timelineFound) {
        execution.result.logs.push(`✅ Timeline section verification successful for ${status} status`);
      } else {
        execution.result.logs.push(`❌ Timeline section verification failed for ${status} status`);
      }
      
    } catch (error) {
      execution.result.logs.push(`❌ Timeline section verification error for ${status} status`);
    }
  }
} 