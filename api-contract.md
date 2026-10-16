# API Contract: Tip Calculator

Tech Lead, 2026-10-15. This is a client-only product with **no HTTP endpoints, no server and no auth model**: nothing is requested from or sent to any server except the static files themselves. The contract between the shell, the pure logic and the UI is therefore:

- the frozen types
- the frozen constants
- the pure-logic module signatures, with their exact rules
- the storage contract (one versioned key, with a migration note)
- the URL-state contract
- the error shapes the UI renders
- the golden cases every test suite and QA uses
- the build stamp the release check reads

`tech-plan.md` holds the architecture and the scaffold. design-doc.md (revision 2) holds every visual decision and is the source of the copy strings quoted here. **Where the two differ, this contract wins.** There are two differences today:

- **The theme storage key:** design-doc.md names the template's `appTheme`, and this contract freezes `tip-calculator.theme.v1` (§ Storage Contract).
- **The name of the rounded-up state:** design-doc.md's prose calls it the "uneven split", and this contract names it `roundedUp`. Every person pays the same share, rounded up to the cent, and PRD Out excludes "uneven splits" (unequal shares), so the frozen name must not suggest that feature. Users see neither name; the copy says "Rounded up to the cent".

## Conventions

- **Units.** Money is **integer US cents** (`Cents`: 8640 is $86.40). The tip percent is **integer basis points**, hundredths of a percent (`BasisPoints`: 2000 is 20%, 1750 is 17.5%). People is a positive integer. No function in `app/src/lib/` uses a fractional number for money.
- **Integer division** is written `(n - (n % d)) / d`. It is exact for non-negative safe integers; `Math.round` and `toFixed` are never used on money.
- **Purity.** Every function under `app/src/lib/` is pure: no DOM, no React, no `window`, no I/O. Storage is passed in as a parameter (§ Theme).
- **Never throw on user input.** Every parse, evaluate, format, message and URL function accepts any string and returns a value. The single deliberate throw is `computeSplit`'s `RangeError` on out-of-contract arguments: a programming error that `evaluate` never triggers.
- **Text.** Copy strings use the typographic apostrophe ’ (U+2019), the multiplication sign × (U+00D7) and the cent sign ¢ (U+00A2). Source files are UTF-8 without a BOM; tests assert the exact code points.
- **Field order** is always Bill, Tip, People (`FIELD_ORDER`): in lists of fields, in messages and in the URL.

## Frozen Types

`app/src/types.ts`, scaffolded verbatim by the orchestrator. No lane edits it.

```ts
// FROZEN CONTRACT (api-contract.md). Do not edit in a build lane; route changes through the orchestrator.
// Units: money is integer US cents; the tip percent is integer basis points (hundredths of a percent).

/** The three inputs exactly as typed. This is the app's only input state. */
export interface FieldTexts {
  bill: string;
  tip: string;
  people: string;
}

export type FieldName = keyof FieldTexts;

/** Integer US cents, >= 0. 8640 means $86.40. */
export type Cents = number;

/** Tip percent in hundredths of a percent, integer 0..10000. 2000 means 20%, 1750 means 17.5%. */
export type BasisPoints = number;

export type BillProblem = 'malformed' | 'negative' | 'tooManyDecimals' | 'tooLarge';
export type TipProblem = 'malformed' | 'outOfRange' | 'tooManyDecimals';
export type PeopleProblem = 'notWhole' | 'tooLarge';

/** Result of reading one field. 'empty' means nothing entered (a prompt), never an error. */
export type ParseResult<T, P extends string> =
  | { readonly status: 'valid'; readonly value: T }
  | { readonly status: 'empty' }
  | { readonly status: 'invalid'; readonly problem: P };

export type BillParse = ParseResult<Cents, BillProblem>;
export type TipParse = ParseResult<BasisPoints, TipProblem>;
export type PeopleParse = ParseResult<number, PeopleProblem>;

export interface ParsedFields {
  readonly bill: BillParse;
  readonly tip: TipParse;
  readonly people: PeopleParse;
}

/** Valid, in-range inputs for computeSplit. */
export interface SplitInputs {
  readonly billCents: Cents;
  readonly tipBasisPoints: BasisPoints;
  readonly people: number;
}

/**
 * 'one': people is 1. 'even': the equal shares add up to the total exactly.
 * 'roundedUp': the equal share was rounded up to the cent, so the table overpays by overageCents.
 * Every kind is an equal split; unequal (itemized or uneven) splits are out of scope (PRD).
 */
export type SplitKind = 'one' | 'even' | 'roundedUp';

export interface SplitResult {
  /** bill x percent / 100, rounded half up to the cent. */
  readonly tipCents: Cents;
  /** billCents + tipCents (the displayed tip, so the screen always adds up). */
  readonly totalCents: Cents;
  /** totalCents / people, rounded UP to the cent. */
  readonly shareCents: Cents;
  /** shareCents x people: what the table actually collects. */
  readonly collectedCents: Cents;
  /** collectedCents - totalCents, always 0..people-1. Never negative: the table is never short. */
  readonly overageCents: Cents;
  readonly kind: SplitKind;
}

export type Evaluation =
  | {
      readonly status: 'ready';
      readonly parsed: ParsedFields;
      readonly inputs: SplitInputs;
      readonly result: SplitResult;
    }
  | {
      readonly status: 'incomplete';
      readonly parsed: ParsedFields;
      /** Fields holding something unusable, in the order bill, tip, people. */
      readonly invalid: readonly FieldName[];
      /** Fields with nothing entered, in the order bill, tip, people. */
      readonly empty: readonly FieldName[];
    };

/** How a field's message slot renders. 'none' renders the reserved line blank. */
export type MessageTone = 'none' | 'helper' | 'prompt' | 'error';

export interface FieldMessage {
  readonly tone: MessageTone;
  /** '' when tone is 'none'. */
  readonly text: string;
}

export type StatusKind = 'invalid' | 'empty' | 'one' | 'even' | 'roundedUp';

/** The status and rounding line under the hero number. The full sentence is lead + strong + tail. */
export interface StatusLine {
  readonly kind: StatusKind;
  /** 'ink' only when kind is 'roundedUp'; every other kind is 'muted'. */
  readonly tone: 'muted' | 'ink';
  readonly lead: string;
  /** Rendered at weight 600; '' unless kind is 'roundedUp'. */
  readonly strong: string;
  readonly tail: string;
}

export type Theme = 'light' | 'dark';

/** The slice of Web Storage the theme module needs; tests pass a fake. */
export type ThemeStorage = Pick<Storage, 'getItem' | 'setItem'>;
```

