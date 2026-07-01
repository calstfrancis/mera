#!/usr/bin/env bash
set -euo pipefail

# Reads AMO_JWT_ISSUER and AMO_JWT_SECRET from the environment.
# Set them in ~/.config/mera-amo-creds (sourced below) or export them yourself.

CREDS_FILE="$HOME/.config/mera-amo-creds"
if [[ -f "$CREDS_FILE" ]]; then
  # shellcheck source=/dev/null
  source "$CREDS_FILE"
fi

if [[ -z "${AMO_JWT_ISSUER:-}" || -z "${AMO_JWT_SECRET:-}" ]]; then
  echo "Error: AMO_JWT_ISSUER and AMO_JWT_SECRET must be set."
  echo "Put them in $CREDS_FILE or export them before running this script."
  echo
  echo "Get your keys at: https://addons.mozilla.org/developers/addon/api/key/"
  exit 1
fi

VERSION=$(node -p "require('./manifest.json').version")

~/.local/bin/web-ext sign \
  --api-key    "$AMO_JWT_ISSUER" \
  --api-secret "$AMO_JWT_SECRET" \
  --channel    listed \
  --config     web-ext-config.js

echo
echo "Signed. Look for tab_cap-${VERSION}.xpi in this directory."
