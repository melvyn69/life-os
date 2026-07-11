#!/usr/bin/env bash

set -euo pipefail

if [[ -d "/Applications/Docker.app/Contents/Resources/bin" ]]; then
  export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
fi

supabase_cli=(npx --yes supabase@2.109.1)

eval "$("${supabase_cli[@]}" status -o env 2>/dev/null)"
export VITE_SUPABASE_URL="$API_URL"
export VITE_SUPABASE_ANON_KEY="$ANON_KEY"

npm run dev -- --host 127.0.0.1 --port 4173
