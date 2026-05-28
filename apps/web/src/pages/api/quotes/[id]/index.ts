import type { NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return void res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (typeof id !== 'string') {
    return void res.status(400).json({ error: 'Invalid quote ID' });
  }

  const quote = await db.quote.findUnique({
    where: { id },
    include: { user: { select: { fullName: true, email: true } } },
  });

  if (!quote) {
    return void res.status(404).json({ error: 'Quote not found' });
  }

  const isAdmin = req.user.role === 'ADMIN';
  const isOwner = quote.userId === req.user.id;
  if (!isAdmin && !isOwner) {
    logger.warn({ requesterId: req.user.id, quoteId: id }, 'Unauthorized quote access attempt');
    return void res.status(403).json({ error: 'Forbidden' });
  }

  logger.info({ quoteId: id, requesterId: req.user.id }, 'Quote fetched');
  return void res.status(200).json({
    data: { ...quote, offers: JSON.parse(quote.offers) as unknown },
  });
}

export default withAuth(handler);
