# Tip Calculator Release Note (Phase A, Release Readiness)

**Verdict: READY for the owner's deploy gate (Phase A only).** Nothing is published. The repository `xzhou110/tip-calculator` does not exist yet; no remote, Pages, push or auth change was made.

## What Would Ship

- Commit: `bd173070eb0f18413ea6920cda7d6bb06295dfae` on `main` (title: "QA static suite: dist checks skip on a clean checkout and accept a commit stamp (D-008; CI runs npm test before the build)").
- Rollback point (scaffold): `51c789d9523e5f4f043b1e8510f9ce59063543a1`.
- Bundle (SHA-stamped build, from the clean clone): 248,343 bytes raw, 77,871 bytes gzip, 3 files. JS 233.7 KiB raw / 73.0 KiB gzip; CSS 7.1 KiB; index.html 1.8 KiB.
- Asset names: `assets/index-5j9vns3W.js`, `assets/index-BvfKffuK.css`.

## Clean-Clone CI-Parity Results

Clone: `<scratchpad>/tip-calculator-ci` (outside the project, cloned from the local repository at the release commit). Node v24.16.0, npm 11.13.0, `GITHUB_SHA=bd173070eb0f18413ea6920cda7d6bb06295dfae` for the build and the post-build test.

| Step | Exit | Result |
|---|---|---|
| `npm ci` | 0 | Clean install from `app/package-lock.json` |
| `npm test` (CI order, before build) | 0 | 341 tests: 338 pass, 3 skipped (the dist-dependent checks in `static.qa.test.ts`, skipped on a clean checkout as designed) |
| `npm run build` | 0 | `tsc --noEmit` and Vite build clean |
| `npm test` (after build, SHA set) | 0 | 341 tests: 341 pass, 0 skipped |
| `npm run size` | 0 | `Bundle size: 248343 bytes raw, 77871 bytes gzip (3 files in dist/)` |

**Stamp and path checks** on the clone's `app/dist/index.html`:
- `<title>Tip Calculator</title>`: present.
- `<meta name="build-commit" content="bd173070eb0f18413ea6920cda7d6bb06295dfae" />`: present; `content="local"` count is 0 (the placeholder is gone).
- `src="./assets/index-5j9vns3W.js"`: relative, present.

**Hash check against the working copy.** `npm run build` was run in the working copy's `app/` with the same `GITHUB_SHA` (build only, no install). Asset names are identical. `index-5j9vns3W.js` and `index-BvfKffuK.css` are byte-identical to the clone's. `index.html` differs only in line endings: the clone's checkout is CRLF because this machine's global `core.autocrlf` is `true`; the Ubuntu runner checks out LF. With CRs stripped the two files are identical.

## Workflow Readiness

- `.github/workflows/deploy.yml` runs `npm ci`, `npm test`, `npm run build`, `npm run size` in that order (test before build), with `node-version: 24`, `cache: npm` and `cache-dependency-path: app/package-lock.json`.
- `app/package-lock.json` is tracked.
- Token scopes (`gh auth status`): `gist`, `read:org`, `repo`, `workflow`. The `workflow` scope is present, so pushing `.github/workflows/*` is allowed. No refresh needed.

## Pre-Publication Scans (Read-Only)

- `node C:/Users/xzhou/.claude/git-hooks/secret-scan.mjs --history`: exit 0, `secret-scan: clean (the whole history)`.
- `git ls-files`: 63 files. No `node_modules`, `dist`, `.env`, binaries or private-named files. Tracked `app/package-lock.json` only.
- `git status --porcelain` (observed, not blocking): ` M RUN_LOG.md`, ` M STATE.md`, ` M briefs/release-engineer.md`. These are the orchestrator's record files and are not part of the release commit. `git push` sends commits only, so they do not ship. This note (`release-note.md`) is also a modified tracked file after this write.
- Ignored and untouched: `app/dist/` and `app/node_modules/` in the working copy (git-ignored build output; no install was run in the working copy).

## Phase B: Exact Commands (Run Only After the Owner's Yes)