## Frozen Constants

`app/src/constants.ts`, scaffolded verbatim. No lane edits it.

```ts
// FROZEN CONTRACT (api-contract.md). Do not edit in a build lane; route changes through the orchestrator.
import type { BasisPoints, Cents, FieldName, FieldTexts } from './types';

/** localStorage key for the theme choice. index.html's no-flash script repeats it; contract.test.ts guards the pair. */
export const THEME_STORAGE_KEY = 'tip-calculator.theme.v1';

/** What a first open, or a link with bad values, shows: Bill empty, 20%, 2 people. */
export const DEFAULT_FIELDS: Readonly<FieldTexts> = { bill: '', tip: '20', people: '2' };

/** Tip quick picks in display order: 15%, 18%, 20%, 25%. */
export const TIP_PICKS_BP: readonly BasisPoints[] = [1500, 1800, 2000, 2500];

/** Field order for messages, lists and the URL hash. The URL parameter names equal the field names. */
export const FIELD_ORDER: readonly FieldName[] = ['bill', 'tip', 'people'];

/** $999,999,999.99. Keeps bill x basis points + 5000 inside Number.MAX_SAFE_INTEGER (exact integer math). */
export const MAX_BILL_CENTS: Cents = 99999999999;

/** 100 percent. */
export const MAX_TIP_BP: BasisPoints = 10000;

/** 15 digits: the largest all-nines count inside Number.MAX_SAFE_INTEGER. */
export const MAX_PEOPLE = 999999999999999;
```

`app/src/contract.test.ts` (frozen, full text in `tech-plan.md` § Shared foundation to scaffold) asserts five things: `index.html` reads `THEME_STORAGE_KEY`; it carries `<title>Tip Calculator</title>`; it carries the build-commit placeholder (§ Build Stamp); the defaults, picks and order above; and that `MAX_BILL_CENTS * MAX_TIP_BP + 5000` and `2 * MAX_BILL_CENTS + MAX_PEOPLE` are safe integers.

## Pure-Logic Module Signatures

All five modules are owned by the frontend lane and live in `app/src/lib/`, each with a Vitest suite beside it (`*.test.ts`). The signatures and rules below are frozen. Private helpers are the engineer's.

`NUMBER` below means the regular expression `/^(?:[0-9]+\.?[0-9]*|\.[0-9]+)$/`: ASCII digits with an optional decimal point. It matches `86`, `86.`, `86.40` and `.5`, and it rejects `.`, `""`, `8.6.4`, `1e3` and `+5`. "Strip leading zeros" turns `007` into `7` and `000` into `""`.

### `lib/calc.ts` (the pure calculation module of AC10)

```ts
export function parseBill(raw: string): BillParse;
export function parseTip(raw: string): TipParse;
export function parsePeople(raw: string): PeopleParse;
export function computeSplit(inputs: SplitInputs): SplitResult; // throws RangeError only on out-of-contract inputs
export function evaluate(fields: FieldTexts): Evaluation;
export function stepTip(raw: string, delta: 1 | -1): string;
export function stepPeople(raw: string, delta: 1 | -1): string;
export function pressedPick(tip: TipParse): BasisPoints | null;
```

