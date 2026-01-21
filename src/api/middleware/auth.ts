import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { serverConfig } from '../../config/integrations';
import { logger } from '../../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication token required',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, serverConfig.jwtSecret) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'user',
    };
    next();
  } catch (error: any) {
    logger.warn('Invalid token', { error: error.message, ip: req.ip });
    res.status(403).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};

/**
 * Middleware pour vérifier les webhooks (signature au lieu de JWT)
 */
export const verifyWebhookSecret = (secret: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const providedSecret = req.headers['x-webhook-secret'] || req.query.secret;

    if (!providedSecret || providedSecret !== secret) {
      logger.warn('Invalid webhook secret', { ip: req.ip });
      res.status(401).json({
        success: false,
        error: 'Invalid webhook secret',
      });
      return;
    }

    next();
  };
};