Run from Git Bash. `gh` is at `C:/Program Files/GitHub CLI/gh.exe` (not on Git Bash's PATH), so the commands below use the full path. Order matters: enable Pages before the first run.

1. Create the public repository (no push yet):

   ```
   "C:/Program Files/GitHub CLI/gh.exe" repo create xzhou110/tip-calculator --public --source D:/Meaningful/AI/tip-calculator --remote origin --description "Tip Calculator: split a dinner bill with the tip, to the cent (XuSeak)"
   ```

2. Enable Pages with the Actions source:

   ```
   "C:/Program Files/GitHub CLI/gh.exe" api --method POST repos/xzhou110/tip-calculator/pages -f build_type=workflow
   ```

3. Push the release commit (the hooks stay on; never `--no-verify`):

   ```
   git -C D:/Meaningful/AI/tip-calculator push -u origin main
   ```

4. Wait for the deploy run of the pushed commit to succeed (never request the live URL before this):

   ```
   SHA=$(git -C D:/Meaningful/AI/tip-calculator rev-parse HEAD)
   RUN=$("C:/Program Files/GitHub CLI/gh.exe" run list --repo xzhou110/tip-calculator --workflow deploy.yml --commit "$SHA" --limit 1 --json databaseId --jq '.[0].databaseId')
   "C:/Program Files/GitHub CLI/gh.exe" run watch "$RUN" --repo xzhou110/tip-calculator --exit-status
   ```

   An empty `RUN` means Actions has not queued the run yet; repeat the `run list` line after a few seconds. A non-zero exit from `run watch` means nothing is live: stop and report.

5. Poll the bare URL until the stamped page is served (30-minute timeout; run in the background). It matches the title and `build-commit` equal to the pushed SHA, never a `?t=` query:

   ```
   URL='https://xzhou110.github.io/tip-calculator/'
   END=$(( $(date +%s) + 1800 ))
   until BODY=$(curl -sf "$URL") \
     && printf '%s' "$BODY" | grep -qF '<title>Tip Calculator</title>' \
     && printf '%s' "$BODY" | grep -qF "<meta name=\"build-commit\" content=\"$SHA\""; do
     if [ "$(date +%s)" -ge "$END" ]; then echo 'NOT LIVE YET after 30 min'; curl -sI "$URL"; exit 1; fi
     sleep 30
   done
   curl -sI "$URL" | grep -iE '^(HTTP|age|x-cache)'
   JS=$(printf '%s' "$BODY" | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' | head -n 1)
   curl -s --compressed -o /dev/null -w 'js %{http_code} %{content_type} %{size_download} bytes over the wire\n' "$URL$JS"
   ```

   On a timeout the result is "deployed, not yet verified live", with the last status, `Age` and `X-Cache`. Never redeploy to fix a cached response.

## Post-Deploy Checks (web-ship-check § After Deploy)

- Deploy job succeeded (`gh run list`): **run** at step 4 (Phase B; not applicable in Phase A).
- Live URL 200, app marker and JS bundle loads: **run** at step 5 (Phase B). The `build-commit` match is the cache proof; the `?t=` wording is superseded.
- Data snapshot (`public/data/*.json`): **not applicable** (no data snapshot in this app).
- Live bundle is the tested one: **run** at step 5 (Phase B). Expected `assets/index-5j9vns3W.js` and `assets/index-BvfKffuK.css`; a different hash means a different build and must be explained before sign-off.
- Encrypted or passphrase-locked site: **not applicable** (no encryption, no passphrase).
- Browser journey on the live URL (QA's pass per tech-plan): **run** by QA after step 5; it must confirm the network log holds only `xzhou110.github.io` requests.

## Rollback

- Preferred (no force-push): revert the product commits back to the scaffold, then push:

  ```
  git -C D:/Meaningful/AI/tip-calculator revert --no-edit 51c789d9523e5f4f043b1e8510f9ce59063543a1..HEAD
  git -C D:/Meaningful/AI/tip-calculator push origin main
  ```

  The workflow redeploys the reverted tree. Verify with step 5 against the new pushed SHA.
- Fastest stop, before any revert: `"C:/Program Files/GitHub CLI/gh.exe" api --method DELETE repos/xzhou110/tip-calculator/pages` removes the site. It needs the owner's approval because it takes the live page down.

## Gotchas

- The working copy's record files are uncommitted. If the orchestrator commits them before the push, the pushed SHA changes (the CI-parity build was on `bd17307`). A docs-only commit does not touch `app/`, but the live check must use the new pushed SHA, which step 4 does via `rev-parse HEAD`.
- Global `core.autocrlf=true` makes Windows checkouts CRLF; the byte-level hash check of `index.html` must strip CRs. The Actions build is LF.
- `gh` is not on Git Bash's PATH; use the full path.
