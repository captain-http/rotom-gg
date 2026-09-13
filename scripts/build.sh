#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Vercel's build command. Migrating first means a failed migration fails the
# deploy instead of shipping code against a schema it doesn't match. Locally,
# bin/setup owns migrations.
if [ "${VERCEL:-}" = "1" ]; then
  echo "==> migrations"
  pnpm exec drizzle-kit migrate
fi

echo "==> next build"
pnpm exec next build
