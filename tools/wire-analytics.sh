#!/usr/bin/env bash
# Replace GA4 + Cloudflare Web Analytics placeholders in _includes/head-custom.html.
#
# Usage:
#   tools/wire-analytics.sh G-XXXXXXXXXX <cf-beacon-token>
#
# GA4 ID:  https://analytics.google.com → Admin → Data Streams → Web → Measurement ID
# CF token: https://dash.cloudflare.com/ac5a9971e6d58775db8f543db1489403/analytics/web
#           → Add site agentsfirst.dev → JS snippet mode → copy data-cf-beacon token

set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: $0 <GA4_ID> <CF_BEACON_TOKEN>" >&2
  echo "  GA4_ID format:    G-XXXXXXXXXX" >&2
  echo "  CF_TOKEN format:  hex string from CF dashboard" >&2
  exit 1
fi

GA="$1"
CF="$2"

if [[ ! "$GA" =~ ^G-[A-Z0-9]+$ ]]; then
  echo "GA4 ID must look like G-XXXXXXXXXX (got: $GA)" >&2
  exit 1
fi

REPO="$(cd "$(dirname "$0")/.." && pwd)"
FILE="$REPO/_includes/head-custom.html"

if ! grep -q "G-XXXXXXXXXX" "$FILE"; then
  echo "no GA placeholder in $FILE — already wired?" >&2
  exit 1
fi

sed -i '' "s/G-XXXXXXXXXX/$GA/g" "$FILE"
sed -i '' "s/TOKEN_HERE/$CF/" "$FILE"

echo "✅ wired: GA=$GA  CF=${CF:0:8}…"
echo "   diff:"
git -C "$REPO" diff --stat _includes/head-custom.html
echo
echo "next: git -C $REPO commit -am 'analytics: wire real GA4 + CF tokens' && git push"
