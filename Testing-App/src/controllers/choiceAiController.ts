import { Request, Response } from 'express';
import { ChoiceAiE2EService } from '../services/choiceAiE2EService';
import { ChoiceAiTestService } from '../services/choiceAiTestService';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';
import { TestExecutionModel } from '../models/TestExecutionModel';
import { TestReportModel } from '../models/TestReportModel';
import { ChoiceAiLogModel } from '../models/ChoiceAiLogModel';

export class ChoiceAiController {
  private choiceAiE2EService: ChoiceAiE2EService;
  private choiceAiTestService: ChoiceAiTestService;

  constructor() {
    this.choiceAiE2EService = new ChoiceAiE2EService();
    this.choiceAiTestService = new ChoiceAiTestService();
  }

  async executeChoiceAiLoginTest(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Choice-AI login test requested');

      const execution = await this.choiceAiTestService.executeChoiceAiLoginTest();
      const report = await this.choiceAiTestService.generateChoiceAiTestReport(execution);

      const response: ApiResponse = {
        success: true,
        message: `Choice-AI login test ${execution.status}`,
        data: {
          execution,
          report
        }
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error(`Choice-AI login test failed: ${errorMessage}`);

      const response: ApiResponse = {
        success: false,
        message: 'Choice-AI login test failed',
        error: errorMessage
      };

      res.status(500).json(response);
    }
  }

  async executeChoiceAiE2ETest(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Choice-AI complete E2E test requested');

      const execution = await this.choiceAiE2EService.executeChoiceAiE2ETest();
      const report = await this.choiceAiE2EService.generateChoiceAiE2EReport(execution);

      // Persist execution, report, and logs if DB is connected
      try {
        await TestExecutionModel.create({
          executionId: execution.id,
          websiteId: execution.websiteId,
          routeId: execution.routeId,
          status: execution.status,
          startTime: execution.startTime,
          endTime: execution.endTime,
          duration: execution.duration,
          result: execution.result,
        });
        await TestReportModel.create({
          websiteId: execution.websiteId,
          executionId: execution.id,
          summary: report.summary,
          generatedAt: new Date(),
        });
        const logs = Array.isArray(execution?.result?.logs)
          ? execution.result.logs
          : Array.isArray((report as any)?.details?.[0]?.result?.logs)
            ? (report as any).details[0].result.logs
            : [];
        await ChoiceAiLogModel.create({ executionId: execution.id, logs });
      } catch (dbErr) {
        logger.warn(`Failed to persist Choice-AI test: ${dbErr}`);
      }

      const response: ApiResponse = {
        success: true,
        message: `Choice-AI complete E2E test ${execution.status}`,
        data: {
          execution,
          report
        }
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error(`Choice-AI E2E test failed: ${errorMessage}`);

      const response: ApiResponse = {
        success: false,
        message: 'Choice-AI E2E test failed',
        error: errorMessage
      };

      res.status(500).json(response);
    }
  }

  async getE2ETestStatus(req: Request, res: Response): Promise<void> {
    try {
      const { executionId } = req.params;

      if (!executionId) {
        const response: ApiResponse = {
          success: false,
          message: 'Execution ID is required',
          error: 'Missing execution ID parameter'
        };
        res.status(400).json(response);
        return;
      }

      const exec = await TestExecutionModel.findOne({ executionId }).lean();
      if (!exec) {
        res.status(404).json({ success: false, message: 'Execution not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Status retrieved', data: exec });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error(`Failed to get Choice-AI E2E test status: ${errorMessage}`);

      const response: ApiResponse = {
        success: false,
        message: 'Failed to get E2E test status',
        error: errorMessage
      };

      res.status(500).json(response);
    }
  }

  async getChoiceAiE2ETestHistory(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Choice-AI E2E test history requested');
      const reports = await TestReportModel.find({ websiteId: 'choice-ai' })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      const response: ApiResponse = {
        success: true,
        message: 'Choice-AI E2E test history retrieved',
        data: {
          website: 'choice-ai',
          tests: reports.map((r: any) => ({
            id: r._id.toString(),
            executionId: r.executionId,
            generatedAt: r.generatedAt,
            summary: r.summary,
          })),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error(`Failed to get Choice-AI E2E test history: ${errorMessage}`);

      const response: ApiResponse = {
        success: false,
        message: 'Failed to get E2E test history',
        error: errorMessage
      };

      res.status(500).json(response);
    }
  }
} 