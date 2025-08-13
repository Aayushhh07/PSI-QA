import { PlaywrightService } from '../playwrightService';
import { TestExecution } from '../../types';

export class ConsumptionHandler {
  constructor(private playwrightService: PlaywrightService) {}

  async testConsumptionPage(execution: TestExecution): Promise<void> {
    try {
      execution.result.logs.push('🔍 Testing Consumption page...');
      
      // Find and click the Consumption navigation link
      const consumptionNavSelectors = [
        'nav a[href="/consumption"]',
        'a[href="/consumption"]',
        'nav a:has-text("Consumption")',
        'a:has-text("Consumption")',
        'nav li a:has(svg[class*="lucide-clock"])',
        'a:has(svg[class*="lucide-clock"]):has-text("Consumption")'
      ];
      
      let consumptionLinkFound = false;
      for (const selector of consumptionNavSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 3000);
          await this.playwrightService.clickElement(selector);
          consumptionLinkFound = true;
          break;
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (!consumptionLinkFound) {
        throw new Error('Could not find Consumption navigation link');
      }
      
      // Wait for navigation to consumption page
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify we're on consumption page
      const currentUrl = await this.playwrightService.getCurrentUrl();
      if (!currentUrl.includes('/consumption')) {
        execution.result.logs.push('❌ Failed to navigate to consumption page');
        return;
      }
      
      // Verify the "With Moderation" component
      await this.verifyModerationComponent(execution);
      
      // Test date range filtering and table data
      await this.testDateRangeFiltering(execution);
      
      execution.result.logs.push('✅ Consumption page testing completed successfully');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      execution.result.logs.push(`❌ Consumption page test failed: ${errorMessage}`);
    }
  }

