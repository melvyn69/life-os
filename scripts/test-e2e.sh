#!/usr/bin/env bash

set -euo pipefail

supabase_path="/usr/local/opt/node@20/bin:/Applications/Docker.app/Contents/Resources/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
eval "$(PATH="$supabase_path" npx supabase status -o env 2>/dev/null)"
export API_URL ANON_KEY SERVICE_ROLE_KEY

node_path="/Users/melvyn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"
PATH="$node_path:$PATH" ./node_modules/.bin/playwright test
