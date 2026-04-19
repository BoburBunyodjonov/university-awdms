#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/university-awdms}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-apps/backend/.env.production}"

echo "==> AWDMS production deploy starting..."
echo "    PROJECT_DIR: ${PROJECT_DIR}"

if [[ ! -d "${PROJECT_DIR}" ]]; then
  echo "ERROR: Project directory not found: ${PROJECT_DIR}"
  exit 1
fi

cd "${PROJECT_DIR}"

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "ERROR: Compose file not found: ${PROJECT_DIR}/${COMPOSE_FILE}"
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: ${ENV_FILE} is missing. Create it using variables from repo .env.example (Production section)."
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker is not installed."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: docker compose plugin is not available."
  exit 1
fi

echo "==> Validating compose config..."
docker compose -f "${COMPOSE_FILE}" config >/dev/null

echo "==> Building and starting containers..."
docker compose -f "${COMPOSE_FILE}" up -d --build --remove-orphans

echo "==> Current container status:"
docker compose -f "${COMPOSE_FILE}" ps

echo "==> Last backend logs (120 lines):"
docker compose -f "${COMPOSE_FILE}" logs --tail=120 backend || true

echo "==> Deploy finished."
echo "    Health check: curl -I http://localhost/api/docs"
