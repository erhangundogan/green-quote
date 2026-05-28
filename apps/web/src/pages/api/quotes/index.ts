import type { NextApiResponse } from 'next';
import { QuoteInputSchema } from '@greenquote/shared';
import { db } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth';
import { computePricing } from '@/lib/pricing';
import { logger } from '@/lib/logger';

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  if (req.method === 'POST') {
    return handleCreate(req, res);
  }
  if (req.method === 'GET') {
    return handleList(req, res);
  }
  res.setHeader('Allow', 'GET, POST');
  res.status(405).json({ error: 'Method not allowed' });
}

async function handleCreate(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  const parsed = QuoteInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return void res.status(422).json({ error: parsed.error.flatten().fieldErrors });
  }

  const { fullName, email, address, monthlyConsumptionKwh, systemSizeKw, downPayment } =
    parsed.data;

  const pricing = computePricing(systemSizeKw, monthlyConsumptionKwh, downPayment ?? 0);

  const quote = await db.quote.create({
    data: {
      userId: req.user.id,
      fullName,
      email,
      address,
      monthlyConsumptionKwh,
      systemSizeKw,
      downPayment: downPayment ?? 0,
      systemPrice: pricing.systemPrice,
      principalAmount: pricing.principalAmount,
      riskBand: pricing.riskBand,
      offers: JSON.stringify(pricing.offers),
    },
  });

  logger.info({ quoteId: quote.id, userId: req.user.id, riskBand: pricing.riskBand }, 'Quote created');

  return void res.status(201).json({
    data: { ...quote, offers: pricing.offers },
  });
}

async function handleList(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  const isAdmin = req.user.role === 'ADMIN';

  // ?all=true is admin-only — returns every quote with optional ?search= filter.
  // Without it every caller (including admins) sees only their own quotes.
  const wantsAll = req.query['all'] === 'true';
  const searchStr = typeof req.query['search'] === 'string' ? req.query['search'] : undefined;

  if (wantsAll && !isAdmin) {
    return void res.status(403).json({ error: 'Forbidden' });
  }

  const where = wantsAll
    ? searchStr
      ? { OR: [{ fullName: { contains: searchStr } }, { email: { contains: searchStr } }] }
      : {}
    : { userId: req.user.id };

  const quotes = await db.quote.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { fullName: true, email: true } } },
  });

  const serialized = quotes.map((q) => ({
    ...q,
    offers: JSON.parse(q.offers) as unknown,
  }));

  logger.info({ userId: req.user.id, count: quotes.length, wantsAll }, 'Quotes listed');
  return void res.status(200).json({ data: serialized });
}

export default withAuth(handler);
