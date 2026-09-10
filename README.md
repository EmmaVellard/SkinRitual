# Skin Ritual

A private, local-first skincare PWA. The starter cabinet and deterministic routine engine answer “What should I use right now?” using functional roles and completed-use history. No account, backend, analytics, remote fonts, or tracking.

## Run

Node 22.13+ and npm. Run `npm ci`, then `npm run dev`. For production: `npm run build` and serve `out/` at a website's root over HTTPS. For a local production preview use `python3 -m http.server 3000 --directory out --bind 127.0.0.1`.

`npm test`, `npm run typecheck`, and `npm run lint` verify the foundation. Tests use an IndexedDB implementation in memory; real Safari/device QA is still required.

## First milestone

- Today and Products; no empty Rules or History navigation.
- Product creation, editing, deletion, pause, reactivation, and finished status.
- Morning/evening/both assignments and numerical order (lower first).
- Per-step completion, undo, completion feedback, and daily persistence.
- Local date boundaries; automatic morning before 15:00, evening afterward, with a session-only manual override.
- Native modal form with required fields, keyboard handling, and delete confirmation.
- Fifteen starter products, editable roles and schedules, duplicate-function selection, oil/foam pairing, rotation, intensity budgets, and saved explanations. See [DEFAULTS.md](./DEFAULTS.md).
- Stored lifecycle fields and notes. No lifecycle calculations or warnings yet.
- Manifest, local PNG icons, safe-area spacing, and a versioned offline shell generated from the production output. No development service worker.

Started routines are frozen snapshots. Cabinet changes affect the next unstarted routine; historical names survive deletion. A started routine is created atomically with the first checkmark. Completion counts actual checked steps, never just opening the app.

## Storage and privacy

`lib/database.ts` lazily opens IndexedDB only in the browser. Version 2 adds initialization metadata and routine settings to `products` and `routines`. The upgrade preserves existing records; seeding only fills a cabinet without products or history and without the initialization marker. Routine updates use read/write transactions across both stores. Save failures retain form input; the UI updates only after persistence succeeds. BroadcastChannel refreshes other tabs where available.

Data belongs to this browser and origin (scheme, hostname, port). Clearing site data or browser eviction can remove it. Safari and a Home Screen install may use separate storage. This release does not provide backup/restore yet: do not regard it as your only durable record. A future versioned export/import should validate before transactionally replacing data.

## PWA

Deploy the static `out/` directory at the root of a stable HTTPS origin before using on iPhone. Open in Safari, choose Share → Add to Home Screen, then consistently use the installed app. Local development on your computer is not an iPhone deployment. The offline cache installs after a successful online load; verify a subsequent offline reopen on the target device. Updates activate after the new shell is cached. Navigation checks the network first and falls back offline; updates never reload an open form automatically. Started routines remain saved snapshots. No notification permissions are requested.

The app registers `/sw.js` in production. The build hashes the exported files and precaches only same-origin app assets, never personal data. Set NEXT_PUBLIC_BASE_PATH=/SkinRitual for GitHub Pages. Next.js assets, home link, manifest icons/start URL/scope, and the service worker share that prefix.

## Product plan

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the original foundation plan. [DEFAULTS.md](./DEFAULTS.md) documents the implemented scheduler, classifications, and current boundaries.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` runs checks, builds for `/SkinRitual`, and deploys `out/` with GitHub Actions. Repository Settings → Pages must use GitHub Actions. `main` pushes trigger a new deployment.

Source and bundled starter-product defaults are public when published. Browser cabinet edits and history are never included in the deployment. The public URL is a different origin from the local preview, so it has its own IndexedDB cabinet. Do not clear browser data to update the app.
