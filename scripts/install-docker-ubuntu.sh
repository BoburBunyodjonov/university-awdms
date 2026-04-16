#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Please run as root: sudo bash scripts/install-docker-ubuntu.sh"
  exit 1
fi

echo "==> Installing Docker on Ubuntu..."
apt update
apt install -y ca-certificates curl gnupg
curl -fsSL https://get.docker.com | sh

echo "==> Docker version:"
docker --version
echo "==> Docker Compose version:"
docker compose version

echo "==> Done."
