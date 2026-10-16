# Agent Brief: frontend-engineer · fix round (nine exact fixes from QA and review)

You are the Frontend Engineer of a /build run, back for the fix round after QA and the Reviewer. A cold agent receives nothing else from the conversation: every section below stands on its own. Read every section before your first edit. Your role file is `D:/Meaningful/AI/claude-marketplace/plugins/multi-agent-orchestrator/agents/frontend-engineer.md`; this brief adds the project specifics.

## Goal
Land the nine fixes below in the Tip Calculator (`D:/Meaningful/AI/tip-calculator/app`), each small and exact, with their tests, and nothing else. The contract (`api-contract.md`) was amended by the orchestrator today for three of them (R-1, R-4, R-5) and for the people-limit message; build against the amended text. QA's suites under `app/src/qa/` run with `npm test` and must pass when you are done (the orchestrator already flipped QA's AC4 expected-failure marker, so that test passes only once the message is fixed).

## Acceptance Criteria You Own
Copied verbatim from PRD.md; these are the criteria the fixes touch.
2. Results update as you type with no submit button; tip = bill × percent ÷ 100, total = bill + tip, share = total ÷ people, each shown to the cent.
4. People is a whole number of 1 or more; values beyond exact integer precision (more than 15 digits) are refused with a plain message, a technical limit with its reason, not a product cap.
6. Invalid or empty input (negative, letters, zero people) shows a short plain message by the field; results never show NaN, Infinity or a negative value.
8. Works at 360px wide with no horizontal scroll; every input has a label; keyboard-operable with visible focus; text meets WCAG AA contrast in both themes.
9. The three inputs live in the URL so a link reproduces the split; a link with bad values falls back to defaults without an error.
10. The pure calculation module has unit tests (happy path, rounding, invalid input); typecheck, tests and production build all exit 0.

## The Fixes (the exact input; `review-findings.md` has the full text of each R-n)
- **F-1 (R-1, medium)** `app/src/lib/calc.ts:18`: replace `NUMBER` with the linear form `/^(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/` (same language; the old form backtracks quadratically). Add a timing regression test in `calc.test.ts`: `parseBill('1'.repeat(100000) + 'x')` is `malformed` and returns in under 50 ms.
- **F-2 (R-5, contract amended)** `parseBill` step 1 now reads: remove whitespace; drop one leading `$`; if the string contains `,` it must match `/^[0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]*)?$/`, otherwise invalid `malformed`; then remove the commas. New golden rows (api-contract § Golden Cases): `'1,000.5'` → 100050, `'$12,345,678.90'` → 1234567890, and `'86,40'`, `'1,00'`, `'12,345,67'`, `',5'`, `'1,,000'`, `'1234,567'` → malformed. `'$1,234.56'` → 123456 is unchanged. Update `calc.test.ts` and `goldenCases.testdata.ts`.
- **F-3 (QA AC4, contract amended)** `app/src/lib/messages.ts:63`: the People `tooLarge` message is now `Enter a smaller number of people, up to 15 digits`; update `messages.test.ts:54`. QA's test at `app/src/qa/golden.qa.test.ts` (around line 249) expects the text to match `/exact|precision|digit|accurate|reliabl|too many/i`; do not edit that file.
- **F-4 (R-4, contract amended)** `app/src/lib/urlState.ts` `parseHash`: a decoded value that contains any whitespace (`/\s/`, including the space `URLSearchParams` makes from a literal `+`) is invalid and falls back to that field's default. New rows: `'#bill=86+40&people=4'` → `{ bill: '', tip: '20', people: '4' }`; `'#tip=+5&people=4'` → `{ bill: '', tip: '20', people: '4' }`. Add them to `urlState.test.ts`.
- **F-5 (R-13)** `app/src/lib/urlState.ts:29`: remove the unreachable `try`/`catch` and the `params === null` branch (`new URLSearchParams(string)` cannot throw). Keep or drop the `String(raw)` guards in `calc.ts`, and say which in a one-line comment.
- **F-6 (R-2)** `app/src/styles.css:458`: the generic hover rule `.btn:not(:disabled):not([aria-pressed="true"]):hover` beats the `.copy[data-state="copied"]:hover` override, so "Link Copied" on hover shows `--good` on `--track` at 4.42:1. Add `:not([data-state="copied"])` to the generic selector (or raise the override to `.btn.copy[data-state="copied"]:hover`) so the copied label keeps `--surface` behind it.
- **F-7 (R-3)** `app/src/components/CopyLinkButton.tsx` `copy()`: clear `revertTimer` at the start of `copy()` (or in the `catch` before `setState('failed')`), so a success timer from an earlier press cannot replace the failure line with the helper text.
- **F-8 (R-8, measured by the orchestrator)** at 360px the Tip field is 85px wide inside (padding 6px left, 28px right, 20px font) and `100.00` needs 94px, so the leading digit hides. Make the field hold six characters at 360px: reduce the right padding to about 1rem, or let the field's flex basis grow, keeping the `%` suffix visible and the row within 360px with no horizontal scroll. The orchestrator re-measures in the browser.
- **F-9 (R-10)** `app/src/components/inputBehavior.ts` `arrowStep`: return `null` when `event.nativeEvent.isComposing` is true, like `blurOnEnter` already does.

