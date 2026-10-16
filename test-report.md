# Test Report: Tip Calculator

QA Engineer, 2026-10-16. Scope: the FULL verification row at app completion, against PRD.md criteria 1 to 12. No browser, no server started, no dependency install, no product file edited. Everything below was observed in this run unless marked as a gap.

## Result Summary

- Commands: `npm run typecheck` exit 0 · `npm test` exit 0 (8 files, 324 tests passed: 273 engineer + 51 QA, one of the 51 is an expected-failure marker, see Failure 1) · `npm run build` exit 0 · `npm run size` exit 0.
- `Bundle size: 248179 bytes raw, 77759 bytes gzip (3 files in dist/)` (a success metric, measured, no target).
- Criteria: 1, 2, 3, 5, 6, 9, 10, 12 pass on everything testable without a browser; 11 passes its pre-deploy part (live part not testable before the deploy gate); 7 and 8 have only their non-browser parts checked (not claimed as passes); **4 fails on one point** (the refusal message gives no reason).

## Failures

1. **AC4: the over-15-digit People refusal states no reason.** PRD AC4: values beyond exact integer precision "are refused with a plain message, a technical limit with its reason, not a product cap."
   - Repro: `fieldMessages(evaluate({ bill: '5', tip: '20', people: '1000000000000000' }).parsed).people` (or type 1000000000000000 in People).
   - Observed: `{ tone: 'error', text: 'Enter a smaller number of people' }`. It is plain, but it names neither the limit (15 digits) nor why (exact whole-number arithmetic). It reads as a request to pick a smaller number, not as a technical limit with its reason.
   - Source: `app/src/lib/messages.ts` (`peopleMessage`, case `tooLarge`); the string is frozen in api-contract.md § Error Shapes (row "People | tooLarge"), so the contract itself under-delivers the PRD wording. Same shape for Bill `tooLarge` ("Enter a bill under $1 billion": states a bound, no reason; the PRD reason requirement names only People).
   - QA marker: `src/qa/golden.qa.test.ts`, test "AC4 FINDING: the over-15-digit refusal states its technical reason" is written with `it.fails`, so the suite is green while the defect stands. When the copy is fixed that test will fail and must be flipped to a normal `it`.

No other failure was observed.

## Acceptance Criteria

