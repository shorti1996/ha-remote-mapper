#!/usr/bin/env sh
# Build the HACS release asset: the integration directory with runtime files
# only. Single source of truth for the exclusion list — release.yml calls
# this, and tests/test_packaging.py checks the result against the tracked
# Python modules so a required module can never be zipped away again
# (0.1.1 shipped without frontend/__init__.py and did not load).
#
# Usage: scripts/package.sh [output.zip]   (default: remote_mapper.zip in cwd)
set -eu
out="${1:-remote_mapper.zip}"
case "$out" in /*) ;; *) out="$(pwd)/$out" ;; esac
root="$(cd "$(dirname "$0")/.." && pwd)"
rm -f "$out"
cd "$root/custom_components/remote_mapper"
zip -qr "$out" . \
  -x "frontend/*" \
  -x "__pycache__/*" -x "*/__pycache__/*" -x "*.pyc" \
  -x ".*" -x "*/.*"
echo "$out"
