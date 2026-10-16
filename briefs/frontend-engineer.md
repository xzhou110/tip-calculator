# Agent Brief: frontend-engineer · the one build lane

You are the Frontend Engineer of a /build run, the only engineer on this product. A cold agent receives nothing else from the conversation: every section below stands on its own. Read every section before your first edit. Your role file is `D:/Meaningful/AI/claude-marketplace/plugins/multi-agent-orchestrator/agents/frontend-engineer.md`; this brief adds the project specifics.

## Goal
Implement the Tip Calculator, a single-page Vite + React + TypeScript app in `D:/Meaningful/AI/tip-calculator/app`, exactly against the frozen contract (`api-contract.md`) and the design document (`design-doc.md`, revision 3). Build the five pure modules in `app/src/lib/` test-first (the golden cases in the contract are the minimum), then the two hooks, then the components and `styles.css`. The scaffold already builds: `app/src/main.tsx`, `App.tsx` and `styles.css` are stubs for you to replace; `types.ts`, `constants.ts` and `contract.test.ts` are frozen. The UI does no arithmetic of its own: every number, message and status line comes from the pure modules.

## Acceptance Criteria You Own
Copied verbatim from PRD.md. Criterion 11 (the live deploy) belongs to the release step, not to you.
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
12. Branded XuSeak with the title "Tip Calculator"; labels in Title Case.

## Lane
- **Owned paths (edit freely):** `D:/Meaningful/AI/tip-calculator/app/src/**` and `D:/Meaningful/AI/tip-calculator/app/public/**`, except the three frozen files below. Expected files: `src/lib/calc.ts`, `format.ts`, `messages.ts`, `urlState.ts`, `theme.ts`, each with a `*.test.ts` beside it; `src/state/useSplitState.ts`, `src/state/useTheme.ts`; `src/components/*.tsx`; `src/App.tsx`, `src/main.tsx`, `src/styles.css`.
- **Read-only paths:** `PRD.md`, `api-contract.md`, `design-doc.md`, `tech-plan.md`, `PROJECT.md`, `DECISIONS.md` (project root); `app/index.html` (the no-flash script and the `#root` element are already there; the stylesheet is imported from `main.tsx`).
- **Forbidden (never edit):** `app/package.json`, `app/package-lock.json`, `app/tsconfig.json`, `app/vite.config.ts`, `app/index.html`, `app/src/types.ts`, `app/src/constants.ts`, `app/src/contract.test.ts`, `app/scripts/report-bundle-size.mjs`, `.github/workflows/deploy.yml`, `.gitignore`, and every record file at the project root (`PRD.md`, `design-doc.md`, `tech-plan.md`, `api-contract.md`, `PROJECT.md`, `DECISIONS.md`, `STATE.md`, `RUN_LOG.md`, `README.md`, `briefs/**` except your own BLOCKERS file).
- **Never run a dependency install** (`npm install`, `npm add`, `npx <package>` that downloads). Everything the tech plan lists is installed: react 19, react-dom 19, vite 7, @vitejs/plugin-react 5, typescript 5.9, vitest 3.2, the @types packages.

## Commands and Shell
- Shell: the Bash tool (Git Bash) or Windows PowerShell 5.1 (no `&&`; use `;`). Read `D:/Meaningful/AI/agent-skills/rules/machine-windows.md` first: write files with the edit tool (never through shell one-liners or heredocs; backslashes and backticks get mangled), UTF-8 without a BOM, `py` not `python`.
- Work in `D:/Meaningful/AI/tip-calculator/app`. Typecheck: `npm run typecheck` · Tests: `npm test` (Vitest, node environment, `src/**/*.test.ts`) · Build: `npm run build` (= `tsc --noEmit && vite build`) · Dev server: do not start one; the orchestrator runs the browser pass. The tests must stay in the node environment (no jsdom is installed): test the pure modules, not the DOM.

