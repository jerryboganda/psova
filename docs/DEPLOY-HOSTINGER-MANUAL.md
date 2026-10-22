# Deploying psova.org.pk to Hostinger (the way it actually works)

Written 2026-10-22 after deploying the Vascular Anomalies Dilemma Workshop event.
**Read this before assuming "git push to main" deploys the site. It does not.**

## TL;DR — normal update (about 5 minutes)

```bash
git push origin main                                   # 1. code on main
gh workflow run hostinger-build --repo jerryboganda/psova --ref main   # 2. Linux build in CI (~1.5 min)
gh run watch --repo jerryboganda/psova                 # 3. wait for green
scripts/hostinger-deploy.sh                            # 4. backup, upload, swap, restart, health-check
scripts/hostinger-deploy.sh rollback                   # if anything looks wrong
```

Then check `https://psova.org.pk/en/<page>` and the `/ur/` version.

## How production is really set up

| Fact | Detail |
|---|---|
| Host | Hostinger Business shared hosting (DNS: Cloudflare, `psova.org.pk` A → `145.79.25.8`, proxied) |
| App | hPanel → Websites → psova.org.pk → Node.js web app, Next 16.2.9, Node 22.x |
| How it was created | **From uploaded build files, not from Git.** hPanel shows *Repository: —* and *Git provider is not connected* |
| Consequence | Pushing to GitHub `main` does nothing. "Connect Git provider" hangs on a spinner for this app (tried twice; the Hostinger GitHub App is installed on *all repositories*, so it is not a permissions problem). `Redeploy` is greyed out |
| What runs | `~/domains/psova.org.pk/nodejs/` holds a **prebuilt standalone output**: `.next/`, `public/`, `node_modules/`, Hostinger's generated `server.js` (embeds the Next config), `package.json`. No source code, no `.git` |
| Restart | Passenger: `touch ~/domains/psova.org.pk/nodejs/tmp/restart.txt` |
| Env vars | hPanel → app settings (not in the folder). Untouched by this process |
| Logs | `nodejs/console.log`, `nodejs/stderr.log`; hPanel → Runtime logs |
| SSH | `ssh -i ~/.ssh/hostinger_dmb_ed25519 -p 65002 u776151780@145.79.25.8` (key `codex-hostinger-dmb` is registered in hPanel → Advanced → SSH Access) |
| ⚠ Shared account | The same Hostinger account hosts **other sites** (`amaddiagnosticcentre.com.pk`, a marriage-bureau migration, etc.). Only ever touch `~/domains/psova.org.pk/nodejs/` |
| Not the VPS | `185.252.233.186` (SSH alias `vps`) is a different server. It only has a stale proxy entry for `psova.polytronx.com` that returns 502. Not production |

## Why a CI build instead of building locally

- Windows builds are not portable: Turbopack output and the hashed symlink
  `.next/node_modules/@prisma/client-<hash>` are Linux-shaped, and the tarball cannot even be extracted on Windows.
