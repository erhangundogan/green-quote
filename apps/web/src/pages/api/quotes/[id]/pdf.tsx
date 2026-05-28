import type { NextApiResponse } from 'next';
import { renderToBuffer } from '@react-pdf/renderer';
import { db } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { QuotePdf } from '@/lib/quote-pdf';
import type { QuoteOffer, RiskBand } from '@greenquote/shared';

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return void res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (typeof id !== 'string') {
    return void res.status(400).json({ error: 'Invalid quote ID' });
  }

  const quote = await db.quote.findUnique({ where: { id } });

  if (!quote) {
    return void res.status(404).json({ error: 'Quote not found' });
  }

  const isAdmin = req.user.role === 'ADMIN';
  const isOwner = quote.userId === req.user.id;
  if (!isAdmin && !isOwner) {
    logger.warn({ requesterId: req.user.id, quoteId: id }, 'Unauthorized PDF access attempt');
    return void res.status(403).json({ error: 'Forbidden' });
  }

  const quoteRow = {
    ...quote,
    offers: JSON.parse(quote.offers) as QuoteOffer[],
    riskBand: quote.riskBand as RiskBand,
    createdAt: quote.createdAt.toISOString(),
  };

  // Use JSX (this is a .tsx file) so TypeScript infers the correct
  // ReactElement<DocumentProps> type — avoids the exactOptionalPropertyTypes
  // mismatch that occurs with React.createElement.
  const buffer = await renderToBuffer(<QuotePdf quote={quoteRow} />);

  logger.info({ quoteId: id, requesterId: req.user.id }, 'Quote PDF generated');

  const filename = `greenquote-${id.slice(0, 8)}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);
  return void res.status(200).send(buffer);
}

export default withAuth(handler);
