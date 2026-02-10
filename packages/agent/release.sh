#!/usr/bin/env bash
set -euo pipefail

# Release script for @philschmid/agent
# Usage: ./release.sh <version>  (e.g. ./release.sh 0.1.0)
#        ./release.sh --dry-run <version>
#
# NOTE: Release @philschmid/agents-core first if its version changed,
#       since this package depends on it.

PKG_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$PKG_DIR/../.." && pwd)"
CORE_PKG_DIR="$ROOT_DIR/packages/agents-core"
PKG_NAME="@philschmid/agent"

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

# Read agents-core version for the dependency pin
CORE_VERSION=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$CORE_PKG_DIR/package.json','utf8')).version)")

echo "==> Releasing $PKG_NAME@$VERSION"
echo "    agents-core dependency: ^$CORE_VERSION"
[[ "$DRY_RUN" == true ]] && echo "    (dry-run mode — nothing will be published)"

# 1. Run lint + tests from root
echo "==> Running lint & tests..."
cd "$ROOT_DIR"
bun test

# 2. Update version and swap workspace:* -> ^version
echo "==> Bumping version to $VERSION and pinning agents-core to ^$CORE_VERSION..."
cd "$PKG_DIR"
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.version = '$VERSION';
  pkg.dependencies['@philschmid/agents-core'] = '^$CORE_VERSION';
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

# 5. Restore workspace:* for local development
echo "==> Restoring workspace:* dependency..."
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.dependencies['@philschmid/agents-core'] = 'workspace:*';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo "==> Done!"
