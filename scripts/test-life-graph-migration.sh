#!/usr/bin/env bash

set -euo pipefail

docker_path="/Applications/Docker.app/Contents/Resources/bin"
export PATH="$docker_path:$PATH"

supabase_cli=(npx --yes supabase@2.109.1)

restore_current_database() {
  exit_code=$?
  trap - EXIT
  "${supabase_cli[@]}" db reset --local >/dev/null
  exit "$exit_code"
}
trap restore_current_database EXIT

"${supabase_cli[@]}" db reset --local --version 20260710073639
docker exec -i supabase_db_life-os psql -v ON_ERROR_STOP=1 -U postgres -d postgres \
  < supabase/tests/migration/v02_snapshot.sql
"${supabase_cli[@]}" migration up --local
"${supabase_cli[@]}" test db --local supabase/tests/migration/v03_snapshot_assertions.test.sql
