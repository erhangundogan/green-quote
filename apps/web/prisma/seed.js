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
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log('Seed skipped: database already has users.');
    return;
  }

  const adminPassword = await bcrypt.hash('Admin1234!', BCRYPT_ROUNDS);
  const userPassword  = await bcrypt.hash('User1234!',  BCRYPT_ROUNDS);

  await prisma.user.createMany({
    data: [
      { fullName: 'Admin User', email: 'admin@test.com', password: adminPassword, role: 'ADMIN' },
      { fullName: 'Test User',  email: 'user@test.com',  password: userPassword,  role: 'USER'  },
    ],
  });

  console.log('Seed complete: admin@test.com + user@test.com');
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
