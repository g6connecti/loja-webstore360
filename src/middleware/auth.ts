import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { adminAuth } from '../lib/firebase-admin.ts';
import type { DecodedIdToken } from 'firebase-admin/auth';

export const AUTHORIZED_ADMIN_EMAIL = 'lagarelli@gmail.com';
export const AUTHORIZED_ADMIN_PASSWORD = 'Lr@@200862##';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'webstore360-jwt-secret-secure-key-2026';

export interface AdminPayload {
  uid: string;
  email: string;
  name: string;
  role: 'admin';
  exp: number;
}

export function signAdminToken(email: string, name: string = 'Luiz Ricardo Agarelli'): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload: AdminPayload = {
    uid: 'admin-lagarelli',
    email: email.toLowerCase(),
    name,
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30), // 30 days
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

export function verifyCustomAdminToken(token: string): AdminPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (signature !== expectedSig) return null;

    const payload: AdminPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    if (payload.email?.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export interface AuthRequest extends Request {
  user?: DecodedIdToken | AdminPayload;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing authorization token' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token || token === 'null' || token === 'undefined' || token.split('.').length !== 3) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
  }

  // 1. First check if it's our signed Admin Token
  const customAdmin = verifyCustomAdminToken(token);
  if (customAdmin) {
    req.user = customAdmin;
    return next();
  }

  // 2. Otherwise verify with Firebase Auth
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (decodedToken.email?.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({
        error: `Acesso negado: Apenas o usuário ${AUTHORIZED_ADMIN_EMAIL} possui permissão de administrador.`,
      });
    }
    req.user = decodedToken;
    return next();
  } catch (error: any) {
    if (error?.code !== 'auth/argument-error' && error?.code !== 'auth/id-token-expired') {
      console.error('Error verifying Firebase ID token:', error);
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
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
      const customAdmin = verifyCustomAdminToken(token);
      if (customAdmin) {
        req.user = customAdmin;
        return next();
      }

      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        if (decodedToken.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
          req.user = decodedToken;
        }
      } catch {
        // Continue unauthenticated
      }
    }
  }
  next();
};
