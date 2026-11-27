#!/bin/sh
set -eu
if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo 'Usage: rollback-production.sh MANIFEST [--dry-run]' >&2
  exit 2
fi
manifest=$1
mode=${2:---execute}
case "$mode" in --execute|--dry-run) ;; *) echo 'Invalid mode' >&2; exit 2;; esac
exec node "$(dirname "$0")/rollback-production.mjs" "$manifest" "$mode"
