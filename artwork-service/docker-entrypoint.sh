#!/bin/sh
set -eu
# Railway mounts persistent volumes at runtime, after the image is built.
mkdir -p "${ARTWORK_DATA_DIR:-/data}"
chown node:node "${ARTWORK_DATA_DIR:-/data}"
exec gosu node "$@"
