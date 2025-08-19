import { Request, Response, NextFunction } from 'express';

// Simple in-memory store for authenticated sessions
const authenticatedSessions = new Set<string>();

// Generate a simple session ID
const generateSessionId = () => Math.random().toString(36).substring(2, 15);

// Extend Request interface to include sessionId
declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip auth for login, logout endpoints and health check
  if (req.path === '/api/login' || req.path === '/api/logout' || req.path === '/health') {
    return next();
  }

  // Check for session cookie
  const sessionId = req.cookies?.sessionId;
  
  if (sessionId && authenticatedSessions.has(sessionId)) {
    req.sessionId = sessionId;
    return next();
  }

  // Not authenticated
  return res.status(401).json({ 
    success: false, 
    error: 'Unauthorized. Please login first.' 
  });
};

export const createSession = () => {
  const sessionId = generateSessionId();
  authenticatedSessions.add(sessionId);
  return sessionId;
};

export const destroySession = (sessionId: string) => {
  authenticatedSessions.delete(sessionId);
};
