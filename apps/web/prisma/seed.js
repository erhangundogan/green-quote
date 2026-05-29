'use strict';
/**
 * Plain-CJS seed script — no TypeScript / ts-node required.
 * Used by the Docker entrypoint after `prisma migrate deploy`.
 * The TypeScript version (seed.ts) is still used for local dev via `prisma db seed`.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12; // must match rules.md: bcrypt cost factor ≥ 12

async function main() {
  const adminPassword = await bcrypt.hash('Admin1234!', BCRYPT_ROUNDS);
  const userPassword  = await bcrypt.hash('User1234!',  BCRYPT_ROUNDS);

  await prisma.user.upsert({
    where:  { email: 'admin@test.com' },
    update: {},
    create: { fullName: 'Admin User', email: 'admin@test.com', password: adminPassword, role: 'ADMIN' },
  });

  await prisma.user.upsert({
    where:  { email: 'user@test.com' },
    update: {},
    create: { fullName: 'Test User',  email: 'user@test.com',  password: userPassword,  role: 'USER'  },
  });

  console.log('Seed complete: admin@test.com + user@test.com');
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
