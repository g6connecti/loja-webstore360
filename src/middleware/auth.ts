import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token || token === 'null' || token === 'undefined' || token.split('.').length !== 3) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error: any) {
    if (error?.code !== 'auth/argument-error' && error?.code !== 'auth/id-token-expired') {
      console.error('Error verifying Firebase ID token:', error);
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1]?.trim();
    if (token && token !== 'null' && token !== 'undefined' && token.split('.').length === 3) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        req.user = decodedToken;
      } catch {
        // Continue unauthenticated if token invalid or expired
      }
    }
  }
  next();
};
