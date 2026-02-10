#!/usr/bin/env bash
set -euo pipefail

# Release script for @philschmid/agents-core
# Usage: ./release.sh <version>  (e.g. ./release.sh 0.1.0)
#        ./release.sh --dry-run <version>

PKG_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$PKG_DIR/../.." && pwd)"
PKG_NAME="@philschmid/agents-core"

DRY_RUN=false
VERSION=""

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    *) VERSION="$arg" ;;
  esac
done

if [[ -z "$VERSION" ]]; then
  echo "Usage: $0 [--dry-run] <version>"
  echo "Example: $0 0.1.0"
  exit 1
fi

# Validate semver format
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
  echo "Error: '$VERSION' is not a valid semver version"
  exit 1
fi

echo "==> Releasing $PKG_NAME@$VERSION"
[[ "$DRY_RUN" == true ]] && echo "    (dry-run mode — nothing will be published)"

# 1. Run lint + tests from root
echo "==> Running lint & tests..."
cd "$ROOT_DIR"
bun run lint
bun test

# 2. Update version in package.json
echo "==> Bumping version to $VERSION..."
cd "$PKG_DIR"
# Use node to update version in-place (preserves formatting)
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.version = '$VERSION';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# 3. Build
echo "==> Building..."
bun run build

# 4. Publish
if [[ "$DRY_RUN" == true ]]; then
  echo "==> Dry run — running npm pack instead of publish..."
  npm pack --dry-run
else
  echo "==> Publishing to npm..."
  npm publish --access public
  echo "==> Published $PKG_NAME@$VERSION"
fi

echo "==> Done!"
