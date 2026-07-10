#!/usr/bin/env bash

set -euo pipefail

docker_path="/Applications/Docker.app/Contents/Resources/bin"
export PATH="$docker_path:$PATH"

restore_current_database() {
  exit_code=$?
  trap - EXIT
  npx supabase db reset --local >/dev/null
  exit "$exit_code"
}
trap restore_current_database EXIT

npx supabase db reset --local --version 20260710073639
docker exec -i supabase_db_life-os psql -v ON_ERROR_STOP=1 -U postgres -d postgres \
  < supabase/tests/migration/v02_snapshot.sql
npx supabase migration up --local
npx supabase test db --local supabase/tests/migration/v03_snapshot_assertions.test.sql
