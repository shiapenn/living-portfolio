#!/usr/bin/env bash
# Clean Initial Commit Export & Verification Script (OSR-05 §3.1)
# Exports the working tree into a fresh empty directory without .git, node_modules,
# build output, .env* (except .env.example), IDE state, or local scratch files,
# runs hygiene scans, initializes a clean git repository on branch `main`,
# creates the signed-off initial commit, and tags `baseline-B0`.

set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXPORT_DIR="${1:-}"

if [[ -z "${EXPORT_DIR}" ]]; then
  echo "Usage: scripts/clean-export.sh <target-empty-directory>"
  exit 1
fi

if [[ -e "${EXPORT_DIR}" ]] && [[ -n "$(ls -A "${EXPORT_DIR}" 2>/dev/null || true)" ]]; then
  echo "Error: Target directory '${EXPORT_DIR}' already exists and is not empty."
  exit 1
fi

mkdir -p "${EXPORT_DIR}"

rsync -a \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.turbo' \
  --exclude='coverage' \
  --exclude='.DS_Store' \
  --exclude='.env' \
  --exclude='.env.*' \
  --include='.env.example' \
  --exclude='.vscode' \
  --exclude='.idea' \
  --exclude='.gemini' \
  "${SRC_DIR}/" "${EXPORT_DIR}/"

echo "✓ Exported clean working tree to ${EXPORT_DIR}"
node "${SRC_DIR}/scripts/hardcode-check"
echo "✓ Hard-code and path scan passed."

(
  cd "${EXPORT_DIR}"
  git init -b main
  git config core.hooksPath .githooks
  git add -A
  git commit -s -m "chore: initial clean open-source baseline (baseline-B0)"
  git tag -a baseline-B0 -m "Clean open-source baseline B0 (OSR-05)"
  echo "✓ Initialized clean repository on branch 'main' and tagged 'baseline-B0'."
)
