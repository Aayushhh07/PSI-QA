import { TestExecution } from '../../types';
import { testLogger } from '../../utils/logger';
import moment from 'moment';
import path from 'path';
import fs from 'fs';

export class FileHandler {
  static async saveTestResultsToFile(execution: TestExecution): Promise<void> {
    try {
      // Create test-results directory if it doesn't exist
      const testResultsDir = path.join(process.cwd(), 'test-results');
      if (!fs.existsSync(testResultsDir)) {
        fs.mkdirSync(testResultsDir, { recursive: true });
      }

      // Create website-specific directory if it doesn't exist
      const websiteDir = path.join(testResultsDir, execution.websiteId);
      if (!fs.existsSync(websiteDir)) {
        fs.mkdirSync(websiteDir, { recursive: true });
      }

      // Generate GMT datetime string for filename
      const gmtDateTime = moment().utc().format('YYYY-MM-DD_HH-mm-ss');
      const filename = `${gmtDateTime}.json`;
      const filePath = path.join(websiteDir, filename);

      // Prepare the test result data
      const testResultData = {
        executionId: execution.id,
        websiteId: execution.websiteId,
        routeId: execution.routeId,
        status: execution.status,
        startTime: execution.startTime,
        endTime: execution.endTime,
        duration: execution.duration,
        success: execution.result.success,
        error: execution.result.error,
        logs: execution.result.logs,
        performance: execution.result.performance,
        createdAt: execution.createdAt,
        savedAt: new Date().toISOString()
      };

      // Write to JSON file
      fs.writeFileSync(filePath, JSON.stringify(testResultData, null, 2), 'utf8');
      
      testLogger.info(`Test results saved to: ${filePath}`);
      execution.result.logs.push(`📁 Test results saved to: ${filePath}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      testLogger.error(`Failed to save test results: ${errorMessage}`);
      execution.result.logs.push(`❌ Failed to save test results: ${errorMessage}`);
    }
  }
} 