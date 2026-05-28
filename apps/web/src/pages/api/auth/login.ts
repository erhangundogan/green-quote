import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { LoginSchema } from '@greenquote/shared';
import { db } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import { logger } from '@/lib/logger';
import type { AuthUser, UserRole } from '@greenquote/shared';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return void res.status(405).json({ error: 'Method not allowed' });
  }

  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return void res.status(422).json({ error: parsed.error.flatten().fieldErrors });
  }

  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return void res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    logger.warn({ email }, 'Failed login attempt');
    return void res.status(401).json({ error: 'Invalid email or password' });
  }

  const authUser: AuthUser = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role as UserRole,
  };
  const token = await signToken(authUser);
  setAuthCookie(res, token);

  logger.info({ userId: user.id }, 'User logged in');
  return void res.status(200).json({ data: authUser });
}
