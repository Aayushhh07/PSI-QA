import { Request, Response } from 'express';
import { TestService } from '../services/testService';
import { ApiResponse, TestRequest } from '../types';
import { logger } from '../utils/logger';

export class TestController {
  private testService: TestService;

  constructor() {
    this.testService = new TestService();
  }

  async executeTest(req: Request, res: Response): Promise<void> {
    try {
      const testRequest: TestRequest = req.body;

      // Validate required fields
      if (!testRequest.websiteId) {
        res.status(400).json({
          success: false,
          error: 'websiteId is required'
        } as ApiResponse);
        return;
      }

      logger.info(`Executing test for website: ${testRequest.websiteId}`);

      const execution = await this.testService.executeTest(testRequest);

      const response: ApiResponse = {
        success: true,
        data: execution,
        message: 'Test execution started successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error(`Error executing test: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to execute test'
      } as ApiResponse);
    }
  }

  async getExecution(req: Request, res: Response): Promise<void> {
    try {
      const { executionId } = req.params;

      const execution = this.testService.getExecution(executionId);

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
      logger.error(`Error getting execution: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get execution'
      } as ApiResponse);
    }
  }

  async getAllExecutions(req: Request, res: Response): Promise<void> {
    try {
      const executions = this.testService.getAllExecutions();

      const response: ApiResponse = {
        success: true,
        data: executions
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error(`Error getting all executions: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get executions'
      } as ApiResponse);
    }
  }

  async getWebsiteExecutions(req: Request, res: Response): Promise<void> {
    try {
      const { websiteId } = req.params;

      const executions = this.testService.getWebsiteExecutions(websiteId);

      const response: ApiResponse = {
        success: true,
        data: executions
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error(`Error getting website executions: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get website executions'
      } as ApiResponse);
    }
  }

  async cancelExecution(req: Request, res: Response): Promise<void> {
    try {
      const { executionId } = req.params;

      const execution = this.testService.getExecution(executionId);

      if (!execution) {
        res.status(404).json({
          success: false,
          error: 'Execution not found'
        } as ApiResponse);
        return;
      }

      if (execution.status === 'completed' || execution.status === 'failed') {
        res.status(400).json({
          success: false,
          error: 'Cannot cancel completed or failed execution'
        } as ApiResponse);
        return;
      }

      // Update execution status to cancelled
      execution.status = 'cancelled';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();

      const response: ApiResponse = {
        success: true,
        data: execution,
        message: 'Execution cancelled successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error(`Error cancelling execution: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel execution'
      } as ApiResponse);
    }
  }
} 