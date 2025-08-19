import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { testRoutes } from './routes/testRoutes';
import { websiteRoutes } from './routes/websiteRoutes';
import { reportRoutes } from './routes/reportRoutes';
import choiceAiRoutes from './routes/choiceAiRoutes';
import opticallRoutes from './routes/opticallRoutes';
import nyaayAiRoutes from './routes/nyaayAiRoutes';
import { connectToMongo } from './db/mongo';
import cron from 'node-cron';
import { ChoiceAiController } from './controllers/choiceAiController';
import { OpticallController } from './controllers/opticallController';
import { authMiddleware, createSession, destroySession } from './middleware/authMiddleware';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  credentials: true,
  origin: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Login endpoint (before auth middleware)
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Password is required' 
    });
  }
  
  if (password === process.env.ADMIN_PASSWORD) {
    const sessionId = createSession();
    res.cookie('sessionId', sessionId, { 
      httpOnly: true, 
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    return res.json({ 
      success: true, 
      message: 'Login successful' 
    });
  }
  
  return res.status(401).json({ 
    success: false, 
    error: 'Invalid password' 
  });
});

// Logout endpoint (before auth middleware)
app.post('/api/logout', (req, res) => {
  const sessionId = req.cookies?.sessionId;
  if (sessionId) {
    destroySession(sessionId);
    res.clearCookie('sessionId');
  }
  return res.json({ 
    success: true, 
    message: 'Logout successful' 
  });
});

// Apply auth middleware to all routes except login, logout and health
app.use(authMiddleware);

// Routes
app.use('/api/tests', testRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/choice-ai', choiceAiRoutes);
app.use('/api/opticall', opticallRoutes);
app.use('/api/nyaay-ai', nyaayAiRoutes);

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