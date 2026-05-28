import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  db: 'connected' | 'error';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>,
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).end();
    return;
  }

  let dbStatus: 'connected' | 'error' = 'error';
  try {
    await db.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err) {
    logger.error({ err }, 'Health check: DB connection failed');
  }

  const status = dbStatus === 'connected' ? 'ok' : 'degraded';
  res.status(status === 'ok' ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    db: dbStatus,
  });
}