**`parseBill(raw)`.** The checks run in this order, and the first match wins:

1. `s` = `raw` with every whitespace character and every `,` removed. If `s` starts with `$`, drop that one `$`.
2. `s` is `""` or `"."` → `{ status: 'empty' }`.
3. `s` starts with `-` → let `r` be the rest, with one leading `$` dropped. If `r` is `""`, `"."` or matches `NUMBER` → invalid `negative`, otherwise invalid `malformed`.
4. `s` does not match `NUMBER` → invalid `malformed`.
5. Split `s` at `.` into `whole` and `frac` (either may be `""`), then strip leading zeros from `whole`. If `whole` is longer than 9 digits → invalid `tooLarge`.
6. `frac` is longer than 2 digits → invalid `tooManyDecimals`.
7. Valid: `value = Number(whole || '0') * 100 + Number(frac.padEnd(2, '0'))`.

**`parseTip(raw)`.**

1. `s` = `raw` with every whitespace character removed. If `s` ends with `%`, drop that one `%`.
2. `s` is `""` or `"."` → empty.
3. `s` starts with `-` → let `r` be the rest. If `r` is `""`, `"."` or matches `NUMBER` → invalid `outOfRange` (below 0), otherwise invalid `malformed`.
4. `s` does not match `NUMBER` → invalid `malformed`.
5. Split into `whole` and `frac` and strip leading zeros from `whole`. If `whole` is longer than 3 digits, or `Number(whole) > 100`, or `Number(whole) === 100` and `frac` holds any digit other than `0` → invalid `outOfRange`.
6. `frac` is longer than 2 digits → invalid `tooManyDecimals`.
7. Valid: `value = Number(whole || '0') * 100 + Number(frac.padEnd(2, '0'))`, which is 0 to 10000.

**`parsePeople(raw)`.**

1. `s` = `raw` with every whitespace character removed.
2. `s` is `""` → empty.
3. `s` does not match `/^[0-9]+$/` → invalid `notWhole`. This covers negatives, decimals, letters, `.`, `-` and `1,000`.
4. Strip leading zeros. If the result is `""` (zero people) → invalid `notWhole`.
5. The result is longer than 15 digits → invalid `tooLarge`.
6. Valid: `value = Number(digits)`.

**`computeSplit(inputs)`.**

The preconditions, otherwise it throws `RangeError`:

- every argument is a safe integer
- `0 <= billCents <= MAX_BILL_CENTS`
- `0 <= tipBasisPoints <= MAX_TIP_BP`
- `1 <= people <= MAX_PEOPLE`

Then:

```
n              = billCents * tipBasisPoints + 5000
tipCents       = (n - n % 10000) / 10000                // half up to the cent
totalCents     = billCents + tipCents
r              = totalCents % people
shareCents     = (totalCents - r) / people + (r > 0 ? 1 : 0)   // rounded UP to the cent
overageCents   = r > 0 ? people - r : 0                 // 0 .. people-1
collectedCents = totalCents + overageCents              // equals shareCents * people
kind           = people === 1 ? 'one' : overageCents === 0 ? 'even' : 'roundedUp'
```

**`evaluate(fields)`.**

- `parsed` = the three parses.
- `invalid` and `empty` = the field names in `FIELD_ORDER` whose parse status is `'invalid'` or `'empty'`.
- If both lists are empty, the result is `{ status: 'ready', parsed, inputs, result: computeSplit(inputs) }`. Otherwise it is `{ status: 'incomplete', parsed, invalid, empty }`.
- It never throws, and it never returns NaN, Infinity or a negative number (AC6).

**`stepTip(raw, delta)`** (ArrowUp and ArrowDown in the Tip field). A valid tip moves to `value + delta * 100`. An empty or invalid tip is first treated as 0. The result is clamped to 0..10000 and returned as `formatPercentText(result)`. Examples: `"17.5", +1` → `"18.5"`; `"100", +1` → `"100"`; `"", +1` → `"1"`.

**`stepPeople(raw, delta)`** (the − and + buttons and arrow keys). A valid count moves to `value + delta`. An empty or invalid count is first treated as 1 (design-doc). The result is clamped to 1..`MAX_PEOPLE` and returned as `String(result)`. Examples: `"2", +1` → `"3"`; `"1", -1` → `"1"`; `"0", +1` → `"2"`.

**`pressedPick(tip)`.** Returns the pick in `TIP_PICKS_BP` equal to the valid tip value, or `null`. A pick is pressed if and only if the value equals it: `"20.0"` presses 20%, and an empty or invalid tip presses nothing.

### `lib/format.ts`

