---
name: tip-calculator
summary: Single-page tip calculator for a dinner group — enter the bill, the tip percent and the number of people, see each person's share; light and dark; a shareable link; static SPA on GitHub Pages (XuSeak)
status: live
live: https://xzhou110.github.io/tip-calculator/
repo: https://github.com/xzhou110/tip-calculator
updated: 2026-10-16
category: products
phase: shipped
next: watch real use; the six low review findings carried in STATE.md (iOS select-on-focus check first) and the Node 20 action-major bump are the candidates for the next iteration
---

# Tip Calculator

## 1. Summary
A dinner group needs one answer fast: what does each person pay? This single page takes the bill, a tip percent and the number of people and shows the tip, the total and each person's share as you type, in light or dark, on a phone at the table, with a link that reproduces the split. Static, free, no backend, no account. Built and shipped by the `/build` orchestrator (plugin v0.3.1 to v0.3.3) as its first real run on the workflow scripts; live since 2026-10-16.

## 2. Key facts
| | |
|---|---|
| **Kind** | web app (static single-page app, public) |
| **Stack** | Vite 7 + React 19 + TypeScript 5.9, Vitest 3.2 (node), plain CSS tokens with light and dark (the owner's default stack from `ship-web-app`) |
| **Local path** | `D:/Meaningful/AI/tip-calculator` (Vite app in `app/`) |
| **Run** | `cd app; npm run dev` · workspace launch entries `tip-calculator` (dev, :5182) and `tip-calculator-preview` (production bundle, :4182) · `npm test` (341 tests) · `npm run build` · `npm run size` |
| **Deploy** | push to `main` → `.github/workflows/deploy.yml` (`npm ci`, `npm test`, `npm run build`, `npm run size`) → GitHub Pages at https://xzhou110.github.io/tip-calculator/; the page carries `<meta name="build-commit">` with the deployed commit |
| **Data / backends** | none; the inputs live only in the URL fragment, the theme choice in `localStorage['tip-calculator.theme.v1']`; $0 |
| **Related** | [`/build` plugin](../claude-marketplace/PROJECT.md) (this run graded `test/evals/build.md`; D-001 to D-009 here) · siblings on the same stack: [car-shopping](../car-shopping/PROJECT.md), [apartment-shopping](../apartment-shopping/PROJECT.md) · skills: `ship-web-app`, `frontend-baseline`, `web-ship-check`, `qa-sweep` |
| **Started · last major change** | 2026-10-15 · 2026-10-16 (first publication) |

## 3. Key things to know
- **Record convention (the /build logs).** `STATE.md` is a snapshot rewritten in place; `RUN_LOG.md` is the chronological history, appended, never reordered; `api-contract.md` is edited in place with a "last frozen" line; the Change highlights below are one-line pointers, newest first. Local machine paths and session ids were stripped before the first publication (D-009); the workspace paths `D:/Meaningful/AI/...` stay.
- **The contract wins.** `api-contract.md` freezes the types, the parse rules (in order), the rounding, the URL and storage contracts and the exact copy strings; `design-doc.md` yields to it where they differ. Change the contract first, then the code and its golden cases.
- **Money math is integer cents in pure modules** (`app/src/lib/`); the tip percent is integer basis points; the UI does no arithmetic. Tip rounds half up; shares round **up** to the cent and the overage is always stated ("2¢ over the Total"); the table is never short (D-003).
- **Parse rules that were argued over:** a comma in Bill must form thousands groups (`1,234.56` yes, `86,40` is "Enter a number, like 86.40"), so a comma-decimal entry can never be read as $8,640 (D-007, R-5); a hash value containing whitespace, including a `+` decoded to a space, falls back to the default (R-4); bills under $1 billion and people up to 15 digits keep the arithmetic exact, each refused with a message that names the limit (D-005); a lone `-` is the negative error, not empty.
- **The live check is a build-commit stamp, not a query string.** GitHub Pages' CDN ignores `?t=` (verified on this and a sibling site), so `vite.config.ts` stamps `index.html` with `GITHUB_SHA` and a deploy is live when the bare URL serves the pushed SHA (D-004). Never request a brand-new Pages URL before its deploy run succeeds: the 404 is cached for an unknown time.
- **Tests must pass on a clean checkout before any build.** CI runs `npm test` before `npm run build`; the QA suite's dist-dependent checks skip without `app/dist` and accept a commit stamp (D-008, caught by the clean-clone build).
- **360px has no slack in the Tip row** (4 × 52px picks + 96px field + gaps = 328px): a wider pick, gap or field basis wraps the Tip field onto its own row (design-doc revision 4). Below 360px it wraps by design.
- **The theme key is namespaced** (`tip-calculator.theme.v1`) because every Pages app of the owner shares the `xzhou110.github.io` origin's localStorage; absent or junk means follow the system, live.
- **No backend, no secrets, no analytics;** the one external link is the XuSeak footer with `rel="noopener noreferrer"`; the privacy hooks run on every commit and push.

## 4. Details
### How it works
Frozen `types.ts` and `constants.ts` → pure modules `calc.ts` (parse, computeSplit, evaluate, steps, pressedPick), `format.ts`, `messages.ts` (every string and the status-line selection), `urlState.ts` (hash in, hash out), `theme.ts` → hooks `useSplitState` (hydrate once, `replaceState` after 150 ms, `hashchange`) and `useTheme` (stored choice beats the system; follows the system live until a choice) → components (display card first, then Bill, Tip with picks, People stepper, Copy Link, footer). `tech-plan.md` has the folder map and eighteen key decisions; `design-doc.md` the flows, tokens, copy and accessibility notes.

### How to work on it
`npm run typecheck`, `npm test` and `npm run build` exit 0 before a commit; a UI change is checked in the production bundle (launch entry `tip-calculator-preview`, load with a cache-busting query before the hash) at 360px in light and dark with a clean console; a release-level change runs `qa/sweep.workflow.js` (the completion sweep adapted to a static SPA) and a clean-clone build before the push. A validated change is pushed with the hooks on and verified live by the build-commit stamp.

### Current state & open items
Live since 2026-10-16 (commit 6e62260). Open, none a must-fix (STATE.md § Open findings): R-6 stepping from an invalid value, R-7 the status line at absurd bounds, R-9 aria-live on the helper tone, R-11 iOS select-on-focus by tap (needs an iPhone), R-12 an announcement race, R-14 unit tests for the URL-write path; the Node 20 action majors in `deploy.yml` (an annotation, not a failure).

### Change highlights
- 2026-10-16 — first publication: public repository and Pages site; records stripped of local paths and ids (D-009); QA's dist-dependent tests skip on a clean checkout (D-008); fix round of nine QA and review items (D-007); completion sweep 0 confirmed findings; 341 tests.
- 2026-10-15 — project created by `/build` (plugin v0.3.0 → v0.3.1 during the run); Build Brief approved (D-002); PRD, design doc, tech plan, frozen contract, scaffold, the frontend lane, integration checkpoint.

## 5. Pointers
- [README.md](README.md) — what it does, how to use it, how it works, how to work on it
- [PRD.md](PRD.md) · [design-doc.md](design-doc.md) · [tech-plan.md](tech-plan.md) · [api-contract.md](api-contract.md) — the build artifacts
- [DECISIONS.md](DECISIONS.md) — D-001 to D-009
- [STATE.md](STATE.md) · [RUN_LOG.md](RUN_LOG.md) — the snapshot and the chronological history
- [test-report.md](test-report.md) · [review-findings.md](review-findings.md) · [release-note.md](release-note.md) · [qa/sweep.workflow.js](qa/sweep.workflow.js) — verification
- [briefs/](briefs/) — one AGENT_BRIEF per spawned agent
- Rules and skills — `D:/Meaningful/AI/agent-skills/rules/global-rules.md`; skills `ship-web-app`, `frontend-baseline`, `web-ship-check`, `qa-sweep`
