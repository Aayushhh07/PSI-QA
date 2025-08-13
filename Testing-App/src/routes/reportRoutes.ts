import { Router } from 'express';
import { Request, Response } from 'express';
import { TestService } from '../services/testService';
import { ApiResponse, TestReport } from '../types';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const testService = new TestService();

// Get test execution report
router.get('/execution/:executionId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { executionId } = req.params;

    const execution = testService.getExecution(executionId);

    if (!execution) {
      res.status(404).json({
        success: false,
        error: 'Execution not found'
      } as ApiResponse);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: execution
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error(`Error getting execution report: ${error}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get execution report'
    } as ApiResponse);
  }
});

// Get website test summary
router.get('/website/:websiteId/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const { websiteId } = req.params;

    const executions = testService.getWebsiteExecutions(websiteId);
    const websites = testService.getWebsites();
    const website = websites.find(w => w.id === websiteId);

    if (!website) {
      res.status(404).json({
        success: false,
        error: 'Website not found'
      } as ApiResponse);
      return;
    }

    const totalTests = executions.length;
    const passed = executions.filter(e => e.result.success).length;
    const failed = totalTests - passed;
    const successRate = totalTests > 0 ? (passed / totalTests) * 100 : 0;
    const averageDuration = executions.length > 0 
      ? executions.reduce((sum, e) => sum + (e.duration || 0), 0) / executions.length 
      : 0;

    const summary = {
      website,
      totalTests,
      passed,
      failed,
      successRate: Math.round(successRate * 100) / 100,
      averageDuration: Math.round(averageDuration),
      recentExecutions: executions.slice(-10) // Last 10 executions
    };

    const response: ApiResponse = {
      success: true,
      data: summary
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error(`Error getting website summary: ${error}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get website summary'
    } as ApiResponse);
  }
});

// Get overall system summary
router.get('/system/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const allExecutions = testService.getAllExecutions();
    const websites = testService.getWebsites();

    const totalTests = allExecutions.length;
    const passed = allExecutions.filter(e => e.result.success).length;
    const failed = totalTests - passed;
    const successRate = totalTests > 0 ? (passed / totalTests) * 100 : 0;
    const averageDuration = allExecutions.length > 0 
      ? allExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) / allExecutions.length 
      : 0;

    const summary = {
      totalWebsites: websites.length,
      totalTests,
      passed,
      failed,
      successRate: Math.round(successRate * 100) / 100,
      averageDuration: Math.round(averageDuration),
      recentExecutions: allExecutions.slice(-20), // Last 20 executions
      websites: websites.map(website => ({
        ...website,
        testCount: testService.getWebsiteExecutions(website.id).length
      }))
    };

    const response: ApiResponse = {
      success: true,
      data: summary
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error(`Error getting system summary: ${error}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get system summary'
    } as ApiResponse);
  }
});

export { router as reportRoutes }; 