```ts
export function formatMoney(cents: Cents): string;        // Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }) of cents / 100
export function formatOverage(cents: Cents): string;      // cents < 100 ? `${cents}¢` : formatMoney(cents)
export function formatCount(n: number): string;           // Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }): 1500 -> "1,500"
export function formatBillText(cents: Cents): string;     // canonical field and URL text: whole dollars -> "100", otherwise "86.40"; no "$", no grouping
export function formatPercentText(bp: BasisPoints): string; // canonical field and URL text: 2000 -> "20", 1750 -> "17.5", 1725 -> "17.25"
```

Create the two `Intl.NumberFormat` instances once, at module scope. `cents / 100` is safe for formatting at these bounds, because Intl rounds to the currency's two fraction digits.

### `lib/messages.ts`

```ts
export function billMessage(p: BillParse): FieldMessage;
export function tipMessage(p: TipParse): FieldMessage;
export function peopleMessage(p: PeopleParse): FieldMessage;
export function fieldMessages(parsed: ParsedFields): Readonly<Record<FieldName, FieldMessage>>;
export function statusLine(e: Evaluation): StatusLine;
export function announcement(e: Evaluation): string | null;
export const CLIPBOARD_FAILED_MESSAGE: string; // 'Couldn’t copy. Copy the link from the address bar.'
export const LINK_COPIED_ANNOUNCEMENT: string; // 'Link copied.'
```

The exact strings and the selection rules are in § Error Shapes the UI Renders.

### `lib/urlState.ts`

```ts
export function parseHash(hash: string): FieldTexts;
export function serializeHash(fields: FieldTexts): string;
export function buildShareUrl(href: string, fields: FieldTexts): string;
```

The rules are in § URL-State Contract.

### `lib/theme.ts`

```ts
export function resolveTheme(stored: string | null, systemPrefersDark: boolean): Theme;
export function readStoredTheme(storage: ThemeStorage | null): Theme | null;
export function writeStoredTheme(storage: ThemeStorage | null, theme: Theme): void;
```

- `resolveTheme` returns `stored` when it is `'light'` or `'dark'`, otherwise `systemPrefersDark ? 'dark' : 'light'`. This is the same rule as the inline script in `index.html`.
- `readStoredTheme` returns `null` for a missing storage, an absent key, any other value, or a thrown `getItem`.
- `writeStoredTheme` swallows a thrown `setItem`, so quota errors and blocked storage are silent.

### Lane-Internal Hooks (recommended shape, not frozen)

```ts
function useSplitState(): {
  fields: FieldTexts;
  setField: (name: FieldName, text: string) => void;
  evaluation: Evaluation;              // useMemo(() => evaluate(fields), [fields]); synchronous, no debounce
  shareUrl: () => string;              // buildShareUrl(window.location.href, fields); also flushes the pending hash write
  autofocusBill: boolean;              // hydrated fields.bill === '' (no usable bill in the URL)
};
function useTheme(): { theme: Theme; choose: (t: Theme) => void };
```

## Storage Contract

| Key | Values | Written when | Read by |
|---|---|---|---|
| `tip-calculator.theme.v1` | `'light'` or `'dark'` | The user presses the unpressed segment of the Light \| Dark control. Pressing the pressed segment writes nothing. | The inline script in `index.html` (before first paint) and `lib/theme.ts` |

- **Absent or any other value** means: follow the system setting (`prefers-color-scheme`). While no choice is stored, `useTheme` follows a system change live (a `matchMedia` `change` listener that writes nothing). After the first explicit choice it stops following.
- **Nothing else is ever stored.** The inputs live only in the URL (PRD: no saved history), and there are no cookies, IndexedDB or sessionStorage.
- **The origin is shared.** `https://xzhou110.github.io` serves every Pages app of the owner, and localStorage is per origin, so the key is namespaced with the project name. The app never reads or writes the template's generic `appTheme` key, which another app on the origin may own.
- **Blocked storage** (private modes, policies): the inline script and `lib/theme.ts` catch the error and fall back to the system setting. The toggle still switches the page for the session.

**Migration note.** `v1` is the first version; the app has never shipped, so there is no earlier key to migrate. A future change to the stored shape bumps the suffix (`tip-calculator.theme.v2`). On load, the new code reads `v2`. If `v2` is absent and `v1` holds `'light'` or `'dark'`, it writes that value to `v2` and removes `v1`. The inline script and `THEME_STORAGE_KEY` change in the same commit (`contract.test.ts` fails otherwise). An unrecognized value under any version is treated as absent and is overwritten only by an explicit choice.

## URL-State Contract

**Format.** The three inputs live in the URL **fragment** as `application/x-www-form-urlencoded` pairs, for example `https://xzhou110.github.io/tip-calculator/#bill=86.40&tip=20&people=4`.

- Parameter names equal the field names, in `FIELD_ORDER`.
- Values are canonical: Bill via `formatBillText`, Tip via `formatPercentText`, People as plain digits.
- Only **valid** fields are written. An empty or invalid field is left out, so a link never carries a value that would load as an error.
- The fragment is never sent to a server.

