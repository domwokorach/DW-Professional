#!/usr/bin/env bash
# A local PostgreSQL for development (Homebrew's postgres), kept outside the repo, so `npm run dev` never needs the
# hosted/production database. Usage: scripts/dev-db.sh start | stop | status | url
# `start` creates the cluster and the dw_local database the first time. `next dev` finds it through
# .env.development.local (see docs/RESUME.md); build, start and the Prisma CLI keep using .env.
set -euo pipefail
DIR="${DW_DEV_DB_DIR:-$HOME/.local/share/dw-professional/pg}"
PORT="${DW_DEV_DB_PORT:-54330}"
SOCK="/tmp/dw-pg-sock"
URL="postgres://dw_dev@127.0.0.1:${PORT}/dw_local"

case "${1:-}" in
  start)
    mkdir -p "$SOCK"
    if [ ! -d "$DIR" ]; then
      mkdir -p "$(dirname "$DIR")"
      initdb -D "$DIR" -U dw_dev --auth=trust >/dev/null
    fi
    pg_ctl -D "$DIR" status >/dev/null 2>&1 || pg_ctl -D "$DIR" -o "-p $PORT -k $SOCK -c listen_addresses=127.0.0.1" -l "$DIR/server.log" -w start >/dev/null
    psql -h 127.0.0.1 -p "$PORT" -U dw_dev -d postgres -tAc "select 1 from pg_database where datname='dw_local'" | grep -q 1 \
      || psql -h 127.0.0.1 -p "$PORT" -U dw_dev -d postgres -qc "create database dw_local"
    echo "Local database running on 127.0.0.1:${PORT} (database dw_local)." ;;
  stop) pg_ctl -D "$DIR" stop ;;
  status) pg_ctl -D "$DIR" status ;;
  url) echo "$URL" ;;
  *) echo "Usage: $0 start|stop|status|url" >&2; exit 1 ;;
esac