  private async verifyModerationComponent(execution: TestExecution): Promise<void> {
    try {
      // Find the moderation component
      const moderationComponentSelectors = [
        'div.bg-[#1a1a1a].p-6.rounded-lg.border.border-gray-800',
        'div[class*="bg-[#1a1a1a]"] div[class*="p-6"]',
        'div[class*="rounded-lg"] div[class*="border-gray-800"]',
        'div:has(h2:has-text("With Moderation"))',
        'div:has(p:has-text("h")):has(p:has-text("m")):has(p:has-text("s"))'
      ];
      
      let componentFound = false;
      for (const selector of moderationComponentSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 3000);
          componentFound = true;
          break;
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (!componentFound) {
        execution.result.logs.push('❌ "With Moderation" component not found');
        return;
      }
      
      // Verify the title
      const titleSelectors = [
        'h2:has-text("With Moderation")',
        'h2[class*="text-xl"]:has-text("With Moderation")',
        'h2[class*="font-medium"]:has-text("With Moderation")'
      ];
      
      let titleFound = false;
      for (const selector of titleSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 2000);
          titleFound = true;
          break;
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (!titleFound) {
        execution.result.logs.push('❌ "With Moderation" title not found');
      }
      
      // Verify the time display format (should contain hours, minutes, seconds)
      const timeDisplaySelectors = [
        'p[class*="text-3xl"]:has-text("h")',
        'p[class*="font-bold"]:has-text("h")',
        'p[class*="text-modera-orange"]:has-text("h")',
        'p:has-text("h"):has-text("m"):has-text("s")'
      ];
      
      let timeDisplayFound = false;
      let timeValue = '';
      
      for (const selector of timeDisplaySelectors) {
        try {
          const timeElements = await this.playwrightService.getElements(selector);
          if (timeElements && timeElements.length > 0) {
            timeValue = await timeElements[0].textContent() || '';
            timeDisplayFound = true;
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (timeDisplayFound && timeValue) {
        // Validate time format (should contain hours, minutes, seconds)
        const timeRegex = /(\d+)h\s+(\d+)m\s+(\d+)s/;
        const match = timeValue.match(timeRegex);
        
        if (match) {
          const hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          const seconds = parseInt(match[3]);
          
          // Validate time values are reasonable
          if (hours >= 0 && minutes >= 0 && minutes < 60 && seconds >= 0 && seconds < 60) {
            execution.result.logs.push(`✅ Time display: ${timeValue}`);
          } else {
            execution.result.logs.push('❌ Time format validation failed - invalid time values');
          }
        } else {
          execution.result.logs.push(`❌ Time format validation failed - invalid format: ${timeValue}`);
        }
      } else {
        execution.result.logs.push('❌ Time display not found or empty');
      }
      
      // Verify the total seconds display
      const totalSecondsSelectors = [
        'p[class*="text-sm"]:has-text("seconds total")',
        'p[class*="text-gray-400"]:has-text("seconds total")',
        'p:has-text("seconds total")',
        'p:has-text("total")'
      ];
      
      let totalSecondsFound = false;
      let totalSecondsValue = '';
      
      for (const selector of totalSecondsSelectors) {
        try {
          const secondsElements = await this.playwrightService.getElements(selector);
          if (secondsElements && secondsElements.length > 0) {
            totalSecondsValue = await secondsElements[0].textContent() || '';
            totalSecondsFound = true;
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (totalSecondsFound && totalSecondsValue) {
        // Extract total seconds number
        const secondsRegex = /\(([\d,]+)\s+seconds\s+total\)/;
        const match = totalSecondsValue.match(secondsRegex);
        
        if (match) {
          const totalSeconds = parseInt(match[1].replace(/,/g, ''));
          
          // Validate total seconds is reasonable (should be a large number)
          if (totalSeconds > 0) {
            execution.result.logs.push(`✅ Total seconds: ${totalSeconds.toLocaleString()}`);
          } else {
            execution.result.logs.push('❌ Total seconds validation failed - should be greater than 0');
          }
        } else {
          execution.result.logs.push(`❌ Total seconds format validation failed: ${totalSecondsValue}`);
        }
      } else {
        execution.result.logs.push('❌ Total seconds display not found or empty');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      execution.result.logs.push(`❌ Moderation component verification failed: ${errorMessage}`);
    }
  }

  private async testDateRangeFiltering(execution: TestExecution): Promise<void> {
    try {
      // Find start date input field
      const startDateSelectors = [
        'input[type="date"][id="startDate"]',
        'input[type="date"]:first-of-type',
        'input[id="startDate"]',
        'input[type="date"]'
      ];
      
      let startDateInput = null;
      for (const selector of startDateSelectors) {
        try {
          const elements = await this.playwrightService.getElements(selector);
          if (elements && elements.length > 0) {
            startDateInput = elements[0];
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (!startDateInput) {
        execution.result.logs.push('❌ Start date input not found');
        return;
      }
      
      // Find end date input field
      const endDateSelectors = [
        'input[type="date"][id="endDate"]',
        'input[type="date"]:last-of-type',
        'input[id="endDate"]',
        'input[type="date"]:nth-of-type(2)'
      ];
      
      let endDateInput = null;
      for (const selector of endDateSelectors) {
        try {
          const elements = await this.playwrightService.getElements(selector);
          if (elements && elements.length > 0) {
            endDateInput = elements[0];
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (!endDateInput) {
        execution.result.logs.push('❌ End date input not found');
        return;
      }
      
      // Calculate date range (7 days from today)
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      
      const startDate = sevenDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD format
      const endDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Fill start date
      await startDateInput.fill(startDate);
      
      // Fill end date
      await endDateInput.fill(endDate);
      
      // Find and click Search button
      const searchButtonSelectors = [
        'button:has-text("Search")',
        'button[class*="bg-modera-orange"]',
        'button[class*="text-white"]:has-text("Search")',
        'button:has-text("Search")[class*="h-10"]'
      ];
      
      let searchButtonFound = false;
      for (const selector of searchButtonSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 3000);
          await this.playwrightService.clickElement(selector);
          searchButtonFound = true;
          break;
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (!searchButtonFound) {
        execution.result.logs.push('❌ Search button not found');
        return;
      }
      
      // Wait for table to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify table exists and has data
      const tableSelectors = [
        'table[class*="w-full"]',
        'table[class*="caption-bottom"]',
        'table thead',
        'table tbody'
      ];
      
      let tableFound = false;
      for (const selector of tableSelectors) {
        try {
          await this.playwrightService.waitForElement(selector, 5000);
          tableFound = true;
          break;
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (!tableFound) {
        execution.result.logs.push('❌ Table not found after search');
        return;
      }
      
      // Check for table rows with data
      const tableRowSelectors = [
        'table tbody tr',
        'tbody tr[class*="border-b"]',
        'tr[class*="bg-[#1a1a1a]"]',
        'tr[class*="bg-[#252525]"]'
      ];
      
      let tableRows = [];
      for (const selector of tableRowSelectors) {
        try {
          const rows = await this.playwrightService.getElements(selector);
          if (rows && rows.length > 0) {
            tableRows = rows;
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (tableRows.length === 0) {
        execution.result.logs.push('❌ No entries found for the last 7 days');
        return;
      }
      
      execution.result.logs.push(`✅ Found ${tableRows.length} entries for the last 7 days`);
      
      // Verify table structure and data
      await this.verifyTableStructure(execution, tableRows);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      execution.result.logs.push(`❌ Date range filtering test failed: ${errorMessage}`);
    }
  }

  private async verifyTableStructure(execution: TestExecution, tableRows: any[]): Promise<void> {
    try {
      // Verify table headers
      const headerSelectors = [
        'table thead th',
        'thead th[class*="text-left"]',
        'th:has-text("Date")',
        'th:has-text("With Moderation")',
        'th:has-text("Subtitle with Translation Only")'
      ];
      
      let headersFound = 0;
      for (const selector of headerSelectors) {
        try {
          const headers = await this.playwrightService.getElements(selector);
          if (headers && headers.length > 0) {
            headersFound = headers.length;
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (headersFound < 3) {
        execution.result.logs.push('❌ Expected table headers not found');
      }
      
      // Sample a few rows to verify data format
      const sampleRows = tableRows.slice(0, Math.min(3, tableRows.length));
      
             for (let i = 0; i < sampleRows.length; i++) {
         try {
           const row = sampleRows[i];
           const cells = await row.$$('td');
           
           if (cells && cells.length >= 3) {
             const dateCell = await cells[0].textContent();
             const moderationCell = await cells[1].textContent();
             
             // Verify date format (YYYY-MM-DD)
             if (!dateCell || !/^\d{4}-\d{2}-\d{2}$/.test(dateCell.trim())) {
               execution.result.logs.push('❌ Date format is invalid');
             }
             
             // Verify time format (contains h, m, s)
             if (!moderationCell || !/.*[hm]s?.*/.test(moderationCell.trim())) {
               execution.result.logs.push('❌ Moderation time format is invalid');
             }
           }
         } catch (error) {
           execution.result.logs.push(`❌ Error processing row ${i + 1}: ${error}`);
         }
       }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      execution.result.logs.push(`❌ Table structure verification failed: ${errorMessage}`);
    }
  }
} 