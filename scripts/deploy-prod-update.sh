#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/awdms}"
GIT_REMOTE="${GIT_REMOTE:-origin}"
GIT_BRANCH="${GIT_BRANCH:-master}"

echo "==> AWDMS update + deploy starting..."
echo "    PROJECT_DIR: ${PROJECT_DIR}"
echo "    REMOTE/BRANCH: ${GIT_REMOTE}/${GIT_BRANCH}"

if [[ ! -d "${PROJECT_DIR}" ]]; then
  echo "ERROR: Project directory not found: ${PROJECT_DIR}"
  exit 1
fi

cd "${PROJECT_DIR}"

if [[ ! -d ".git" ]]; then
  echo "ERROR: ${PROJECT_DIR} is not a git repository."
  exit 1
fi

echo "==> Fetching latest git refs..."
git fetch "${GIT_REMOTE}"

echo "==> Pulling latest changes..."
git pull --ff-only "${GIT_REMOTE}" "${GIT_BRANCH}"

echo "==> Running production deploy..."
bash scripts/deploy-prod.sh
