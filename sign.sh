#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${AMO_JWT_ISSUER:-}" || -z "${AMO_JWT_SECRET:-}" ]]; then
  echo "Error: AMO_JWT_ISSUER and AMO_JWT_SECRET must be set in the environment."
  echo
  echo "In fish, run once per session (or add to ~/.config/fish/conf.d/amo.fish):"
  echo '  set -gx AMO_JWT_ISSUER "user:..."'
  echo '  set -gx AMO_JWT_SECRET "..."'
  echo
  echo "Get your keys at: https://addons.mozilla.org/developers/addon/api/key/"
  exit 1
fi

~/.local/bin/web-ext sign \
  --source-dir    . \
  --artifacts-dir . \
  --api-key       "$AMO_JWT_ISSUER" \
  --api-secret    "$AMO_JWT_SECRET" \
  --channel       listed \
  --ignore-files  "web-ext-config.mjs" "sign.sh" "README.md" "CHANGELOG.md" \
                  ".gitignore" "icons/icon-dark.svg" "icons/icon-light.svg" \
                  "icons/icon-48.svg" "icons/icon-96.svg" \
                  "tab-cap-*.zip" "*.xpi"
