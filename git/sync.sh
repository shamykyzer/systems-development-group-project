#!/bin/bash
# Sync gitignore files from git/ to their target locations.
# Run from repo root.
cd "$(dirname "$0")/.."
cp git/root.gitignore .gitignore
cp git/frontend.gitignore frontend/.gitignore
echo "Synced .gitignore files from git/"
