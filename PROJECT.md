---
name: tip-calculator
summary: Single-page tip calculator for a dinner group — enter the bill, the tip percent and the number of people, see each person's share; light and dark; free on GitHub Pages (XuSeak)
status: active
live: none
repo: none
updated: 2026-10-15
category: products
phase: building
next: the owner's go on the Build Brief, then PRD.md and the plan workflow (designer, tech lead)
---

# Tip Calculator

## 1. Summary
A dinner group needs one answer fast: what does each person pay? This single page takes the bill, a tip percent and the number of people and shows the tip, the total and each person's share as you type, in light or dark, on a phone at the table. Static, free, no backend, no account. Built by the `/build` orchestrator (plugin v0.3.0) as the acceptance test of its workflow scripts; status: building, not yet deployed.

## 2. Key facts
| | |
|---|---|
| **Kind** | web app (static single-page app, public) |
| **Stack** | Vite + React + TypeScript, a pure unit-tested calculation module, CSS tokens with light and dark (the owner's default stack from `ship-web-app`) |
| **Local path** | `D:/Meaningful/AI/tip-calculator` (Vite app in `app/`, decided by the Tech Lead) |
| **Run** | `cd app; npm run dev` (dev server) · `npm test` · `npm run build` |
| **Deploy** | push to `main` → GitHub Actions → GitHub Pages at https://xzhou110.github.io/tip-calculator/ (not yet created; the first publication waits for the owner's yes at the deploy gate) |
| **Data / backends** | none; nothing leaves the browser; $0 |
| **Related** | [`/build` plugin](../claude-marketplace/PROJECT.md) (this is its v0.3.0 acceptance run; eval `test/evals/build.md`) · siblings on the same stack: [car-shopping](../car-shopping/PROJECT.md), [apartment-shopping](../apartment-shopping/PROJECT.md) · skills: `ship-web-app`, `frontend-baseline`, `web-ship-check`, `qa-sweep` |
| **Started · last major change** | 2026-10-15 · 2026-10-15 |

## 3. Key things to know
- **Record convention (the /build logs).** `STATE.md` is a snapshot rewritten in place; `RUN_LOG.md` is the chronological history, appended, never reordered; `api-contract.md` is edited in place with a "last frozen" line; the Change highlights below are one-line pointers, newest first.
- **Scope is the owner's ask:** bill, tip percent, people, each person's share, light and dark, deployed free. Anything beyond it (a shareable link, the defaults) was proposed in the Build Brief and is recorded in `DECISIONS.md`.
- **Brand XuSeak;** the app title is "Tip Calculator"; labels in Title Case.
- **Money math lives in one pure module with unit tests;** the UI never does arithmetic of its own. Shares are shown to the cent and the page states any rounding difference rather than hiding it.
- **No backend, no secrets, no analytics.** A client-side app has nothing to protect; the privacy hooks still run on every commit and push.

## 4. Details
### How it works
Frozen TypeScript types → a pure calculation module (bill, percent, people → tip, total, share, rounding note) covered by unit tests → a thin React page that reads inputs, renders results and toggles the theme. The Tech Lead's `tech-plan.md` holds the folder map once the architecture phase has run.

### How to work on it
`npm run typecheck`, `npm test` and `npm run build` must exit 0; the PRD journey is checked in a real browser (light and dark, phone width, console clean) before a milestone commit. A validated change is committed and pushed with the hooks on; the first publication (new public repository, new Pages site) waits for the owner's explicit yes.

### Current state & open items
Phase: PRD (the Build Brief is posted; fan-out waits for the owner's go). See [STATE.md](STATE.md).

### Change highlights
- 2026-10-15 — project created by `/build` (plugin v0.3.0); D-001 recorded; Build Brief posted.

## 5. Pointers
- README.md — written at the final report
- DECISIONS.md — D-001: tier, verification row, name and crew
- STATE.md — the live snapshot (phase, done, blocked, resume data)
- RUN_LOG.md — the chronological run history
- PRD.md · design-doc.md · tech-plan.md · api-contract.md — the build artifacts, written as the phases run
- Rules and skills — `D:/Meaningful/AI/agent-skills/rules/global-rules.md`; skills `ship-web-app`, `frontend-baseline`, `web-ship-check`, `qa-sweep`
