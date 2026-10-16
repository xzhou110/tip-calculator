# Agent Brief: qa-tester · acceptance tests against PRD.md

You are the QA Engineer of a /build run at the FULL verification row (a new product at app completion). A cold agent receives nothing else from the conversation: every section below stands on its own. Read every section before you start. Your role file is `D:/Meaningful/AI/claude-marketplace/plugins/multi-agent-orchestrator/agents/qa-tester.md`; this brief adds the project specifics.

## Goal
Prove, with observed output, whether the Tip Calculator in `D:/Meaningful/AI/tip-calculator/app` behaves as PRD.md says. Derive test cases from the acceptance criteria, write real tests, run them, capture real output, and write `D:/Meaningful/AI/tip-calculator/test-report.md`. Test the unhappy paths (bad input, empty states, rounding edges, bad links), not only the golden path. You have no browser: anything that needs one (rendering, focus, contrast, layout at 360px, the no-flash theme load, the console) is a named gap for the orchestrator's browser pass, never a pass.

## Acceptance Criteria You Test
Copied verbatim from PRD.md. Report each as tested or not, passed or failed, with a note.
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

Criterion 11 is not deployed yet (the first publication waits for the owner's yes): test what exists before a deploy (the workflow file, the build-commit placeholder in `app/index.html` and its `local` stamp in `app/dist/index.html`, relative asset URLs in the built page, no external URL in the bundle) and mark the live part "not testable before the deploy gate".

## What to Test and How
- **The pure modules** (`app/src/lib/*.ts`) through Vitest in the node environment: write your own tests under `app/src/qa/*.test.ts` (Vitest picks up `src/**/*.test.ts`), independent of the engineer's suites. Cover every row of api-contract.md § Golden Cases (split, parse, evaluate, steps, format, theme), the property grid, the `RangeError` preconditions, and your own adversarial inputs: `-0`, `1e3`, `١٢` (non-ASCII digits), `Infinity`, `NaN`, `0x10`, very long strings, a hash with repeated keys, malformed percent-escapes, `#bill=0`, `#people=1`.
- **The components and hooks** (`app/src/components/*.tsx`, `app/src/state/*.ts`) by reading them against design-doc.md and the contract's runtime rules (hydrate once, `replaceState` not `pushState`, 150 ms quiet period, `hashchange` listener, `type="text"` with `inputmode`, `aria-describedby`, `aria-invalid`, `aria-pressed`, `role="status"`, labels, the reserved message lines, Title Case). Report what the code does and does not do; do not claim a rendered behaviour you did not observe.
- **The commands:** in `D:/Meaningful/AI/tip-calculator/app` run `npm run typecheck`, `npm test`, `npm run build`, then `npm run size`; record exit codes and quote the `Bundle size:` line in the report (a PRD success metric: measured, no target).
- **Pre-deploy checks from `web-ship-check`** that need no browser: tests green, build green, `app/dist/index.html` has the title, the theme script and the `build-commit` meta with `local`, assets referenced relatively (`./assets/…`), the bundle has no `http://` or `https://` fetch targets, no `/@vite/client`, no `localhost`; classify every URL you find.
- **Scope discipline** (qa-sweep § Rules to Give Every Agent): test only this product's criteria and unhappy paths; do not mirror the implementation; no coverage target; never start or stop a server; never modify product code or shared config (a failing test is a finding, not a fix); scripts you need go in your scratchpad or `app/src/qa/`, never elsewhere in the repo.

## Lane
- **Owned paths (edit freely):** `D:/Meaningful/AI/tip-calculator/test-report.md`, `D:/Meaningful/AI/tip-calculator/app/src/qa/**`
- **Read-only paths:** everything else under `D:/Meaningful/AI/tip-calculator/`
- **Forbidden (never edit):** `app/package.json`, `app/package-lock.json`, `app/tsconfig.json`, `app/vite.config.ts`, `app/index.html`, `app/src/types.ts`, `app/src/constants.ts`, `app/src/contract.test.ts`, every file under `app/src/lib/`, `app/src/state/`, `app/src/components/`, `app/src/App.tsx`, `app/src/main.tsx`, `app/src/styles.css`, and the records (`PRD.md`, `design-doc.md`, `tech-plan.md`, `api-contract.md`, `PROJECT.md`, `DECISIONS.md`, `STATE.md`, `RUN_LOG.md`, `briefs/**` except your own BLOCKERS file).
- **Never run a dependency install.**

## Commands and Shell
Shell: the Bash tool (Git Bash) or Windows PowerShell 5.1 (no `&&`; use `;`). Read `D:/Meaningful/AI/agent-skills/rules/machine-windows.md` first (file edits with the edit tool, UTF-8 without a BOM, `py` not `python`, never `node -e` with backticks). Work in `D:/Meaningful/AI/tip-calculator/app`: `npm run typecheck` · `npm test` · `npm run build` · `npm run size`. No dev server, no preview server.

## Stack Facts
Vite 7 + React 19 + TypeScript 5.9, Vitest 3.2 in the node environment (no jsdom installed, so DOM rendering cannot be tested here). Money is integer cents and the tip percent integer basis points. Theme key `tip-calculator.theme.v1`. URL state in the hash. The engineer's tests live beside the modules (`app/src/lib/*.test.ts`); yours under `app/src/qa/`.

## Inputs (read first, in this order)
1. `D:/Meaningful/AI/tip-calculator/PRD.md`
2. `D:/Meaningful/AI/tip-calculator/api-contract.md` (the golden cases and rules are your oracle)
3. `D:/Meaningful/AI/tip-calculator/design-doc.md` (revision 3: copy, states, accessibility notes)
4. `D:/Meaningful/AI/agent-skills/skills/qa-sweep/SKILL.md` § Rules to Give Every Agent and § Choose Verification by Risk and Scope
5. `D:/Meaningful/AI/agent-skills/skills/web-ship-check/SKILL.md` (the pre-deploy checks; run those that need no browser)
6. `D:/Meaningful/AI/tip-calculator/tech-plan.md` § Release Verification (what the live check will assert later) and § High-risk surfaces
7. The implemented code under `D:/Meaningful/AI/tip-calculator/app/src/`

## Output: `test-report.md`
For each criterion: tested or not, pass or fail, evidence (the test file and name, or the command and its output); the tests you wrote and where they live; every failure with exact repro steps and output; the `Bundle size:` line; coverage gaps and what could not be tested here (the browser items, criterion 11's live part), each named.

## When Blocked
Write `D:/Meaningful/AI/tip-calculator/briefs/BLOCKERS-qa-tester.md` with what you need and why, then continue with everything that is not blocked. A missing runner or a broken build is a finding, reported, not fixed.

## Git
Do not commit, stage, stash or switch branches.

## Hand-Back (structured output; the script validates these exact fields)
- `criteria`: one entry per PRD criterion 1 to 12: `{ "id": "1", "tested": true, "passed": true, "note": "…" }`
- `failures`: each failure in one line with its repro and observed output
- `gaps`: each untested item by name (the browser items, the live deploy, anything else)
- `reportPath`: "D:/Meaningful/AI/tip-calculator/test-report.md"
Say failures plainly with the output; never soften them. Put one gotcha line (or "gotcha: none") at the end of the report.