| # | Tested | Result | Evidence |
|---|---|---|---|
| 1 | Logic and code; not rendered | Pass (render is a gap) | `golden.qa.test.ts` "AC1": empty bill gives `incomplete`, no result object, prompt "Enter the bill to see each person’s share.", `announcement` null. `ResultsCard.tsx` renders `—` plus visually hidden "Not calculated yet" whenever `evaluation.status !== 'ready'`; labels Bill, Tip, People (`htmlFor` bound) and Tip Amount, Total, Each Person Pays present (static test). A real `0` bill is a ready `$0.00` result by contract (tested). Never seen on screen. |
| 2 | Logic and code | Pass | 12 golden split rows pass exactly (tip, total, share, collected, overage, kind, status text); BigInt reference check over more than 100,000 random and boundary triples (incl. max bill, 100%, 999999999999999 people) matches; `formatMoney` equals integer-math output for every cent 0..250000, the extremes and 200,000 random values. Each field's `onChange` calls `setField` directly (no submit handler dependency); static test finds no `type="submit"`; `<form noValidate onSubmit=preventDefault>`. |
| 3 | Logic and code | Pass | Picks `[1500,1800,2000,2500]`; custom field `parseTip` accepts 0 to 100 (`100.00` valid, `100.5`, `-0.01`, `101` invalid); `pressedPick` rows; `stepTip` rows; picks have `aria-pressed`. Pick clicks not exercised in a browser. |
| 4 | Logic and code | **Fail** (one point) | Whole number of 1 or more: `0`, `00`, `-2`, `2.5`, `4.0`, `two`, `1,000`, `-0`, `1e3`, `0x10`, `NaN`, `Infinity`, `١٢` all refused as `notWhole`; `999999999999999` valid, `1000000000000000` and `9007199254740993` and a 100,000-digit string refused as `tooLarge`, no throw. The refusal exists and is plain, but the message has no reason (Failure 1). |
| 5 | Logic | Pass | 20,050 combinations (people 1..50 x totals 0..400 cents): whenever shares x people differ from the total, the status line AND the screen-reader announcement contain the exact `formatOverage(diff) over the Total`; when equal, neither says "over the Total". Golden rows include 2¢, 1¢, $1.25. |
| 6 | Logic and code; not rendered | Pass (render is a gap) | Negative, letters, zero people, 40 nasty strings (`-0`, `1e3`, non-ASCII digits, full-width digits, `Infinity`, `NaN`, `0x10`, emoji, `<script>`, 100,000-digit strings, `%%`, NUL, non-string values) crossed over all three fields (about 15,000 combinations): never throws, no `NaN`/`Infinity`/`undefined`/`null`/negative money in any message, status or announcement, no result unless all three fields are valid. Message copy per field matches the contract. Inputs carry `aria-invalid`, `aria-describedby`, and a reserved message line (static). |
| 7 | Theme logic and code only | Not proven | `resolveTheme`, `readStoredTheme` (null storage, throwing `getItem`, junk value) and `writeStoredTheme` (namespaced key `tip-calculator.theme.v1`, throwing `setItem` swallowed) pass. Built `dist/index.html` has the theme script before the bundle, same key, `prefers-color-scheme` fallback. Toggle: `aria-pressed` segments. Cannot assert follows-system default, toggle override, persistence across reload or the absence of a wrong-theme flash without a browser: gap. |
| 8 | Contrast arithmetic and static only | Not proven | Computed WCAG ratios from the CSS tokens (script in scratchpad): light ink 14.9/13.7, muted 6.3/5.7, faint 5.3/4.9, danger 6.6/6.0, good 5.3, on-accent 5.4; dark ink 13.8/15.6, muted 7.2/8.1, faint 5.2/5.9, danger 6.9/7.8, on-accent 9.4; all at or above 4.5; control borders 3.7/3.4 light, 3.3/3.7 dark (3.0 needed). That is token pairs, not rendered text. `:focus-visible` rule exists with a 3px outline, no bare `outline: none`. Every input has a `<label htmlFor>`. 360px no horizontal scroll, keyboard path, visible focus on screen: gap. |
| 9 | Logic and code | Pass | Every row of the contract's `parseHash`/`serializeHash` tables, `#bill=0`, `#people=1`, repeated keys (first wins), `%E0%A4%A` malformed escape, `__proto__`, 100,000-char values, 10,000 ampersands: never throws, bad fields fall back per field, and no field message tone is `error` on load. Round trip holds. `buildShareUrl` keeps path and query. Code (static): hydrate in `useState` initializer, `replaceState` (no `pushState` anywhere), 150 ms delay, `hashchange` listener. Real address-bar behaviour not observed. |
| 10 | Yes | Pass | `npm run typecheck`, `npm test`, `npm run build` all exit 0 (output quoted in Commands). Engineer suites cover calc, format, messages, theme, urlState, contract (273 tests); QA suites add 51. |
| 11 | Pre-deploy part only | Pass for what exists; live part not testable before the deploy gate | `.github/workflows/deploy.yml`: triggers on push to `main` (and manual), `npm ci`, `npm test` before `npm run build`, uploads `app/dist`, `deploy-pages@v4`, `contents: read`, no `secrets.` reference. `app/index.html` has `<meta name="build-commit" content="__BUILD_COMMIT__" />` right after the title; built `app/dist/index.html` has `content="local"`; `vite.config.ts` fills it from `GITHUB_SHA`. Assets are `./assets/…`, both files exist. URLs found in the bundle, all classified: `http://www.w3.org/…` (XML namespaces, 4 kinds, not fetched), `https://ai.xuseak.com/` (the footer link), `https://react.dev/errors/` (React's error-message string, not fetched); `dist/index.html` has an `http://www.w3.org/2000/svg` namespace inside the data-URI favicon. No `/@vite/client`, no `localhost`, no analytics or cookie or sessionStorage or IndexedDB in source, no backend call in app code. Not tested: HTTP 200 at the live URL, the live build-commit equalling the pushed SHA, the public repo, the Actions run. |
| 12 | Static | Pass | `<title>Tip Calculator</title>` in the built page; `<h1>Tip Calculator</h1>`; footer "A project by XuSeak"; label strings Title Case (Bill, Tip, People, Tip Amount, Total, Each Person Pays, Copy Link, Link Copied, Fewer People, More People, Tip Quick Picks, Light, Dark) found in components. |

## Tests Written

Both under `D:/Meaningful/AI/tip-calculator/app/src/qa/` (Vitest, node environment, picked up by `src/**/*.test.ts`):

- `golden.qa.test.ts` (41 tests): contract golden cases for split, parse, evaluate, steps, pick, format, theme and URL; property grid people 1..50 x totals 0..2000; BigInt reference oracle; max bounds; the five `RangeError` rows plus five more; adversarial string sweep; non-string input; zero people; hash edge cases; AC5 never-silent sweep; the AC4 `it.fails` marker.
- `static.qa.test.ts` (10 tests): reads source, `dist/` and the workflow for the contract's runtime rules and the pre-deploy checks. These prove the rule is in the code, not that a browser behaves that way.

Two of my first-run tests failed because my own checks were wrong (a regex matched a CSS comment; `useTheme` legitimately touches `localStorage` twice, and a 5 s default timeout was too short for the 100,000-case grid). I fixed the tests, not the product; final run is green.

## Coverage Gaps and Not Tested

- **Browser journey: not run.** Rendering of any state, placeholders on screen, results updating as you type, pick presses, steppers, Copy Link and the clipboard failure path, field error display.
- **Theme (AC7):** follow-system default, toggle override, persistence across reload, no wrong-theme flash on load, live system-theme change.
- **Accessibility (AC8):** 360px layout and no horizontal scroll, keyboard path and visible focus ring, rendered contrast (only token arithmetic done), screen-reader announcements and the 700 ms debounce, forced-colors mode, hover states.
- **URL behaviour in a real address bar:** `replaceState` landing, the 150 ms timing, `hashchange` on a pasted link, Copy Link inside the 150 ms window, autofocus on fine-pointer devices only.
- **Console:** whether the page logs errors or warnings.
- **Criterion 11 live part:** the live URL, build-commit equal to the pushed SHA, the public repository `xzhou110/tip-calculator`, the Actions run, assets returning 200. Not testable before the deploy gate.
- **Component logic with DOM** (the `useSelectOnFocus`, `blurOnEnter`, Fewer People focus move): no jsdom installed; read only.
- **`.git` status:** the folder has a `.git` directory but I did not inspect or touch it.

Gotcha: `api-contract.md` freezes the People `tooLarge` string "Enter a smaller number of people", so fixing Failure 1 needs a contract change routed through the orchestrator (plus the engineer's `messages.test.ts`), not just a copy edit.
