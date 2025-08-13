import { Request, Response } from 'express';
import { OpticallE2EService } from '../services/opticallE2EService';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';
import { TestExecutionModel } from '../models/TestExecutionModel';
import { TestReportModel } from '../models/TestReportModel';

export class OpticallController {
  private opticallE2EService: OpticallE2EService;

  constructor() {
    this.opticallE2EService = new OpticallE2EService();
  }

  async executeOpticallE2ETest(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Opticall complete E2E test requested');

      const execution = await this.opticallE2EService.executeOpticallE2ETest();
      const report = await this.opticallE2EService.generateOpticallE2EReport(execution);

      // Persist execution and report if DB is connected
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
      } catch (dbErr) {
        logger.warn(`Failed to persist Opticall test: ${dbErr}`);
      }

      const response: ApiResponse = {
        success: true,
        message: `Opticall complete E2E test ${execution.status}`,
        data: {
          execution,
          report
        }
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error(`Opticall E2E test failed: ${errorMessage}`);

      const response: ApiResponse = {
        success: false,
        message: 'Opticall E2E test failed',
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
      logger.error(`Failed to get Opticall E2E test status: ${errorMessage}`);

      const response: ApiResponse = {
        success: false,
        message: 'Failed to get E2E test status',
        error: errorMessage
      };

      res.status(500).json(response);
    }
  }

  async getOpticallE2ETestHistory(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Opticall E2E test history requested');

      const reports = await TestReportModel.find({ websiteId: 'opticall' })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      const response: ApiResponse = {
        success: true,
        message: 'Opticall E2E test history retrieved',
        data: {
          website: 'opticall',
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
      logger.error(`Failed to get Opticall E2E test history: ${errorMessage}`);

      const response: ApiResponse = {
        success: false,
        message: 'Failed to get E2E test history',
        error: errorMessage
      };

      res.status(500).json(response);
    }
  }
}
