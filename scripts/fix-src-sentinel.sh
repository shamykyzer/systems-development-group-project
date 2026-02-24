#!/usr/bin/env bash
# Removes stray src/ directory and creates a sentinel file to prevent it from being recreated.
# Run once: ./scripts/fix-src-sentinel.sh  (use sudo if src/ is root-owned)
set -euo pipefail
cd "$(dirname "$0")/.."
echo "Removing src/ if it exists..."
if ! rm -rf src 2>/dev/null; then
  echo "Permission denied. Run with sudo: sudo ./scripts/fix-src-sentinel.sh"
  exit 1
fi
echo "Creating sentinel file 'src' to block directory creation..."
printf '%s\n' "Sentinel: prevents src/ directory from being created. Backend lives at backend/." > src
echo "Done. The file 'src' will block any process from creating src/."
