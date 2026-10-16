# PRD: Tip Calculator

Formalizes the Build Brief the owner approved on 2026-10-15 (DECISIONS D-001, D-002). Amended at the contract-freeze gate (AC4, AC11, Constraints; D-004, D-005). QA tests against the acceptance criteria below and the orchestrator accepts against them.

## Problem
At the end of a group dinner, someone has to turn the bill, a tip and a head count into one number per person, quickly, on a phone, without arguing about rounding. Generic calculators make this a four-step chore and most tip apps bury the answer under ads or accounts.

## Users
A person at a restaurant table, phone in hand, in a hurry, often in dim light (hence dark mode). Any group size from two up. No account, no history, no learning curve: the page must be understood in one glance.

## Outcome Brief
Build this for a person at a restaurant table, phone in hand, who wants to end the "what do I owe" moment in ten seconds. Its main job is to help them turn three numbers into one number per person they can trust. The recurring visit is the same three numbers each time, so speed and legibility beat features. On opening it they should understand the three inputs without instructions and read the share without hunting. Prioritize the live result; keep the custom tip percent accessible. Use arithmetic shown to the cent, with any rounding difference stated rather than hidden. The one end-to-end journey: open the link, enter 86.40, tap 20%, set 4 people, read $25.92 each, done.

## Scope
**In:** bill, tip percent (quick picks plus a custom value), number of people; tip amount, total and per-person share updating live; light and dark with a toggle that follows the system by default; phone-first layout; the three inputs in the URL so a link reproduces the split; a pure, unit-tested calculation module; free deploy on GitHub Pages via GitHub Actions under the XuSeak brand.

**Out (non-goals):** itemized or uneven splits, tax handling, currencies other than a US-dollar format, saved history, accounts, an offline service worker, analytics, a backend, a native app.

## Acceptance Criteria
1. The page shows three labelled inputs (Bill, Tip, People) and three results (Tip Amount, Total, Each Person Pays); with no bill entered the results show placeholders, never $0.00 or NaN.
2. Results update as you type with no submit button; tip = bill × percent ÷ 100, total = bill + tip, share = total ÷ people, each shown to the cent.
3. Tip quick picks 15, 18, 20 and 25 percent plus a custom percent field accepting 0 to 100.
4. People is a whole number of 1 or more; values beyond exact integer precision (more than 15 digits) are refused with a plain message, a technical limit with its reason, not a product cap.
5. When the rounded shares multiplied by the people differ from the total, the page says by how much; the difference is never silent.
6. Invalid or empty input (negative, letters, zero people) shows a short plain message by the field; results never show NaN, Infinity or a negative value.
7. Theme follows the system setting by default, a visible toggle overrides it, the choice persists across reload, and the page never flashes the wrong theme on load.
8. Works at 360px wide with no horizontal scroll; every input has a label; keyboard-operable with visible focus; text meets WCAG AA contrast in both themes.
9. The three inputs live in the URL so a link reproduces the split; a link with bad values falls back to defaults without an error.
10. The pure calculation module has unit tests (happy path, rounding, invalid input); typecheck, tests and production build all exit 0.
11. Deployed free at https://xzhou110.github.io/tip-calculator/ from the public repository xzhou110/tip-calculator by GitHub Actions on push to main; the live page serves the app's own title marker and a build-commit stamp equal to the pushed commit (GitHub Pages' CDN ignores the query string, so the stamp, not a `?t=` value, is the proof of freshness); no backend, no secrets, no analytics.
12. Branded XuSeak with the title "Tip Calculator"; labels in Title Case.

## Success Metrics
- The journey in the Outcome Brief completes in at most five interactions after the page opens, on a 360px viewport, in light and dark, with a clean console.
- Every criterion above is tested by QA with observed output; no criterion is accepted on a claim.
- The production bundle size is measured and reported (no target is imposed; a static page should simply be small).

## Decisions Left to the Crew
Decided in the plan stage (DECISIONS D-003 to D-005): default tip 20% and 2 people; shares rounded up to the cent with the overage stated; the Vite app in `app/`.
- Defaults for the tip percent and the people count, and the exact rounding rule behind criterion 5 (round shares to the cent and state the difference, or round up so the group never under-pays), are the Designer's and Tech Lead's call; the choice is recorded in design-doc.md and api-contract.md.
- Whether the Vite app lives in `app/` (like the sibling apps car-shopping and apartment-shopping) or at the repository root is the Tech Lead's call.

## Constraints
- The owner's default stack: Vite + React + TypeScript, a pure logic engine with unit tests, GitHub Pages + GitHub Actions (`ship-web-app` § Default Stack); the app is served at `/tip-calculator/` on GitHub Pages, with Vite's `base` set to `'./'` (relative asset URLs, as in the sibling apps).
- Brand XuSeak; labels in Title Case; no secrets, no analytics; the privacy hooks run on every commit and push.
- The first publication (new public repository, new Pages site) waits for the owner's explicit yes at the deploy gate.

## Record Convention
`STATE.md` is a snapshot rewritten in place; `RUN_LOG.md` is the chronological history; `api-contract.md` is edited in place with a "last frozen" line; `DECISIONS.md` holds one entry per non-obvious decision.
