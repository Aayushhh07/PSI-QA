import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = process.env.LOG_FILE_PATH || './logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'testing-app' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // File transport for error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // File transport for test execution logs
    new winston.transports.File({
      filename: path.join(logsDir, 'test-executions.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  ]
});

// Create a separate logger for test executions
export const testLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'test-execution' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'test-executions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  ]
});

export default logger; 