Not in this round (carried forward in STATE.md; do not change): R-6, R-7, R-9, R-11, R-12, R-14.

## Lane
- **Owned paths (edit freely):** `D:/Meaningful/AI/tip-calculator/app/src/**` and `app/public/**`, except the frozen files and QA's folder below.
- **Read-only paths:** `app/src/qa/**` (QA's suites), `PRD.md`, `api-contract.md` (amended today; read § Pure-Logic Module Signatures, § URL-State Contract, § Error Shapes the UI Renders, § Golden Cases), `design-doc.md`, `tech-plan.md`, `review-findings.md`, `test-report.md`, `DECISIONS.md` (D-007), `app/index.html`.
- **Forbidden (never edit):** `app/package.json`, `app/package-lock.json`, `app/tsconfig.json`, `app/vite.config.ts`, `app/index.html`, `app/src/types.ts`, `app/src/constants.ts`, `app/src/contract.test.ts`, `app/src/qa/**`, `app/scripts/report-bundle-size.mjs`, `.github/workflows/deploy.yml`, `.gitignore`, and every record file at the project root.
- **Never run a dependency install.**

## Commands and Shell
- Shell: the Bash tool (Git Bash) or Windows PowerShell 5.1 (no `&&`; use `;`). Read `D:/Meaningful/AI/agent-skills/rules/machine-windows.md` first: file edits with the edit tool, never shell one-liners; UTF-8 without a BOM; `py` not `python`.
- Work in `D:/Meaningful/AI/tip-calculator/app`: `npm run typecheck` · `npm test` (Vitest, node environment; QA's suites included) · `npm run build`. No dev or preview server.

## Stack Facts
Unchanged from the first lane: React 19, Vite 7 (`base: './'`), TypeScript 5.9 strict, Vitest 3.2 in node; money as integer cents, tip as basis points; theme key `tip-calculator.theme.v1`; URL state in the hash; copy strings verbatim from the contract (typographic apostrophe, ×, ¢). The repository's current commit is the integration checkpoint 2d661a0; the scaffold is 51c789d.

## Inputs (read first, in this order)
1. `D:/Meaningful/AI/tip-calculator/review-findings.md` (R-1 to R-14, with locations and suggested fixes)
2. `D:/Meaningful/AI/tip-calculator/api-contract.md` (amended today; the rules you implement)
3. `D:/Meaningful/AI/tip-calculator/test-report.md` (QA's AC4 failure and how it tested)
4. `D:/Meaningful/AI/tip-calculator/DECISIONS.md` D-007
5. The code under `D:/Meaningful/AI/tip-calculator/app/src/`

## When Blocked
Write `D:/Meaningful/AI/tip-calculator/briefs/BLOCKERS-frontend-engineer.md` with what you need and why, then continue with everything that is not blocked. Never edit a forbidden path to unblock yourself.

## Verification Within Your Lane
`npm run typecheck`, `npm test` and `npm run build` must exit 0 before you hand back, with QA's suites passing. Rendering and the 360px measurement are the orchestrator's pass: say "render/browser: not verified; orchestrator pass".

## Git
Do not commit, stage, stash or switch branches.

## Hand-Back (structured output; the script validates these exact fields)
- `role`: "frontend-engineer"
- `criteriaCovered`: the criterion numbers above whose fixes you landed and tested, as strings
- `criteriaNotCovered`: numbers not covered, each with one line why
- `filesTouched`: every file you created or edited
- `commandsRun`: `[{ "command": "npm run typecheck", "exitCode": 0 }, …]`
- `blockers`: [] or the first line of each blocker you wrote
- `deviations`: one line per fix F-1 to F-9 saying "F-n: done" or what differs and why; your one gotcha line last, prefixed "gotcha:" (or "gotcha: none")
