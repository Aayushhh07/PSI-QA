import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { testRoutes } from './routes/testRoutes';
import { websiteRoutes } from './routes/websiteRoutes';
import { reportRoutes } from './routes/reportRoutes';
import choiceAiRoutes from './routes/choiceAiRoutes';
import opticallRoutes from './routes/opticallRoutes';
import { connectToMongo } from './db/mongo';
import cron from 'node-cron';
import { ChoiceAiController } from './controllers/choiceAiController';
import { OpticallController } from './controllers/opticallController';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Routes
app.use('/api/tests', testRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/choice-ai', choiceAiRoutes);
app.use('/api/opticall', opticallRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT}`);
  logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
  logger.info(`🧪 Testing API available at http://localhost:${PORT}/api/tests`);
  // connect to database lazily on startup
  connectToMongo();

  // Schedule daily test runs at 3 AM by default
  const enableCron = String(process.env.ENABLE_DAILY_CRON || 'true').toLowerCase() === 'true';
  if (enableCron) {
    const cronExpr = process.env.DAILY_CRON || '0 3 * * *';
    const tz = process.env.CRON_TZ || 'UTC';
    const choice = new ChoiceAiController();
    const optic = new OpticallController();
    cron.schedule(cronExpr, async () => {
      try {
        logger.info(`⏰ Cron: triggering daily tests (tz=${tz})`);
        // Trigger both tests sequentially to avoid resource contention
        await choice.executeChoiceAiE2ETest(
          // @ts-ignore - fabricate minimal req/res to reuse handler
          { method: 'POST' },
          {
            status: (code: number) => ({ json: (body: any) => logger.info(`Choice-AI cron result [${code}]: ${body?.message || ''}`) }),
            json: (body: any) => logger.info(`Choice-AI cron result: ${body?.message || ''}`)
          } as any
        );
        await optic.executeOpticallE2ETest(
          // @ts-ignore
          { method: 'POST' },
          {
            status: (code: number) => ({ json: (body: any) => logger.info(`Opticall cron result [${code}]: ${body?.message || ''}`) }),
            json: (body: any) => logger.info(`Opticall cron result: ${body?.message || ''}`)
          } as any
        );
      } catch (e: any) {
        logger.error(`Cron run failed: ${e?.message || e}`);
      }
    }, { timezone: tz });
    logger.info(`🗓️ Daily cron enabled: '${cronExpr}' (TZ=${tz})`);
  } else {
    logger.info('🗓️ Daily cron disabled');
  }
});

export default app; 