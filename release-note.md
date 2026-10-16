# Tip Calculator Release Note (Phase A, Release Readiness)

**Verdict: NOT READY.** The clean-clone build of release commit `e9b9e6df9b58fd0a12899e4632581def99c4d7d7` fails `npm test` in the workflow's own step order. GitHub Actions would stop at the test step and deploy nothing.

## What Would Ship

- Commit: `e9b9e6df9b58fd0a12899e4632581def99c4d7d7` (title: "Fix round: nine fixes from QA and review ..."), on `main`.
- Rollback point: scaffold `51c789d9523e5f4f043b1e8510f9ce59063543a1`.
- Bundle (SHA-stamped build): 248,343 bytes raw, 77,871 bytes gzip, 3 files (JS 233.7 KiB raw / 73.0 KiB gzip; CSS 7.1 KiB; index.html 1.8 KiB).
- Asset names: `assets/index-5j9vns3W.js`, `assets/index-BvfKffuK.css`.

## Clean-Clone CI-Parity Results

Clone: `<scratchpad>/tip-calculator-ci` (outside the project). Node v24.16.0, npm 11.13.0. `GITHUB_SHA` set to the release commit.

| Step | Exit | Result |
|---|---|---|
| `npm ci` | 0 | Clean install from `app/package-lock.json` |
| `npm test` (CI order, before build) | **1** | 340 tests: 337 pass, **3 fail** (all in `src/qa/static.qa.test.ts`) |
| `npm run build` | 0 | Typecheck and Vite build clean |
| `npm test` (after build, SHA set) | **1** | 340 tests: 339 pass, **1 fail** (same file, stamp assertion) |
| `npm run size` | 0 | `Bundle size: 248343 bytes raw, 77871 bytes gzip (3 files in dist/)` |

### Failure 1: Dist-Reading Tests Run Before the Build (Blocks Actions)

`static.qa.test.ts` reads `app/dist/index.html` at module load. `dist/` is gitignored, so a clean checkout has none. The three failing tests are "source index.html has the placeholder; dist has the local stamp...", "assets are relative and exist; no dev-server artefacts", and "bundle URLs are only XML namespaces...". `deploy.yml` runs `npm test` before `npm run build`, so this fails on every Actions run. The test-report's "npm test exit 0" was measured in the working copy, where a previous build left `dist/` in place.

### Failure 2: Stamp Assertion Hardcodes `local`

After the build with `GITHUB_SHA` set, the stamp is the release SHA, but the test expects `content="local"`. The test passes only with no `GITHUB_SHA` set.

**Fix route (not done here; release-engineer owns no product files):** the orchestrator routes it to the QA/frontend lane. Move the dist-dependent checks into a post-build test or skip them when `dist/` is absent, and accept any 40-hex stamp instead of `local`. Then rerun the clean clone in the workflow's order. The known AC4 finding (`it.fails` marker, test-report Failure 1) remains open; it is a copy/contract change, not a release blocker on its own.

### Stamp and Hash Checks (Clone `app/dist/index.html`)

- `<title>Tip Calculator</title>`: present (1 match).
- `<meta name="build-commit" content="e9b9e6df9b58fd0a12899e4632581def99c4d7d7" />`: present; `__BUILD_COMMIT__` placeholder absent.
- `src="./assets/index-5j9vns3W.js"`: relative. Stylesheet `href="./assets/index-BvfKffuK.css"`: relative.
- Working copy `app/dist/` after a SHA-stamped build: JS and CSS SHA-256 identical to the clone (same hashed names). `index.html` differs only by CRLF line endings (the working copy has CRLF from `core.autocrlf`; the clone has LF). Content is otherwise identical. The live file comes from the Actions (LF) build.

## Workflow and Repository Readiness

- `.github/workflows/deploy.yml`: Node 24, `cache-dependency-path: app/package-lock.json`, the four npm steps in order (`npm ci`, `npm test`, `npm run build`, `npm run size`) with `working-directory: app`. Contents read-only (`contents: read`), Pages via `pages: write` and `id-token: write`.
- `app/package-lock.json`: tracked.
- `gh auth status`: logged in as `xzhou110`, scopes `gist, read:org, repo, workflow`. The `workflow` scope is present, so pushing `.github/workflows/*` is allowed. (No `gh auth refresh` needed.)

## Pre-Publication Scans (Read-Only)

- `node C:/Users/xzhou/.claude/git-hooks/secret-scan.mjs --history`: `secret-scan: clean (the whole history)`, exit 0.
- `git ls-files`: no `node_modules`, `dist`, `.env`, binaries or private-file paths (filter returned nothing). Tracked files are the product, `.github/`, `app/` source and config, `briefs/`, `qa/sweep.workflow.js` and the record docs.
- `git status --porcelain`: not empty. Observed, not product files: ` M RUN_LOG.md`, ` M STATE.md`, ` M briefs/release-engineer.md`, `?? qa/sweep.args.json`. These are orchestrator records still being edited. They must be committed or left out before the push; the push ships committed history only.

## Phase B Commands (Do Not Run Until Verdict Is READY and the Owner Says Yes)

Run in order, after the owner's yes and after Failure 1 and 2 are fixed and the clean clone is green in workflow order:

```
gh repo create xzhou110/tip-calculator --public --source D:/Meaningful/AI/tip-calculator --remote origin --description "Tip Calculator: split a dinner bill with the tip, to the cent (XuSeak)"
gh api --method POST repos/xzhou110/tip-calculator/pages -f build_type=workflow
git -C D:/Meaningful/AI/tip-calculator push -u origin main
```

Live check (tech-plan § Release Verification):
1. Wait for the deploy run of the pushed SHA to succeed (`gh run watch ... --exit-status`). Do not request the URL before that.
2. Poll `https://xzhou110.github.io/tip-calculator/` (30-minute timeout) until the body has `<title>Tip Calculator</title>` and `<meta name="build-commit" content="<pushed SHA>"`, and the referenced `assets/index-*.js` returns 200 with a JavaScript content type.
3. Timeout means "deployed, not yet verified live"; never redeploy to "fix" a cached response.

Post-deploy items (web-ship-check § After Deploy). The `?t=` wording is superseded: the stamp is the proof.
- Deploy job succeeded (`gh run list -L 1`): **run after deploy**.
- Live URL 200 with app marker and JS loads: **run after deploy** (step 2 above).
- Data snapshot `count` check: **not applicable** (no `public/data/` snapshot).
- Live bundle is the tested one (`assets/index-<hash>.js` equals the local build; live JS contains a marker string): **run after deploy**; hash check was already run for the clone.
- Encrypted or passphrase-locked site: **not applicable** (no encryption in this app).

## Rollback

Revert to the scaffold `51c789d9523e5f4f043b1e8510f9ce59063543a1` (or the last milestone commit), then push `main`. Pages redeploys through the workflow. Do not redeploy to fix a cached response.

## Gotchas

- `npm test` in workflow order fails on a clean checkout (Failure 1), so the test-report's green is not CI parity.
- The release commit is `e9b9e6d`; HEAD matches. The uncommitted orchestrator records are not part of the release.
