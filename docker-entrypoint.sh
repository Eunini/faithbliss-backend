#!/bin/sh
set -e

echo "[entrypoint] Running Prisma migrations (non-fatal)..."
if npx prisma migrate deploy; then
  echo "[entrypoint] Prisma migrations applied"
else
  echo "[entrypoint] Prisma migrate failed but continuing startup"
fi

echo "[entrypoint] Starting app"
exec node dist/main.js
