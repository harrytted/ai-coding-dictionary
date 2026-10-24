#!/usr/bin/env bash
# Build a pinned source revision into a new release; this does not activate it.
set -euo pipefail
revision=${1:?Usage: build-release.sh GIT_REVISION}
[[ "$revision" =~ ^[a-f0-9]{7,40}$ ]] || { echo 'Use a hexadecimal commit ID.' >&2; exit 1; }
release_root=/var/www/ai-coding-dictionary
release_id="$revision-$(date +%Y%m%d%H%M%S)"
work_dir=$(mktemp -d /tmp/dictionary-build.XXXXXX)
mkdir -p "$release_root/releases/$release_id"
curl --fail --location --retry 2 --connect-timeout 15 --max-time 120 \
  "https://github.com/harrytted/ai-coding-dictionary/archive/$revision.tar.gz" -o "$work_dir/source.tar.gz"
tar -xzf "$work_dir/source.tar.gz" -C "$work_dir"
cd "$work_dir"/ai-coding-dictionary-*
npm ci --registry=https://registry.npmjs.org --cache "$work_dir/npm-cache" --no-audit --no-fund
npm run build -- --base=/dictionary/
cp -a dist/. "$release_root/releases/$release_id/"
printf '%s\n' "$release_id" > "$release_root/pending-release"
printf 'BUILD_READY %s\n' "$release_root/releases/$release_id"