**`serializeHash(fields)`** returns the pairs without `#`, or `''` when no field is valid.

| Fields | Result |
|---|---|
| `{ bill: '86.4', tip: '20', people: '4' }` | `'bill=86.40&tip=20&people=4'` |
| `{ bill: '', tip: '20', people: '2' }` | `'tip=20&people=2'` |
| `{ bill: '$1,234.5', tip: '17.50', people: '04' }` | `'bill=1234.50&tip=17.5&people=4'` |
| `{ bill: 'abc', tip: '', people: '0' }` | `''` |

**`parseHash(hash)`.**

- It accepts the hash with or without its leading `#` and reads it with `URLSearchParams`. The first value of a repeated key wins and unknown keys are ignored.
- **Each field falls back independently:** a missing, empty or invalid value becomes that field's `DEFAULT_FIELDS` value. A valid value becomes its canonical text.
- It never throws, including on malformed percent-escapes, and no error is shown on load (AC9).

| Hash | Result |
|---|---|
| `''` or `'#'` | `{ bill: '', tip: '20', people: '2' }` |
| `'#bill=86.40&tip=20&people=4'` | `{ bill: '86.40', tip: '20', people: '4' }` |
| `'bill=86.4&tip=17.50&people=04'` | `{ bill: '86.40', tip: '17.5', people: '4' }` |
| `'#bill=abc&tip=500&people=0'` | `{ bill: '', tip: '20', people: '2' }` |
| `'#bill=0'` | `{ bill: '0', tip: '20', people: '2' }` |
| `'#tip=18'` | `{ bill: '', tip: '18', people: '2' }` |
| `'#bill=%24100&x=1'` | `{ bill: '100', tip: '20', people: '2' }` |
| `'#bill=1e3&bill=50'` | `{ bill: '', tip: '20', people: '2' }` (the first value wins and is invalid) |
| `'#%E0%A4%A'` | `{ bill: '', tip: '20', people: '2' }` |

**`buildShareUrl(href, fields)`** returns `href` with everything from the first `#` removed, followed by `'#' + serializeHash(fields)`, or by nothing when that is `''`. The path and any query string (such as `?t=1`) are preserved; the app never reads the query. Example: `('https://xzhou110.github.io/tip-calculator/?t=1#bill=1', { bill: '86.40', tip: '20', people: '4' })` → `'https://xzhou110.github.io/tip-calculator/?t=1#bill=86.40&tip=20&people=4'`.

**Runtime rules for `useSplitState`.** QA tests against these.

1. **Hydrate once, synchronously,** in the `useState` initializer: `parseHash(window.location.hash)`. The first render already shows the link's values, with no flash of defaults.
2. **Write after changes:** run an effect on `fields` that sets a 150 ms timer (cleared on the next change) to call `history.replaceState(history.state, '', buildShareUrl(location.href, fields))`. Skip the call when the URL would not change, and wrap it in `try`/`catch`. The first render also writes, so the address bar always holds the current link. Never use `pushState`.
3. **Listen to `hashchange`** (fired when the user pastes or edits a link in the same tab; `replaceState` never fires it) and replace `fields` with `parseHash(location.hash)`.
4. **Copy Link** copies `shareUrl()`, which is correct even inside the 150 ms window, and flushes the write.
5. **Autofocus Bill** only when the hydrated Bill is `''` and the device has a fine pointer (`matchMedia('(hover: hover) and (pointer: fine)')`), so phones don't pop the keyboard (design-doc focus rule).
6. **Load from a bad link:** the fallback values are valid or empty, so on load the page can show only neutral prompts, never a red error. design-doc Flow 4 step 3 follows from the contract.

## Error Shapes the UI Renders

No exception ever reaches the UI. User input produces values, not throws (§ Conventions). The browser calls that can fail (`replaceState`, `localStorage`, `navigator.clipboard`) are wrapped. A failure leaves the console clean: there are no `console.error` calls in shipped code.

### `FieldMessage` (One per Field, in Its Reserved Message Slot)

| Tone | Rendering (design-doc § Field messages) | `aria-invalid` |
|---|---|---|
| `none` | Blank line, still reserved | `false` |
| `helper` | `--muted`, `--fs-small` (the Tip helper only) | `false` |
| `prompt` | `--ink`, weight 600 (the empty-field prompt; not a mistake) | `false` |
| `error` | `--danger`, weight 600, plus the field's danger border | `true` |

