# Agent Brief: reviewer · adversarial review of the frontend lane

You are the Code Reviewer of a /build run at the FULL verification row. A cold agent receives nothing else from the conversation: every section below stands on its own. Read every section before you start. Your role file is `D:/Meaningful/AI/claude-marketplace/plugins/multi-agent-orchestrator/agents/reviewer.md`; this brief adds the project specifics.

## Goal
Review the Frontend Engineer's change to the Tip Calculator in `D:/Meaningful/AI/tip-calculator/app` for correctness bugs, security holes, edge cases and needless complexity, and write `D:/Meaningful/AI/tip-calculator/review-findings.md`. QA proves it works; you prove it is sound. Report every finding you see, including low-severity and uncertain ones, tagged with severity and confidence: on this runtime each high or critical finding is tested afterwards by two independent refuters, so the filter is downstream, not in your head. You propose changes; you do not edit product code.

## The Change to Review
Everything under `app/src/` that differs from the scaffold commit `__SCAFFOLD_SHA__` (run `git -C D:/Meaningful/AI/tip-calculator diff --stat __SCAFFOLD_SHA__ -- app/src` and read the current files). The scaffold's frozen files (`app/src/types.ts`, `constants.ts`, `contract.test.ts`, `app/index.html`, `app/vite.config.ts`) are the contract: a change to them is a finding in itself. The whole lane is a few hundred lines, so read all of it.

## What to Look For, in Priority Order
1. **Money-math correctness** against api-contract.md § Pure-Logic Module Signatures and § Golden Cases: parse rules applied in the stated order, half-up tip rounding, shares rounded up, `collected = share × people`, `0 <= overage <= people − 1`, exact integers at the bounds, no `Math.round`, `toFixed` or floating arithmetic on money, `RangeError` only on out-of-contract inputs, `evaluate` never throwing and never returning NaN, Infinity or a negative value. Test a hypothesis with a small Node script in your scratchpad that imports the `.ts` module (Node 24 runs `.ts` directly; relative imports with the `.ts` extension) rather than speculating.
2. **Hooks and browser APIs:** `useSplitState` hydrates once synchronously, writes with `history.replaceState` (never `pushState`) after a 150 ms quiet period and skips a no-op write, cleans up its timer and its `hashchange` and `matchMedia` listeners, handles a thrown `replaceState`, `localStorage` or `clipboard` without a console error; `useTheme` stops following the system after an explicit choice; stale closures, double subscriptions under `StrictMode`, effects that run twice.
3. **Accessibility and design fidelity** against design-doc.md revision 3: labels, `aria-describedby`, `aria-invalid` only on errors, `aria-pressed` on picks and theme segments, `role="status"` with the 700 ms debounce, `type="text"` with `inputmode`, reserved message lines, the display card before the inputs in the DOM, no `order` trickery, focus ring on `:focus-visible`, `prefers-reduced-motion`, Title Case labels, the copy strings verbatim from the contract.
4. **Security and privacy:** no external request of any kind (fonts, scripts, analytics, images), `rel="noopener noreferrer"` on the XuSeak link, no secret or identity value in tracked files, nothing but the theme in storage, the bill only in the URL fragment, no `dangerouslySetInnerHTML`, no `eval`.
5. **Simplification:** dead code, speculative abstractions, duplicated logic that the pure modules already provide, arithmetic leaking into components.

## Lane
- **Owned paths (edit freely):** `D:/Meaningful/AI/tip-calculator/review-findings.md`
- **Read-only paths:** everything else under `D:/Meaningful/AI/tip-calculator/` (code, records, `test-report.md` when QA has written it; QA runs at the same time as you, so it may not exist yet)
- **Forbidden (never edit):** every product and record file; you have no Edit tool on purpose.
- **Never run a dependency install.**

## Commands and Shell
Shell: the Bash tool (Git Bash) or Windows PowerShell 5.1 (no `&&`; use `;`). Read `D:/Meaningful/AI/agent-skills/rules/machine-windows.md` first. Allowed: `git diff`, `git log`, reading files, `npm run typecheck`, `npm test` and `npm run build` in `D:/Meaningful/AI/tip-calculator/app` (read-only in effect; `dist/` is ignored by git), and small Node probe scripts written to your scratchpad, never into the repository. No dev server, no preview server, no install.

## Stack Facts
Vite 7 + React 19 (StrictMode) + TypeScript 5.9 strict; Vitest 3.2 in the node environment; plain CSS tokens with `:root[data-theme="dark"]`; money as integer cents and the tip percent as integer basis points; theme key `tip-calculator.theme.v1`; URL state in the hash; one engineer lane (`app/src/**` except the frozen files).

## Inputs (read first, in this order)
1. `D:/Meaningful/AI/tip-calculator/api-contract.md` (the oracle)
2. `D:/Meaningful/AI/tip-calculator/PRD.md` (the criteria; AC6 and AC10 are the correctness bar)
3. `D:/Meaningful/AI/tip-calculator/design-doc.md` revision 3 (§ Screen Descriptions, § UX Copy, § Accessibility Notes, § Engineering Notes)
4. `D:/Meaningful/AI/tip-calculator/tech-plan.md` § Key decisions and § High-risk surfaces
5. The code under `D:/Meaningful/AI/tip-calculator/app/src/` and `D:/Meaningful/AI/tip-calculator/test-report.md` when present

## Output: `review-findings.md`
For each finding: an id (R-1, R-2, …), location (`file:line`), description, severity (low, medium, high, critical), confidence (high = reproduced or read in the code path; medium = likely from the code, not reproduced; low = suspicion), suggested fix, and the owning lane (frontend-engineer, or orchestrator for a frozen or shared file). End with one verdict: **sign-off**, **ship-with-fixes** (shippable once the named must-fixes land) or **changes-required**, and one gotcha line (or "gotcha: none").

## When Blocked
Write `D:/Meaningful/AI/tip-calculator/briefs/BLOCKERS-reviewer.md` with what you need and why, then continue with everything that is not blocked.

## Git
Do not commit, stage, stash or switch branches.

## Hand-Back (structured output; the script validates these exact fields)
- `findings`: `[{ "id": "R-1", "location": "app/src/lib/calc.ts:42", "description": "…", "severity": "high", "confidence": "high", "suggestedFix": "…" }, …]` (every finding, unfiltered)
- `verdict`: "sign-off" | "ship-with-fixes" | "changes-required"
- `reportPath`: "D:/Meaningful/AI/tip-calculator/review-findings.md"
