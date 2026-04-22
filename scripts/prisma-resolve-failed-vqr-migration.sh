#!/usr/bin/env bash
# One-time, on the PRODUCTION server, after: git pull && docker compose build
#
# Clears P3009 for the old single-file VQR migration, then the next
#   docker compose up
# will apply: fixed 20260422150000 (enums only) + 20260423120000 (data).
#
# Usage (from /opt/awdms):
#   docker compose -f docker-compose.prod.yml run --rm -w /app/apps/backend backend \
#     npx prisma migrate resolve --rolled-back 20260422150000_vqr_full_time_and_part_time
#   docker compose -f docker-compose.prod.yml up -d
#
# Or run the two lines below:
set -euo pipefail
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
docker compose -f "$COMPOSE_FILE" run --rm -w /app/apps/backend backend \
  npx prisma migrate resolve --rolled-back 20260422150000_vqr_full_time_and_part_time
echo "==> Now run: docker compose -f $COMPOSE_FILE up -d (restarts backend; migrate deploy will run)"