- The server is shared (≈500 GB RAM total but per-account limits); do not run `next build` there.
- So `.github/workflows/hostinger-build.yml` builds on `ubuntu-latest` with `DOCKER_BUILD=1`
  (makes `next.config.mjs` emit `output: 'standalone'`, same as Hostinger's pipeline) and uploads
  `hostinger-build.tgz` containing `.next/` (standalone server files + `static/`) and `public/`.
- The deploy replaces **only `.next/` and `public/`**. `node_modules/` and `server.js` stay as they are.

## Caveats (each one cost time — don't relearn them)

1. **Lockfile must be generated with npm 10** (`npx npm@10 install --package-lock-only`): a lockfile written by npm 11 only works on npm 11, and the CI runner / Hostinger use npm 10. Fixed 2026-10-22; if CI ever says *"Missing: … from lock file"* regenerate it this way.
2. **Dependencies must match the server's `node_modules`.** Deploy only swaps `.next/`+`public/`. If `package.json`
   dependencies change (new/updated package, Prisma version, Next version), `node_modules/` on the server is stale and
   the app can crash. In that case do a full upload (see "Dependency changes").
3. **Prisma client**: the server's `node_modules/@prisma/client` was generated on Hostinger. The build output references it via
   `.next/node_modules/@prisma/client-2c3a283f134fdcb6 → ../../../node_modules/@prisma/client`. The hash is stable while the
   Prisma version is; after verifying the new build, compare `ls .next/node_modules/@prisma` against the backup.
4. **Schema changes** need `prisma migrate deploy` against the Hostinger MariaDB separately (see
   `docs/registry/DEPLOYMENT-HOSTINGER.md` §2). The deploy script does not run migrations.
5. **Static pages are prebuilt.** Content changes (e.g. `packages/content/src/news.ts`) need a new build + deploy.
   Event "Upcoming → Past" switches in the browser by date, so it needs no redeploy.
6. **First request after restart can 404/slow** for ~10 s while Passenger boots; the script retries.
7. **hPanel will keep showing old commit `40d930d`** and "Git provider is not connected". That's expected.
8. **Mobile app branch** (`feature/psova-tauri-mobile`) is not on `main`/production. Event content exists in both:
   `data/news.ts` on main, `packages/content/src/news.ts` (plus regenerated `public/content-snapshot.json`
   and `apps/mobile/public/content-snapshot.json`) on the mobile branch. Keep them in sync when adding content.
9. `psova.polytronx.com` is dead (VPS proxy, 502). Everything, including the mobile app's API calls, uses `https://psova.org.pk`.
10. The local `node_modules/@psova/*` links pointed at the old `E:` drive; fixed with junctions to `D:\Projects\PSOVA`.
    If `tsc` says `Cannot find module '@psova/domain'` on the mobile branch, re-point them.
11. Turbopack refuses a `node_modules` junction pointing outside the project root; in a git worktree do a real `npm ci`.

## Mobile app as a web app

`hostinger-build` also builds `apps/mobile` with `VITE_BASE=/app/` and ships it in `public/app/`, so the deploy publishes it at
`https://psova.org.pk/app/index.html` (the path has a dot, so the locale proxy leaves it alone). The same app on phones
calls `https://psova.org.pk/api/v1/*`. Contact email and the key-value tables use the Hostinger SMTP mailbox and MariaDB.

## Manual steps (what the script does)

```bash
KEY=~/.ssh/hostinger_dmb_ed25519; H=u776151780@145.79.25.8
gh run download <run-id> --repo jerryboganda/psova -n hostinger-build -D /tmp/hb
scp -i $KEY -P 65002 /tmp/hb/hostinger-build.tgz $H:~/
ssh -i $KEY -p 65002 $H '
  cd ~/domains/psova.org.pk/nodejs && B=~/backups/psova-$(date +%Y%m%d-%H%M%S) && mkdir -p $B/new
  cp -a .next public $B/                     # backup
  tar -xzf ~/hostinger-build.tgz -C $B/new   # extract on Linux, not Windows
  rm -rf .next && cp -a $B/new/.next .next && cp -a $B/new/public/. public/
  touch tmp/restart.txt'
```

Rollback: `rm -rf .next; cp -a ~/backups/psova-<stamp>/.next .next; cp -a ~/backups/psova-<stamp>/public/. public/; touch tmp/restart.txt`
(or `scripts/hostinger-deploy.sh rollback`). Old backups live in `~/backups/psova-*` — prune occasionally (≈50 MB each).

## Dependency changes (full upload)

Only when `package.json`/lockfile changed. Easiest safe path: create a **new** Node.js web app in hPanel from the GitHub
repo (Websites → Add website → Node.js → Import Git repository, branch `main`, framework Next.js, Node 22), copy the env vars
from the old app, test on its temporary `*.hostingersite.com` URL, then move the domain. That also gives real
auto-deploy on push. Not done yet because it moves a live domain; do it deliberately, not mid-event.

## Health checklist after any deploy

```bash
for p in /en /ur /en/news /ur/news /en/registry /api/registry/stats /sitemap.xml; do
  echo "$p $(curl -s -o /dev/null -w '%{http_code}' https://psova.org.pk$p)"; done
ssh -i ~/.ssh/hostinger_dmb_ed25519 -p 65002 u776151780@145.79.25.8 'tail -5 ~/domains/psova.org.pk/nodejs/console.log ~/domains/psova.org.pk/nodejs/stderr.log'
```

## Adding a news/event item (content workflow)

1. Edit `data/news.ts` (main) — `NEWS` array, newest first. Event items add an `event: {…}` block
   (start/end ISO with `+05:00`, venue, poster path, speaker, patron, contact phone in E.164, `free`).
2. Put the poster in `public/events/<id>.webp`. The first item with an `event` block becomes the featured banner;
   others show as cards linking to `/news/<id>`.
3. All UI strings are in `messages/{en,ur}.json` → `News`.
4. `npx tsc --noEmit`, commit, push `main`, then the TL;DR above.