## Stack Facts
- React 19 with `createRoot` and `StrictMode`; Vite 7 with `base: './'`; TypeScript 5.9 strict with `noUnusedLocals` and `noUnusedParameters`; Vitest 3.2 in the node environment. Plain CSS in `src/styles.css` with custom properties; no CSS framework, no icon library, no fonts from a CDN.
- Money is integer cents and the tip percent integer basis points, end to end (api-contract § Conventions). `Math.round` and `toFixed` are never used on money; integer division is `(n - (n % d)) / d`.
- Theme: `index.html` already sets `document.documentElement.dataset.theme` before first paint from `localStorage['tip-calculator.theme.v1']` or the system setting; your `useTheme` hook reads and writes the same key through `lib/theme.ts`, and the toggle is the two-segment Light | Dark group from the design doc. The tokens block in design-doc § Design Tokens (CSS) goes into `styles.css` verbatim: `:root { … }` light values and `:root[data-theme="dark"] { … }`.
- URL state lives in the hash (`#bill=86.40&tip=20&people=4`) per api-contract § URL-State Contract and its runtime rules (hydrate once in the `useState` initializer, `history.replaceState` after a 150 ms quiet period, `hashchange` listener, Copy Link flushes).
- Inputs are `type="text"` with `inputmode` (`decimal` for Bill and Tip, `numeric` for People), never `type="number"` (design-doc § Engineering Notes). Do not reformat what the user typed. Every field keeps one reserved message line; the display card sits above the inputs in the DOM and visually.
- Copy strings are verbatim from api-contract § Error Shapes the UI Renders (they use the typographic apostrophe ’, × and ¢); the status-line selection, field messages and the screen-reader announcement are pure functions in `lib/messages.ts`.
- Labels in Title Case; the XuSeak brand is a small footer line with `rel="noopener noreferrer"` on its link; no analytics, no external requests of any kind.

## Inputs (read first, in this order)
1. `D:/Meaningful/AI/tip-calculator/PRD.md` (the criteria above come from it)
2. `D:/Meaningful/AI/tip-calculator/api-contract.md` (build against it exactly: signatures, parse rules, golden cases, URL and storage contracts, the strings)
3. `D:/Meaningful/AI/tip-calculator/design-doc.md` (flows, screen descriptions, tokens, copy, accessibility notes, engineering notes)
4. `D:/Meaningful/AI/tip-calculator/tech-plan.md` § System design, § Data model, § File/module layout and lanes (your file list), § Key decisions
5. `D:/Meaningful/AI/agent-skills/skills/frontend-baseline/SKILL.md`, `assets/baseline.css` (adapt; note the design doc overrides its `input:focus` rule), `assets/theme-toggle.md`, `references/responsive-and-a11y.md`, `references/owner-design-preferences.md`
6. `D:/Meaningful/AI/agent-skills/rules/machine-windows.md`

## When Blocked
Write `D:/Meaningful/AI/tip-calculator/briefs/BLOCKERS-frontend-engineer.md` with what you need and why (a contract gap, a missing dependency, a shared type), then continue with everything that is not blocked. A new type you need goes in `app/src/types.local.ts` (the orchestrator merges it at integration). Never edit a forbidden path to unblock yourself, never install, never guess a contract rule: the contract wins over the design doc where they differ.

## Verification Within Your Lane
`npm run typecheck`, `npm test` and `npm run build` must exit 0 before you hand back; never mark work done if it does not type-check. The tests cover the pure modules: at least every golden case in api-contract § Golden Cases plus the property grid. Rendering and the browser journey are the orchestrator's pass: say "render/browser: not verified; orchestrator pass" in your hand-back.

## Git
Do not commit, stage, stash or switch branches. The orchestrator commits at the integration checkpoint.

## Hand-Back (structured output; the script validates these exact fields)
- `role`: "frontend-engineer"
- `criteriaCovered`: the criterion numbers you implemented and tested, as strings (for example "1", "2")
- `criteriaNotCovered`: numbers not covered, each followed by one line why (for example "8: contrast not measured in a browser")
- `filesTouched`: every file you created or edited
- `commandsRun`: `[{ "command": "npm run typecheck", "exitCode": 0 }, …]` for typecheck, tests and build
- `blockers`: [] or the first line of each blocker you wrote
- `deviations`: deviations from the design doc or the contract, each one line; put your one gotcha line last, prefixed "gotcha:" (or "gotcha: none")
