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

if [ "${1:-}" = rollback ]; then
  rssh "set -e; cd $APP; B=\$(ls -d ~/backups/psova-* | tail -1); echo restoring \$B; rm -rf .next; cp -a \$B/.next .next; cp -a \$B/public/. public/; touch tmp/restart.txt"
  exit 0
fi

RUN="${1:-$(gh run list --repo $REPO --workflow hostinger-build --status success --limit 1 --json databaseId -q '.[0].databaseId')}"
[ -n "$RUN" ] || { echo "no successful hostinger-build run; start one: gh workflow run hostinger-build --repo $REPO --ref main"; exit 1; }
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
gh run download "$RUN" --repo $REPO -n hostinger-build -D "$TMP"
STAMP=$(date +%Y%m%d-%H%M%S)
scp "${SSH_OPTS[@]}" -P 65002 "$TMP/hostinger-build.tgz" "$HOST:~/hostinger-build-$STAMP.tgz"
[ "$MODULES" = 1 ] && scp "${SSH_OPTS[@]}" -P 65002 "$TMP/hostinger-node_modules.tgz" "$HOST:~/hostinger-nm-$STAMP.tgz"
# Extract on the server: the tarball holds a symlink Windows can't create.
rssh "set -e; cd $APP; B=~/backups/psova-$STAMP; mkdir -p \$B/new
  cp -a .next public \$B/                      # backup of what is live now
  tar -xzf ~/hostinger-build-$STAMP.tgz -C \$B/new
  rm -rf .next && cp -a \$B/new/.next .next && cp -a \$B/new/public/. public/
  rm -rf \$B/new ~/hostinger-build-$STAMP.tgz
  touch tmp/restart.txt                          # Passenger restart"
echo "deployed run $RUN; backup ~/backups/psova-$STAMP"
for i in 1 2 3 4 5 6; do c=$(curl -s -o /dev/null -w '%{http_code}' -m 30 https://psova.org.pk/en); echo "check $i: $c"; [ "$c" = 200 ] && exit 0; sleep 10; done
echo "site not healthy -> run: $0 rollback"; exit 1