| Field | Parse | Tone | Text |
|---|---|---|---|
| Bill | valid (0 included) | none | `''` |
| Bill | empty | prompt | Enter the bill before tip, like 86.40 |
| Bill | malformed | error | Enter a number, like 86.40 |
| Bill | negative | error | The bill can’t be negative |
| Bill | tooManyDecimals | error | Use dollars and cents, like 86.40 |
| Bill | tooLarge | error | Enter a bill under $1 billion |
| Tip | valid (0 included) | helper | Tap a pick or type any percent from 0 to 100. |
| Tip | empty | prompt | Enter a tip, like 20 |
| Tip | malformed, outOfRange | error | Enter a tip from 0 to 100 |
| Tip | tooManyDecimals | error | Use up to two decimals, like 17.5 |
| People | valid | none | `''` |
| People | empty | prompt | Enter the number of people, like 4 |
| People | notWhole | error | Enter a whole number, 1 or more |
| People | tooLarge | error | Enter a smaller number of people |

Three of these strings are new: "Enter a bill under $1 billion", "Use up to two decimals, like 17.5" and "Enter a smaller number of people". They cover the exactness bounds and the hundredths precision (tech-plan Key decisions 3 and 13). Every other string is verbatim from design-doc.md § UX Copy.

### `StatusLine` (the Line Under the Hero Number; Exactly One Shows)

The rows are in priority order, so the first match wins.

| Condition | kind | tone | lead + strong + tail |
|---|---|---|---|
| `invalid` = [bill] | invalid | muted | Check the Bill to see the split. |
| `invalid` = [tip] | invalid | muted | Check the Tip to see the split. |
| `invalid` = [people] | invalid | muted | Check People to see the split. |
| `invalid` = [bill, tip] | invalid | muted | Check Bill and Tip to see the split. |
| `invalid` = [bill, people] | invalid | muted | Check Bill and People to see the split. |
| `invalid` = [tip, people] | invalid | muted | Check Tip and People to see the split. |
| `invalid` = [bill, tip, people] | invalid | muted | Check Bill, Tip and People to see the split. |
| no invalid, `empty` = [bill] | empty | muted | Enter the bill to see each person’s share. |
| no invalid, `empty` = [tip] | empty | muted | Enter a tip to see the split. |
| no invalid, `empty` = [people] | empty | muted | Enter the number of people to see the split. |
| no invalid, `empty` = [bill, tip] | empty | muted | Fill in Bill and Tip to see the split. |
| no invalid, `empty` = [bill, people] | empty | muted | Fill in Bill and People to see the split. |
| no invalid, `empty` = [tip, people] | empty | muted | Fill in Tip and People to see the split. |
| no invalid, `empty` = all three | empty | muted | Fill in Bill, Tip and People to see the split. |
| ready, kind `one` | one | muted | One person pays the full Total. |
| ready, kind `even` | even | muted | Splits evenly: {N} × {S} = {T}. |
| ready, kind `roundedUp` | roundedUp | ink | lead `Rounded up to the cent: {N} × {S} = {C}, ` · strong `{D} over the Total` · tail `.` |

Placeholders: `{N}` = `formatCount(people)`, `{S}` = `formatMoney(shareCents)`, `{T}` = `formatMoney(totalCents)`, `{C}` = `formatMoney(collectedCents)`, `{D}` = `formatOverage(overageCents)`. For every kind except `roundedUp`, the whole sentence is in `lead` and `strong` and `tail` are `''`.

**Result placeholders (AC1, AC6).** When `evaluate` returns `incomplete`, all three result values render `<span aria-hidden="true">—</span><span class="visually-hidden">Not calculated yet</span>` and never a stale or zero number. When it is `ready`, they render `formatMoney(shareCents)`, `formatMoney(tipCents)` and `formatMoney(totalCents)`; `$0.00` is a real result.

**`announcement(e)`** feeds the visually hidden `role="status"` region (debounced 700 ms by the UI). It returns `null` unless `ready`. Otherwise it returns `Each person pays {S}. Total {T}.`, followed for `roundedUp` by ` Rounded up to the cent, {D} over the Total.`

**Clipboard.** On a rejected `navigator.clipboard.writeText`, or when `navigator.clipboard` is unavailable, the share helper line shows `CLIPBOARD_FAILED_MESSAGE` in `--danger`. On success, the live region announces `LINK_COPIED_ANNOUNCEMENT`.

## Golden Cases

`calc.test.ts` must cover at least the `computeSplit`/`evaluate` and parse rows below: the happy path, rounding and invalid input of AC10. The other suites cover their rows. QA reuses the first block in the browser.

**Split (Bill, Tip, People → Tip Amount, Total, Each Person Pays, collected, overage, kind, status line)**

