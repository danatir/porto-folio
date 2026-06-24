#!/bin/bash
cd "$(dirname "$0")"
git add .
git commit -m "Update site $(date '+%Y-%m-%d %H:%M')" 2>/dev/null || echo "Nothing new to commit."
git push origin main
echo "Done! Site updated on GitHub."
