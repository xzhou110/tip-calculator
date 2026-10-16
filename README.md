# Tip Calculator

Split a dinner bill in seconds. Enter the bill, pick or type a tip percent, set how many people, and read each person's share as you type. Light and dark, phone first, nothing leaves your browser. A XuSeak project.

**Live:** https://xzhou110.github.io/tip-calculator/

## How to Use It
1. Open the page. Type the bill (a leading `$`, spaces and thousands commas are fine; `86.40`, `86.4` and `$1,234.56` all work).
2. Tap a tip pick (15, 18, 20 or 25 percent) or type any percent from 0 to 100, with up to two decimals.
3. Set the number of people with the − and + buttons or by typing.
4. Read **Each Person Pays**, the **Tip Amount** and the **Total**. The line under the big number shows the arithmetic: "Splits evenly: 4 × $25.92 = $103.68." or, when the cents do not divide, "Rounded up to the cent: 3 × $39.34 = $118.02, 2¢ over the Total." The table is never short; the difference is always shown.
5. **Copy Link** copies a link that opens the same split for anyone you send it to (the three inputs live in the URL after `#`; nothing is sent to a server).
6. **Light | Dark** at the top overrides the system theme and is remembered on this device.

Keyboard: Tab through the controls in reading order; ArrowUp and ArrowDown step the tip and the people count; Enter never submits.

## How It Works
- Vite + React + TypeScript single page in [`app/`](app/), plain CSS tokens with a `[data-theme="dark"]` override and a no-flash theme script in [`app/index.html`](app/index.html).
- All money math is integer cents in pure modules under [`app/src/lib/`](app/src/lib/): parse rules, half-up tip rounding, shares rounded up to the cent, the overage, the status line, the URL state and the theme. The UI only renders. [`api-contract.md`](api-contract.md) is the frozen contract; its golden cases are the test oracle.
- 341 tests (Vitest, node environment) in `app/src/lib/*.test.ts`, `app/src/contract.test.ts` and QA's `app/src/qa/`.
- Deployed by GitHub Actions to GitHub Pages on every push to `main` ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): `npm ci`, `npm test`, `npm run build`, `npm run size`, deploy). The built page carries `<meta name="build-commit">` with the deployed commit, which is how a deploy is verified live (the Pages CDN ignores query strings).

## Work on It
```
cd app
npm install
npm run dev        # http://localhost:5173
npm test
npm run typecheck
npm run build      # tsc --noEmit && vite build -> dist/
npm run size       # bundle size report after a build
npm run preview    # serves dist/
```
Known limits, each with a plain message in the app: bills under $1,000,000,000 and people counts up to 15 digits keep the arithmetic exact in JavaScript numbers.

## How It Was Made
Built by the `/build` orchestrator (the owner's `multi-agent-orchestrator` plugin, v0.3.1 to v0.3.3) as its first real run. The records are in this repository: [PRD.md](PRD.md), [design-doc.md](design-doc.md), [tech-plan.md](tech-plan.md), [api-contract.md](api-contract.md), [DECISIONS.md](DECISIONS.md), [RUN_LOG.md](RUN_LOG.md), [STATE.md](STATE.md), [test-report.md](test-report.md), [review-findings.md](review-findings.md), [release-note.md](release-note.md), the agent briefs in [briefs/](briefs/) and the completion sweep in [qa/](qa/). The owner's map is [PROJECT.md](PROJECT.md).

## License
No license is granted; the code is published for reference.
