#!/usr/bin/env bash
# Deploy the latest hostinger-build artifact to psova.org.pk. See docs/DEPLOY-HOSTINGER-MANUAL.md.
# Usage: scripts/hostinger-deploy.sh [--with-modules] [run-id]   (default: latest successful run)
#        --with-modules also replaces the server runtime packages (next, react, sharp, ...) from the build;
#        use it only after a dependency change. @prisma/.prisma stay as generated on the server.
#        scripts/hostinger-deploy.sh rollback     (restore the most recent backup)
set -euo pipefail
REPO=jerryboganda/psova
KEY="${HOSTINGER_KEY:-$HOME/.ssh/hostinger_dmb_ed25519}"
SSH_OPTS=(-i "$KEY" -o BatchMode=yes -o IdentitiesOnly=yes)
HOST=u776151780@145.79.25.8
APP='~/domains/psova.org.pk/nodejs'   # only ever touch this folder: the account also hosts other sites
rssh() { ssh "${SSH_OPTS[@]}" -p 65002 "$HOST" "$@"; }

MODULES=0; if [ "${1:-}" = --with-modules ]; then MODULES=1; shift; fi
if [ "${1:-}" = rollback ]; then
  # node_modules is restored too when that backup was taken with --with-modules
  rssh "set -e; cd $APP; B=\$(ls -d ~/backups/psova-* | tail -1); echo restoring \$B; rm -rf .next; cp -a \$B/.next .next; cp -a \$B/public/. public/; if [ -d \$B/node_modules ]; then rm -rf node_modules; cp -a \$B/node_modules node_modules; echo restored node_modules; fi; if [ -f \$B/server.js ]; then cp -a \$B/server.js server.js; echo restored server.js; fi; touch tmp/restart.txt"
  exit 0
fi

RUN="${1:-$(gh run list --repo $REPO --workflow hostinger-build --status success --limit 1 --json databaseId -q '.[0].databaseId')}"
[ -n "$RUN" ] || { echo "no successful hostinger-build run; start one: gh workflow run hostinger-build --repo $REPO --ref main"; exit 1; }
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
gh run download "$RUN" --repo $REPO -n hostinger-build -D "$TMP"
STAMP=$(date +%Y%m%d-%H%M%S)
scp "${SSH_OPTS[@]}" -P 65002 "$TMP/hostinger-build.tgz" "$HOST:~/hostinger-build-$STAMP.tgz"
if [ "$MODULES" = 1 ]; then scp "${SSH_OPTS[@]}" -P 65002 "$TMP/hostinger-node_modules.tgz" "$HOST:~/hostinger-nm-$STAMP.tgz"; fi
# Extract on the server: the tarball holds a symlink Windows can't create.
rssh "set -e; cd $APP; B=~/backups/psova-$STAMP; mkdir -p \$B/new
  cp -a .next public \$B/                      # backup of what is live now
  tar -xzf ~/hostinger-build-$STAMP.tgz -C \$B/new
  rm -rf .next && cp -a \$B/new/.next .next && cp -a \$B/new/public/. public/
  if [ $MODULES = 1 ]; then
    cp -a node_modules \$B/node_modules              # backup of the current runtime packages
    mkdir -p \$B/nm && tar -xzf ~/hostinger-nm-$STAMP.tgz -C \$B/nm
    for d in next @next @emnapi react react-dom styled-jsx @swc sharp @img semver detect-libc client-only; do
      if [ -e \$B/nm/node_modules/\$d ]; then rm -rf node_modules/\$d; cp -a \$B/nm/node_modules/\$d node_modules/\$d; fi
    done
    # Hostinger's server.js embeds the Next config for the installed Next version: take the new one from the build, keep the rest.
    cp -a server.js \$B/server.js
    awk 'NR==FNR{ if (\$0 ~ /^const nextConfig = /) n=\$0; next } /^const nextConfig = /{ print n; next } { print }' \$B/nm/server.js server.js > server.js.new && mv server.js.new server.js
    rm -rf \$B/nm ~/hostinger-nm-$STAMP.tgz
  fi
  rm -rf \$B/new ~/hostinger-build-$STAMP.tgz
  touch tmp/restart.txt                          # Passenger restart"
echo "deployed run $RUN; backup ~/backups/psova-$STAMP"
for i in 1 2 3 4 5 6; do c=$(curl -s -o /dev/null -w '%{http_code}' -m 30 https://psova.org.pk/en); echo "check $i: $c"; [ "$c" = 200 ] && exit 0; sleep 10; done
echo "site not healthy -> run: $0 rollback"; exit 1
