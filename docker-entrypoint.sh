#!/bin/sh
set -e

echo "Running database migrations..."
node /app/node_modules/prisma/build/index.js migrate deploy \
  --schema /app/apps/web/prisma/schema.prisma

echo "Seeding database..."
node /app/apps/web/prisma/seed.js

echo "Starting server..."
exec node /app/apps/web/server.js
