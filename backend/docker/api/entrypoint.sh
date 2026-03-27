#!/bin/sh
set -eu

# Safety: require explicit confirmation to run destructive DB reset.
# If DB_RESET is true but CONFIRM_DB_RESET != YES, we will skip the reset.
if [ "${DB_RESET:-false}" = "true" ]; then
  if [ "${CONFIRM_DB_RESET:-}" != "YES" ]; then
    echo "[entrypoint] DB_RESET=true but CONFIRM_DB_RESET!=YES -> NOT performing reset"
    echo "[entrypoint] To perform a reset, set CONFIRM_DB_RESET=YES on the server and run the reset command manually."
  else
    echo "[entrypoint] DB_RESET=true and CONFIRM_DB_RESET=YES -> performing reset (drop + migrations + seed)"
    npm run db:reset:runtime
  fi
else
  echo "[entrypoint] DB_RESET=false -> skipping database reset"
fi

exec "$@"
