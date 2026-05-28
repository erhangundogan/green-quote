import { SignJWT, jwtVerify } from 'jose';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { AuthUser } from '@greenquote/shared';
import { db } from './db';
import { logger } from './logger';

const JWT_SECRET = new TextEncoder().encode(
  process.env['JWT_SECRET'] ?? 'fallback-dev-secret-change-in-prod',
);
const JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'] ?? '7d';

const COOKIE_NAME = 'gq_token';

export async function signToken(payload: AuthUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthCookie(res: NextApiResponse, token: string): void {
  const maxAge = 60 * 60 * 24 * 7; // 7 days in seconds
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Strict${
      process.env['NODE_ENV'] === 'production' ? '; Secure' : ''
    }`,
  );
}

export function clearAuthCookie(res: NextApiResponse): void {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`,
  );
}

export function getTokenFromRequest(req: NextApiRequest): string | null {
  const cookieHeader = req.headers.cookie ?? '';
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  return match ? (match.split('=')[1] ?? null) : null;
}

export type AuthenticatedRequest = NextApiRequest & { user: AuthUser };

type AuthHandler = (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void;
type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

export function withAuth(handler: AuthHandler, requireAdmin = false): Handler {
  return async (req, res) => {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Ensure the user referenced by the JWT still exists in the DB.
    // This catches stale tokens after a DB reset / user deletion without
    // requiring every route to do its own existence check.
    const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { id: true } });
    if (!dbUser) {
      clearAuthCookie(res);
      return res.status(401).json({ error: 'Session expired' });
    }

    if (requireAdmin && user.role !== 'ADMIN') {
      logger.warn({ userId: user.id, path: req.url }, 'Forbidden: admin required');
      return res.status(403).json({ error: 'Forbidden' });
    }

    (req as AuthenticatedRequest).user = user;
    return handler(req as AuthenticatedRequest, res);
  };
}
