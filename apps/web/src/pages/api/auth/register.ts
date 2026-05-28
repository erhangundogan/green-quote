import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { RegisterSchema } from '@greenquote/shared';
import { db } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import { logger } from '@/lib/logger';
import type { AuthUser } from '@greenquote/shared';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return void res.status(405).json({ error: 'Method not allowed' });
  }

  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return void res.status(422).json({ error: parsed.error.flatten().fieldErrors });
  }

  const { fullName, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return void res.status(409).json({ error: 'Email already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: { fullName, email, password: hashedPassword, role: 'USER' },
  });

  const authUser: AuthUser = { id: user.id, fullName: user.fullName, email: user.email, role: 'USER' };
  const token = await signToken(authUser);
  setAuthCookie(res, token);

  logger.info({ userId: user.id, email: user.email }, 'User registered');
  return void res.status(201).json({ data: authUser });
}