| Bill | Tip | People | tipCents | totalCents | shareCents | collected | overage | kind | Status line |
|---|---|---|---|---|---|---|---|---|---|
| 86.40 | 20 | 4 | 1728 | 10368 | 2592 | 10368 | 0 | even | Splits evenly: 4 × $25.92 = $103.68. |
| 86.40 | 20 | 2 | 1728 | 10368 | 5184 | 10368 | 0 | even | Splits evenly: 2 × $51.84 = $103.68. |
| 86.40 | 20 | 3 | 1728 | 10368 | 3456 | 10368 | 0 | even | Splits evenly: 3 × $34.56 = $103.68. |
| 100 | 18 | 3 | 1800 | 11800 | 3934 | 11802 | 2 | roundedUp | Rounded up to the cent: 3 × $39.34 = $118.02, **2¢ over the Total**. |
| 50 | 20 | 1 | 1000 | 6000 | 6000 | 6000 | 0 | one | One person pays the full Total. |
| 0 | 20 | 2 | 0 | 0 | 0 | 0 | 0 | even | Splits evenly: 2 × $0.00 = $0.00. |
| 120.25 | 0 | 150 | 0 | 12025 | 81 | 12150 | 125 | roundedUp | Rounded up to the cent: 150 × $0.81 = $121.50, **$1.25 over the Total**. |
| 0.01 | 0 | 3 | 0 | 1 | 1 | 3 | 2 | roundedUp | Rounded up to the cent: 3 × $0.01 = $0.03, **2¢ over the Total**. |
| 0.25 | 10 | 2 | 3 (2.5 rounds half up) | 28 | 14 | 28 | 0 | even | Splits evenly: 2 × $0.14 = $0.28. |
| 0.10 | 15 | 1 | 2 (1.5 rounds half up) | 12 | 12 | 12 | 0 | one | One person pays the full Total. |
| 10.05 | 15 | 1 | 151 (150.75) | 1156 | 1156 | 1156 | 0 | one | One person pays the full Total. |
| 10.00 | 17.5 | 2 | 175 | 1175 | 588 | 1176 | 1 | roundedUp | Rounded up to the cent: 2 × $5.88 = $11.76, **1¢ over the Total**. |

**Properties to assert** over a grid (people 1 to 50; totals 0 to 2000 cents; and the bounds):

- `collectedCents === shareCents * people`
- `0 <= overageCents <= people - 1`
- `shareCents * people >= totalCents`
- every value is a safe integer
- at `MAX_BILL_CENTS`, `MAX_TIP_BP` and `MAX_PEOPLE`, nothing throws and nothing is unsafe

`computeSplit` throws `RangeError` for `people: 0`, `billCents: -1`, `billCents: 1.5`, `tipBasisPoints: 10001` and `people: NaN`.

**Parse**

| Function | Input | Result |
|---|---|---|
| parseBill | `''`, `'  '`, `'$'`, `'.'`, `'$.'` | empty |
| parseBill | `'86.40'`, `'86.4'`, `' 86.40 '`, `'$86.40'` | valid 8640 |
| parseBill | `'86.'` / `'.5'` / `'$1,234.56'` / `'0'` / `'0.00'` / `'007'` / `'000000000086.40'` | valid 8600 / 50 / 123456 / 0 / 0 / 700 / 8640 |
| parseBill | `'999999999.99'` / `'1000000000'` | valid 99999999999 / invalid tooLarge |
| parseBill | `'86.4o'`, `'8.6.4'`, `'abc'`, `'1e3'`, `'+5'`, `'$$5'`, `'-abc'` | invalid malformed |
| parseBill | `'-5'`, `'-'`, `'-$5'`, `'$-5'`, `'-.'` | invalid negative |
| parseBill | `'86.405'`, `'86.400'` | invalid tooManyDecimals |
| parseTip | `''`, `'.'`, `'%'`, `' '` | empty |
| parseTip | `'20'` / `'20%'` / `' 18 '` / `'020'` / `'17.5'` / `'17.25'` / `'0'` / `'100'` / `'100.00'` | valid 2000 / 2000 / 1800 / 2000 / 1750 / 1725 / 0 / 10000 / 10000 |
| parseTip | `'101'`, `'100.01'`, `'500'`, `'1000'`, `'-1'`, `'-'`, `'500.555'` | invalid outOfRange |
| parseTip | `'17.555'`, `'100.000'` | invalid tooManyDecimals |
| parseTip | `'abc'`, `'2o'`, `'1,5'`, `'-abc'` | invalid malformed |
| parsePeople | `''`, `'   '` | empty |
| parsePeople | `'4'` / `'04'` / `' 4 '` / `'1'` / `'999999999999999'` | valid 4 / 4 / 4 / 1 / 999999999999999 |
| parsePeople | `'0'`, `'00'`, `'-2'`, `'2.5'`, `'4.0'`, `'two'`, `'.'`, `'-'`, `'1,000'` | invalid notWhole |
| parsePeople | `'1000000000000000'` | invalid tooLarge |

**Evaluate (incomplete cases)**

| Fields (bill, tip, people) | invalid | empty | Status line |
|---|---|---|---|
| `''`, `'20'`, `'2'` | [] | [bill] | Enter the bill to see each person’s share. |
| `'86.4o'`, `'20'`, `'2'` | [bill] | [] | Check the Bill to see the split. |
| `'86.40'`, `''`, `'2'` | [] | [tip] | Enter a tip to see the split. |
| `''`, `''`, `''` | [] | [bill, tip, people] | Fill in Bill, Tip and People to see the split. |
| `'abc'`, `''`, `'0'` | [bill, people] | [tip] | Check Bill and People to see the split. |

