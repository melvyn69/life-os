#!/usr/bin/env bash

set -euo pipefail

if [[ -d "/Applications/Docker.app/Contents/Resources/bin" ]]; then
  export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
fi

supabase_cli=(npx --yes supabase@2.109.1)

eval "$("${supabase_cli[@]}" status -o env 2>/dev/null)"
export API_URL ANON_KEY SERVICE_ROLE_KEY JWT_SECRET

log_file="$(mktemp)"
"${supabase_cli[@]}" functions serve --env-file .env.local >"$log_file" 2>&1 &
serve_pid=$!

cleanup() {
  exit_code=$?
  trap - EXIT
  kill "$serve_pid" 2>/dev/null || true
  wait "$serve_pid" 2>/dev/null || true
  if [[ "$exit_code" -ne 0 ]]; then
    tail -n 80 "$log_file" >&2
  fi
  rm -f "$log_file"
  exit "$exit_code"
}
trap cleanup EXIT

for _ in {1..30}; do
  status_code="$(curl --silent --output /dev/null --write-out '%{http_code}' \
    "$API_URL/functions/v1/rebuild-relationship-candidates" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H 'Content-Type: application/json' \
    --data '{"cursor":null,"limit":1,"dry_run":true}')"
  if [[ "$status_code" == "200" ]]; then
    break
  fi
  sleep 0.5
done

node scripts/test-edge-functions.mjs
