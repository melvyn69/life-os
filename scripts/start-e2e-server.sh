#!/usr/bin/env bash

set -euo pipefail

supabase_path="/usr/local/opt/node@20/bin:/Applications/Docker.app/Contents/Resources/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
eval "$(PATH="$supabase_path" npx supabase status -o env 2>/dev/null)"
export VITE_SUPABASE_URL="$API_URL"
export VITE_SUPABASE_ANON_KEY="$ANON_KEY"

node_path="/Users/melvyn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"
PATH="$node_path:$PATH" npm run dev -- --host 127.0.0.1 --port 4173
