# Review Findings: Tip Calculator (Frontend Lane)

Code Reviewer, 2026-10-16. Scope: everything under `app/src/` that differs from scaffold `51c789d9523e5f4f043b1e8510f9ce59063543a1` (26 files, commit `2d661a0`), read in full, against `api-contract.md`, `PRD.md`, `design-doc.md` revision 3 and `tech-plan.md`. `test-report.md` was read once it appeared; QA's untracked `app/src/qa/` tests are QA's, not reviewed as product code.

## What Was Checked, With Evidence

- **Frozen files:** `git diff 51c789d -- app/index.html app/vite.config.ts app/src/types.ts app/src/constants.ts app/src/contract.test.ts app/package.json app/tsconfig.json` is empty; `app/scripts/report-bundle-size.mjs` and `.github/workflows/deploy.yml` are also unchanged. No frozen-file finding.
- **Commands (in `app/`):** `npm run typecheck` exit 0 · `npm test` exit 0 on the final run (324 tests, including QA's 51; an earlier run hit QA's then-unfixed tests, since repaired by QA) · `npm run build` exit 0 (JS 239.14 kB / 74.82 kB gzip).
- **Money math (probe scripts in the reviewer's scratchpad, importing the `.ts` modules directly):** parse rules applied in the stated order; tip `(n - n % 10000) / 10000` half up; share rounded up; `collected = total + overage = share × people`; overage `0..people-1`; no `Math.round`, `toFixed`, `parseFloat`, `Math.floor` or `Math.ceil` anywhere in `app/src`. At the bounds (`999999999.99`, `100`, `999999999999999`) every value is a safe integer; `formatMoney` matched a BigInt oracle on 200,000 random amounts up to the largest reachable `collectedCents` (1,000,199,999,999,996), with 0 mismatches. All 27 combinations of valid/empty/invalid across the three fields produce the contract's status line verbatim; copy strings carry U+2019, U+00D7 and U+00A2.
- **Hooks:** `useSplitState` hydrates once in the `useState` initializer, writes with `replaceState(history.state, …)` after 150 ms, skips a no-op write, wraps it in `try`/`catch`, clears its timer, adds and removes one `hashchange` listener (StrictMode-safe), and `shareUrl()` flushes the pending write. `useTheme` follows `prefers-color-scheme` only while nothing is stored and stops after a choice; it removes its `matchMedia` listener. Clipboard, storage and `replaceState` failures are all caught; there is no `console.*` call in `app/src`.
- **Security and privacy:** no `fetch`, XHR, `sendBeacon`, cookie, sessionStorage, IndexedDB, `eval`, `new Function`, `innerHTML` or `dangerouslySetInnerHTML`; the built bundle's only `https://` strings are XML namespace constants, React's error-text URL and the footer link; the favicon is a `data:` URI; the footer link has `rel="noopener noreferrer"`; localStorage holds only `tip-calculator.theme.v1`; the inputs live only in the fragment. A pattern scan of every tracked file found no phone-number, street-address, token or key values.
- **Accessibility and design:** labels with `htmlFor`, `aria-describedby` on every input, `aria-invalid` only for the `error` tone, `aria-pressed` on picks and theme segments, one `role="status"` region updated 700 ms after a change, `type="text"` with `inputmode`, reserved message lines, the results card before the inputs in the DOM with no CSS `order`, `:focus-visible` with a 3px ring, the `prefers-reduced-motion` rule, Title Case labels.

## Findings

### R-1 · Quadratic Regex Backtracking: a Crafted Share Link Freezes the Tab (ReDoS)
- **Location:** `app/src/lib/calc.ts:18` (the `NUMBER` regex, used at `:40`, `:52`, `:66`); reached from `app/src/lib/urlState.ts:31` → `parseHash` during the first render (`app/src/state/useSplitState.ts:45`) and on every `hashchange` (`:72`).
- **Description:** `/^(?:[0-9]+\.?[0-9]*|\.[0-9]+)$/` lets `[0-9]+` and `[0-9]*` share the same digits because `\.?` is optional. On a long run of digits followed by any non-matching character, V8 backtracks in O(n²). Measured in Node 24 (same V8 as Chrome): `parseBill('1'.repeat(n) + 'x')` takes 24 ms at n = 10,000, 211 ms at 30,000 and 836 ms at 60,000; `parseHash('#bill=<that>&tip=<that>&people=4')` takes 1.8 s at 60,000. Because hydration runs synchronously before first paint, a link such as `…/tip-calculator/#bill=111…1x` shows a blank, frozen page, and every reload repeats it. Browsers accept URLs of up to about 2 MB, which extrapolates to minutes. The `-` branch (`isNumberOrBare`) has the same cost. A user pasting a huge string into Bill or Tip hits it on every keystroke. QA's 100,000-digit sweeps used all-digit strings, which match in linear time, so they could not see this.
- **Severity:** medium · **Confidence:** high (reproduced)
- **Suggested fix:** Use the equivalent linear form `/^(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/`. The reviewer checked it against the current regex on all 2,396,745 strings of length 0 to 7 over `0 1 9 . x - $ space`: 0 differences, and a 1,000,000-character non-match takes 0.8 ms. Add a regression test that parses `'1'.repeat(100000) + 'x'` in Bill and Tip, and through `parseHash`, under a time bound (for example 50 ms). Have the orchestrator note the equivalent form beside the contract's `NUMBER` definition so QA and future lanes use it.
- **Owning lane:** frontend-engineer (the contract note: orchestrator)

### R-2 · "Link Copied" Drops Below AA on Hover; Its Override Rule Is Dead CSS
- **Location:** `app/src/styles.css:469` (loses to `app/src/styles.css:458`)
- **Description:** `.copy[data-state="copied"]:hover` has specificity (0,3,0). The earlier `.btn:not(:disabled):not([aria-pressed="true"]):hover` has (0,4,0), because each `:not()` counts as its argument, and it matches the copy button too, which has no `aria-pressed`. The override never applies, so hovering "Link Copied" paints `--good` #1e7b3a on `--track` #e8ebe6, a contrast of **4.42:1**, below the 4.5:1 AA minimum for 16px weight-600 text (AC8). The rule's own comment says it exists to prevent exactly this. Dark mode is fine at 7.78:1.
- **Severity:** low · **Confidence:** high (cascade read in the code path; ratio computed with the WCAG formula; not rendered)
- **Suggested fix:** Exclude the copied state in the generic rule: `.btn:not(:disabled):not([aria-pressed="true"]):not([data-state="copied"]):hover`. Alternatively, raise the override to `.btn.copy[data-state="copied"]:hover` (an equal (0,4,0) that wins by source order).
- **Owning lane:** frontend-engineer

### R-3 · A Copy Failure Shortly After a Success Is Hidden by the Old Revert Timer
- **Location:** `app/src/components/CopyLinkButton.tsx:48` (the `catch` path; the timer is set at `:56`)
- **Description:** After a successful copy, a 2 s timer resets the state to `idle`. A second press within those 2 s that fails (for example, a rejected `writeText` because the document lost focus or permission was revoked) sets `failed` but leaves the timer running. When it fires, the timer swaps the danger line "Couldn’t copy. Copy the link from the address bar." back to the helper, so the user loses the instruction.
- **Severity:** low · **Confidence:** high (read in the code path)
- **Suggested fix:** Clear `revertTimer` at the top of `copy()`, or in the `catch` before `setState('failed')`.
- **Owning lane:** frontend-engineer

### R-4 · A "+" in a Hash Value Is Decoded as a Space, Then Silently Removed
- **Location:** `app/src/lib/urlState.ts:31` (`URLSearchParams` form decoding), combined with whitespace stripping at `app/src/lib/calc.ts:44` and `:60`
- **Description:** `#bill=86+40` loads Bill `8640` ($8,640.00) with no message. `#tip=+5` loads 5%, while typing `+5` in the field is `malformed`. Links built by `serializeHash` never contain `+`, so only hand-edited or tampered links are affected. The behavior follows the contract literally (form-urlencoded plus "every whitespace removed").
- **Severity:** low · **Confidence:** high (reproduced: `parseHash('#bill=86+40')` → `{ bill: '8640', … }`)
- **Suggested fix:** Contract decision: treat a decoded hash value that contains whitespace as invalid, so it falls back to the default. The alternative is to read the raw pair and reject a literal `+` before decoding. One added test row covers it.
- **Owning lane:** orchestrator (contract), then frontend-engineer

### R-5 · A Comma Decimal ("86,40") Becomes a 100× Bill With No Message
- **Location:** `app/src/lib/calc.ts:44`
- **Description:** parseBill step 1 removes every `,`, so `86,40` parses as 864000 cents ($8,640.00) and shows valid results with no message. On phones set to a comma-decimal region, `inputmode="decimal"` typically offers `,` as the only decimal key, so such a user cannot enter a decimal bill correctly. Tip `17,5` gets "Enter a tip from 0 to 100", which is the wrong reason. The PRD targets US-dollar users, and the large wrong total is visible, but the error stays silent (no message by the field).
- **Severity:** low · **Confidence:** medium (parse reproduced; the keypad behavior is platform knowledge, not observed here)
- **Suggested fix:** Contract decision: treat a comma as a thousands separator only when every group after it has exactly 3 digits; otherwise mark it `malformed`, or accept a final `,dd` as the decimal point when no `.` is present.
- **Owning lane:** orchestrator (contract)

### R-6 · Stepping From an Invalid Value Discards It
- **Location:** `app/src/lib/calc.ts:132` to `:143`
- **Description:** The contract treats an invalid value as 0 (Tip) or 1 (People) before a step. Observed: `stepTip('500', -1)` → `'0'`, `stepTip('17.555', 1)` → `'1'`, `stepPeople('2.5', 1)` → `'2'`, `stepPeople('1000000000000000', -1)` → `'1'`. A diner who over-types 500 and presses ArrowDown lands on 0% rather than 100%. The implementation is contract-correct.
- **Severity:** low · **Confidence:** high (reproduced)
- **Suggested fix:** Contract decision: clamp an `outOfRange` or `tooLarge` value to its bound before stepping, and truncate `tooManyDecimals` to two places. Otherwise keep the current behavior and record why.
- **Owning lane:** orchestrator (contract)

### R-7 · At Extreme Values the Status Line Outgrows Its Two Reserved Lines
- **Location:** `app/src/styles.css:256` (`min-height: 2.8em`), with the text from `app/src/lib/messages.ts` `statusLine`
- **Description:** At the bounds the rounded-up sentence is about 115 characters ("Rounded up to the cent: 999,999,999,999,999 × $0.01 = $9,999,999,999,999.99, $9,998,000,000,000.01 over the Total."). That needs 3 or more lines in the 294px card at 360px, so the card grows, against the design's "never changes height". A share of $0.01 appears whenever people exceeds the total in cents, so this only happens with absurd inputs.
- **Severity:** low · **Confidence:** medium (text reproduced, not rendered)
- **Suggested fix:** Accept it as a bound-only edge and say so in design-doc, or leave it as is. No code change recommended.
- **Owning lane:** orchestrator (design note)

### R-8 · The Tip Field May Clip Values Longer Than Five Characters at 360px
- **Location:** `app/src/styles.css:356` to `:360` and `:386` to `:388`
- **Description:** At 360px the tip box resolves to about 87px (the picks measure 54px, which matches the orchestrator's browser pass). After the border, 6px left padding and 28px right padding, about 51px remains for 20px weight-600 text. "100.00" (and "17.25" with wider SF digits on iOS) can overflow; a right-aligned input then scrolls its leading digits out of view.
- **Severity:** low · **Confidence:** low (arithmetic from the CSS; not rendered)
- **Suggested fix:** QA should check "17.25" and "100.00" at 360px on iOS and Android. If either clips, reduce the right padding to about 1.5rem or the left padding to 4px, or let the field grow its basis.
- **Owning lane:** frontend-engineer

### R-9 · Four Live Regions Make Screen Readers Chatty
- **Location:** `app/src/components/FieldMessageLine.tsx:11`
- **Description:** Each message slot is `aria-live="polite"`, as the design asks, alongside the page's one `role="status"`. The Tip helper sentence "Tap a pick or type any percent from 0 to 100." is announced again every time Tip recovers from an empty or invalid value. Some screen-reader and browser pairs also read a live slot that is an input's `aria-describedby` target twice.
- **Severity:** low · **Confidence:** low (not tested with NVDA or VoiceOver)
- **Suggested fix:** Keep `aria-live` for the `error` and `prompt` tones only (render `aria-live="off"` for `helper` and `none`). Verify the result with NVDA and VoiceOver before changing the design.
- **Owning lane:** orchestrator (design-doc § Accessibility Notes), then frontend-engineer

### R-10 · Arrow-Key Stepping Ignores IME Composition
- **Location:** `app/src/components/inputBehavior.ts:44`
- **Description:** `blurOnEnter` checks `nativeEvent.isComposing`, but `arrowStep` does not. During an active IME composition in the Tip or People field (for example Chinese Pinyin on a desktop), ArrowUp or ArrowDown selects a candidate, yet the handler calls `preventDefault` and steps the value.
- **Severity:** low · **Confidence:** low (not reproduced)
- **Suggested fix:** Return `null` from `arrowStep` when `event.nativeEvent.isComposing` is true.
- **Owning lane:** frontend-engineer

### R-11 · Select-on-Focus by Tap on iOS Safari Is Unproven
- **Location:** `app/src/components/inputBehavior.ts:19` to `:31`
- **Description:** iOS Safari often places its own caret after a tap-initiated focus, which overrides a selection made in the `focus` handler. The mouseup cancel also depends on emulated mouse events. If the selection does not hold, Flow 2 ("typing replaces it") breaks on the primary device. The engineer flagged this, and the orchestrator recorded it as a gap.
- **Severity:** low · **Confidence:** low
- **Suggested fix:** Verify it on an iPhone. If it fails, defer the selection (`requestAnimationFrame(() => input.setSelectionRange(0, input.value.length))`) in `onFocus`.
- **Owning lane:** frontend-engineer (verification: QA)

### R-12 · A Pending Result Announcement Can Overwrite "Link Copied."
- **Location:** `app/src/App.tsx:32`
- **Description:** If a field changes and Copy Link is pressed within 700 ms, the deferred split sentence replaces "Link copied." in the single atomic region. Depending on the screen reader, that can happen before it is spoken.
- **Severity:** low · **Confidence:** low
- **Suggested fix:** Optional: when `announceNow` runs, let the pending result announcement go out after it (for example, append it), or accept this edge.
- **Owning lane:** frontend-engineer

### R-13 · Dead Defensive Code (Simplification)
- **Location:** `app/src/lib/urlState.ts:29` to `:35`; `app/src/lib/calc.ts:44`, `:60`, `:77`; `app/src/state/useSplitState.ts:47`
- **Description:** `new URLSearchParams(string)` cannot throw, so the `try`/`catch` and the `params === null` branch in `parseHash` are unreachable. `String(raw)` wraps parameters that are already typed `string`. `useState` is used for a constant whose setter is discarded (harmless).
- **Severity:** low · **Confidence:** high
- **Suggested fix:** Drop the unreachable `try`/`catch` and the `null` branch. Keep or drop `String(raw)` as a deliberate guard for untyped callers, and say which in a comment. No change is needed for the `useState` constant.
- **Owning lane:** frontend-engineer

### R-14 · The Hook Runtime Rules Have No Automated Test
- **Location:** `app/src/state/useSplitState.ts:11` to `:18` and `:57` to `:87`; `app/src/state/useTheme.ts:132` to `:149`
- **Description:** Tests run in the node environment only (tech-plan Key decision 12), so a regression to `pushState`, a lost no-op skip, a missing flush in `shareUrl` or the theme continuing to follow the system after a choice would surface only in a manual browser pass. The pure modules are well covered; the URL-state runtime rules that QA tests against are not.
- **Severity:** low · **Confidence:** medium
- **Suggested fix:** Keep it small: export `writeUrl` with `location` and `history` passed in, and unit-test the no-op skip, `replaceState`-only and the swallowed throw with fakes in node. Do not add jsdom.
- **Owning lane:** frontend-engineer

## Counts
critical 0 · high 0 · medium 1 · low 13

## Verdict
**ship-with-fixes.** The must-fixes:
1. **R-1** `app/src/lib/calc.ts:18`: swap in the linear `NUMBER` regex and add the timed regression test (frontend-engineer).
2. **R-2** `app/src/styles.css:458`/`:469`: make the "Link Copied" hover override win (AC8) (frontend-engineer).

R-3, R-10 and R-13 are cheap and recommended. R-4, R-5, R-6 and R-9 are contract or design decisions for the orchestrator. R-7, R-8, R-11, R-12 and R-14 are verify-or-accept.

gotcha: QA's 100,000-digit sweeps used all-digit strings, which `NUMBER` matches in linear time; the quadratic path needs a trailing non-matching character (`'1'.repeat(60000) + 'x'`), so a green adversarial sweep does not rule R-1 out.
