import { Request, Response } from 'express';
import { NyaayAiE2EService } from '../services/nyaayAiE2EService';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';
import { TestExecutionModel } from '../models/TestExecutionModel';
import { TestReportModel } from '../models/TestReportModel';
import { NyaayAiLogModel } from '../models/NyaayAiLogModel';

export class NyaayAiController {
  private nyaayAiE2EService: NyaayAiE2EService;

  constructor() {
    this.nyaayAiE2EService = new NyaayAiE2EService();
  }

  async executeNyaayAiE2ETest(req: Request, res: Response): Promise<Response | void> {
    try {
      logger.info('Nyaay AI complete E2E test requested');

      const execution = await this.nyaayAiE2EService.executeNyaayAiE2ETest();
      const report = await this.nyaayAiE2EService.generateNyaayAiE2EReport(execution);

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
        
        // Store detailed logs
        const logs = Array.isArray(execution?.result?.logs)
          ? execution.result.logs
          : Array.isArray((report as any)?.details?.[0]?.result?.logs)
            ? (report as any).details[0].result.logs
            : [];
        await NyaayAiLogModel.create({ executionId: execution.id, logs });
        
        logger.info(`Nyaay AI test results persisted to database: ${execution.id}`);
      } catch (dbErr) {
        logger.warn(`Failed to persist Nyaay AI test: ${dbErr}`);
      }

      const response: ApiResponse = {
        success: true,
        message: `Nyaay AI complete E2E test ${execution.status}`,
        data: {
          execution,
          report
        }
      };

      return res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error(`Nyaay AI E2E test failed: ${errorMessage}`);

      const response: ApiResponse = {
        success: false,
        message: 'Nyaay AI E2E test failed',
        error: errorMessage
      };

      return res.status(500).json(response);
    }
  }

  async getE2ETestStatus(req: Request, res: Response): Promise<Response | void> {
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
        return res.status(404).json({ success: false, message: 'Execution not found' });
      }
      return res.status(200).json({ success: true, message: 'Status retrieved', data: exec });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error(`Failed to get Nyaay AI E2E test status: ${errorMessage}`);

      const response: ApiResponse = {
        success: false,
        message: 'Failed to get E2E test status',
        error: errorMessage
      };

      return res.status(500).json(response);
    }
  }

  async getNyaayAiE2ETestHistory(req: Request, res: Response): Promise<Response | void> {
    try {
      logger.info('Nyaay AI E2E test history requested');

      const reports = await TestReportModel.find({ websiteId: 'nyaay-ai' })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      const response: ApiResponse = {
        success: true,
        message: 'Nyaay AI E2E test history retrieved',
        data: {
          website: 'nyaay-ai',
          tests: reports.map((r: any) => ({
            id: r._id.toString(),
            executionId: r.executionId,
            generatedAt: r.generatedAt,
            summary: r.summary,
          })),
        },
      };

      return res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error(`Failed to get Nyaay AI E2E test history: ${errorMessage}`);

      const response: ApiResponse = {
        success: false,
        message: 'Failed to get E2E test history',
        error: errorMessage
      };

      return res.status(500).json(response);
    }
  }

  async getNyaayAiLogs(req: Request, res: Response): Promise<Response | void> {
    try {
      const { executionId } = req.params;
      
      if (!executionId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing executionId' 
        });
      }
      
      const doc = await NyaayAiLogModel.findOne({ executionId }).lean();
      if (!doc) {
        return res.status(404).json({ 
          success: false, 
          message: 'Logs not found' 
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        data: { 
          executionId, 
          logs: (doc as any).logs || []
        } 
      });
    } catch (e: any) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch logs', 
        error: e?.message 
      });
    }
  }
}
