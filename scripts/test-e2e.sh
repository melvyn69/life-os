#!/usr/bin/env bash

set -euo pipefail

if [[ -d "/Applications/Docker.app/Contents/Resources/bin" ]]; then
  export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
fi

supabase_cli=(npx --yes supabase@2.109.1)

eval "$("${supabase_cli[@]}" status -o env 2>/dev/null)"
export API_URL ANON_KEY SERVICE_ROLE_KEY

./node_modules/.bin/playwright test