**Steps, pick, format**

| Call | Result |
|---|---|
| `stepTip('20', 1)` / `stepTip('17.5', 1)` / `stepTip('99.5', 1)` / `stepTip('100', 1)` | `'21'` / `'18.5'` / `'100'` / `'100'` |
| `stepTip('0', -1)` / `stepTip('0.5', -1)` / `stepTip('', 1)` / `stepTip('abc', -1)` | `'0'` / `'0'` / `'1'` / `'0'` |
| `stepPeople('2', 1)` / `stepPeople('1', -1)` / `stepPeople('', 1)` / `stepPeople('', -1)` / `stepPeople('0', 1)` | `'3'` / `'1'` / `'2'` / `'1'` / `'2'` |
| `stepPeople('999999999999999', 1)` | `'999999999999999'` |
| `pressedPick(parseTip('20'))` / `pressedPick(parseTip('20.0'))` / `pressedPick(parseTip('22'))` / `pressedPick(parseTip(''))` | `2000` / `2000` / `null` / `null` |
| `formatMoney(2592)` / `formatMoney(0)` / `formatMoney(123456)` / `formatMoney(99999999999)` | `'$25.92'` / `'$0.00'` / `'$1,234.56'` / `'$999,999,999.99'` |
| `formatOverage(2)` / `formatOverage(99)` / `formatOverage(100)` / `formatOverage(125)` | `'2¢'` / `'99¢'` / `'$1.00'` / `'$1.25'` |
| `formatCount(4)` / `formatCount(1500)` | `'4'` / `'1,500'` |
| `formatBillText(8640)` / `formatBillText(10000)` / `formatBillText(5)` / `formatBillText(0)` / `formatBillText(123456)` | `'86.40'` / `'100'` / `'0.05'` / `'0'` / `'1234.56'` |
| `formatPercentText(2000)` / `formatPercentText(1750)` / `formatPercentText(1725)` / `formatPercentText(5)` / `formatPercentText(10000)` | `'20'` / `'17.5'` / `'17.25'` / `'0.05'` / `'100'` |
| `resolveTheme('dark', false)` / `resolveTheme(null, true)` / `resolveTheme('blue', false)` | `'dark'` / `'dark'` / `'light'` |
| `readStoredTheme(null)` / a storage whose `getItem` throws / one holding `'sepia'` | `null` / `null` / `null` |

The round-trip property for any `FieldTexts` value `f`: every field that parses valid in `f` parses to the same value in `parseHash(serializeHash(f))`.

## Build Stamp (the Release-Check Contract)

The live check (AC11) and QA read one value from the served page; nothing in the app reads it.

| Where | Value |
|---|---|
| `app/index.html` (source, frozen) | `<meta name="build-commit" content="__BUILD_COMMIT__" />`, directly after `<title>Tip Calculator</title>` |
| `app/dist/index.html`, built by GitHub Actions | `content` = the full 40-character `GITHUB_SHA` of the commit the run built |
| `app/dist/index.html`, built locally | `content="local"` |

- `vite.config.ts` fills the value at build time with a `transformIndexHtml` plugin (tech-plan.md § Shared foundation to scaffold).
- **Live means:** HTTP 200 at `https://xzhou110.github.io/tip-calculator/` with the title marker and `build-commit` equal to the pushed SHA (`git rev-parse HEAD`), and the referenced `assets/index-<hash>.js` returning 200.
- **Not live yet:** any 404 (GitHub Pages' CDN caches it and ignores the query string, so `?t=` cannot bust it), a 200 without the marker, or an older SHA.
- The procedure, timeout and reporting are in tech-plan.md § Release Verification.

**Bundle-size report (not an interface, listed so QA finds it).** `npm run size` in `app/`, after `npm run build`, prints `Bundle size: <raw> bytes raw, <gzip> bytes gzip (<n> files in dist/)` and a per-file table. It exits 0 whatever the size, and 1 only when `dist/` is missing.

## Change Control

The frozen surface is:

- `app/src/types.ts`, `app/src/constants.ts` and `app/src/contract.test.ts`
- `app/index.html`, including the build-stamp placeholder
- `app/scripts/report-bundle-size.mjs`
- the signatures and rules above
- the storage key and the URL format A lane that needs a change stops and asks the orchestrator. The orchestrator edits this file in place, re-scaffolds the frozen files and updates the line below. Everything not listed as frozen (component structure, hook internals, private helpers, CSS) is the frontend lane's to decide within design-doc.md.

**Last frozen:** 2026-10-16T06:35Z by the orchestrator at the contract-freeze gate (PRD amended first: D-004, D-005; the scaffold commit's SHA is in STATE.md § Resume and RUN_LOG.md)
