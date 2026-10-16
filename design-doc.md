# Design Doc: Tip Calculator

Product Designer, 2026-10-15. Inputs read: `PRD.md`, `PROJECT.md`, `DECISIONS.md` (D-001, D-002), and the owner's `frontend-baseline` files (`outcome-first-design.md`, `owner-design-preferences.md` with its App UI Conventions, `SKILL.md`, `assets/baseline.css`, `assets/theme-init.html`, `assets/theme-toggle.md`, `responsive-and-a11y.md`). Everything below stays inside the PRD's scope. One page, one screen, several states. The Frontend Engineer should be able to build it from this document alone; any choice not covered here is the engineer's to make.

Revision 2 (2026-10-15), to match PRD AC2 and AC6: every empty field now shows a short plain message by the field, on the same keystroke and with no wait for blur, Bill included; and a Bill of 0 is an entered value that shows $0.00 results, not placeholders. Placeholders now mean only "nothing entered yet" or "this input cannot be used", never a valid 0.

Revision 4 (2026-10-16, the orchestrator at the fix round): the Tip field basis is 6rem and the 360px Tip row has no slack (R-8, D-007).

Revision 3 (2026-10-15, the orchestrator at the contract-freeze gate; api-contract.md wins where the two differ): the rounded-up state is called "rounded-up split" (not "uneven", which PRD Out reserves for unequal shares); the theme key is `tip-calculator.theme.v1`; a lone "-" in Bill is the negative error, not empty; the 48px touch-target claim names the 40px theme segments as the exception; Copy Link is the last control, and the XuSeak footer link follows it in tab order.

## Outcome and Direction

**Who and when.** One person at a restaurant table, phone in one hand, in a hurry, often in dim light, settling "what do I owe" for a group of two or more. They come back to it with the same three numbers every time, so speed and legibility beat features.

**What they must be able to do at a glance.** See three inputs that need no instructions (Bill, Tip, People) and read one large number, Each Person Pays, without hunting. They also need to trust that number, so the page always shows the arithmetic behind it and any rounding difference.

**Directions considered**

| Direction | Idea | Verdict |
|---|---|---|
| **A. Calculator Display (chosen)** | The answer sits at the top in a large display card, like a calculator's screen. The three inputs sit below it, within thumb reach. Calm neutral surfaces with one teal accent that marks selection. | **Chosen.** People already know this layout (display on top, keys under the thumb). The answer stays visible above the phone keyboard while the bill is typed, and the controls sit where the thumb rests. |
| B. Receipt | A paper-receipt look with monospace line items and dotted leaders; the inputs come first and the share prints at the bottom like a receipt total. | Rejected. It is charming, but monospace type and dotted leaders read worse in dim light, and an answer at the bottom ends up under the keyboard. |
| C. One Question per Screen | A three-step wizard (Bill, then Tip, then People, then the answer). | Rejected. It needs more taps than the five-interaction budget, it hides the live result, and it slows down a visit that repeats the same steps each time. |

**Visual language.** Quiet off-white canvas and white cards in light mode; neutral charcoal in dark mode, with no green cast on the background. A restrained teal accent (the owner's approved accent family), used only to mark the active choice and the focus ring. The system sans-serif type is set larger than the baseline's 14px because this is read on a phone at arm's length. Numbers use tabular figures so digits don't shift while you type. There are no icons except one inline check mark, no gradients and no animation on the numbers.

## Decisions Left to the Designer

| Decision | Choice | Rationale |
|---|---|---|
| Default tip percent | **20%** | 20% is the usual tip for a sit-down dinner in the US today and it is the pick in the PRD journey. Tapping 20% in the journey still works; it just keeps 20% selected. |
| Default people count | **2** | The page exists for groups of two or more (PRD Users). Two taps on + reach 4. A value of 1 is still allowed. |
| Share-link control placement | **A full-width secondary "Copy Link" button below People, the last control on the page** | Sharing is the last step of the journey, so the button comes last among the controls in both reading order and tab order (only the XuSeak footer link follows it) and sits within thumb reach. Secondary styling keeps the answer as the main focus. The address bar also always holds the current link. |
| Rounding note wording | Even: "Splits evenly: 4 × $25.92 = $103.68." Rounded up: "Rounded up to the cent: 3 × $39.34 = $118.02, 2¢ over the Total." | It shows the arithmetic, not just a claim. It names the direction ("Rounded up") and the exact amount, and it points to the result labelled Total. The full copy table is under UX Copy. |
| Rounding rule recommended to the Tech Lead | **Round each share UP to the next cent and state the overage** (one of the two options in the PRD). Tip Amount rounds half-up to the cent. Total = Bill + the displayed Tip Amount. Share = Total ÷ People, rounded up to the cent. Difference = Share × People − Total, always between 0 and People − 1 cents. | This way the table is never short. The note can only ever say "over", never "short", so nobody at the table has to decide who covers the missing cents, which is the argument the PRD wants to avoid. Rejected: round to the nearest cent, which can leave the group up to People ÷ 2 cents short, so someone must make up the gap. Because Total = Bill + Tip Amount, the numbers on screen always add up. |

Worked examples (QA can use these): 86.40, 20%, 4 people gives Tip Amount $17.28, Total $103.68, Each Person Pays $25.92, and "Splits evenly: 4 × $25.92 = $103.68." 100, 18%, 3 people gives Tip Amount $18.00, Total $118.00, Each Person Pays $39.34, and "Rounded up to the cent: 3 × $39.34 = $118.02, 2¢ over the Total." 50, 20%, 1 person gives $10.00, $60.00, $60.00 and "One person pays the full Total."

## Key User Flows

**Flow 1: Settle the Split (the primary journey, at most five interactions after the page opens)**
1. The person opens the link from a home-screen shortcut, a bookmark or a chat. The page shows the title Tip Calculator and the display card with "—" placeholders and the line "Enter the bill to see each person’s share." Bill is empty, with the prompt "Enter the bill before tip, like 86.40" right under the field; the 20% quick pick is pressed, and People shows 2. On a device with a physical keyboard, Bill already has focus.
2. They tap Bill and type `86.40`. The prompt under Bill clears on the first digit and the results fill in as they type: Each Person Pays **$51.84**, Tip Amount $17.28, Total $103.68, "Splits evenly: 2 × $51.84 = $103.68." (Interactions 1 and 2.)
3. They tap **20%**. It stays pressed and the numbers don't change. Tapping it also closes the phone keyboard. (Interaction 3.)
4. They tap **+** twice. People goes 3 then 4 and Each Person Pays goes $34.56 then **$25.92**. (Interactions 4 and 5.)
5. They read **$25.92** under Each Person Pays, with "Splits evenly: 4 × $25.92 = $103.68." beneath it. Done.

**Flow 2: Use a Custom Tip**
1. They tap the Tip field. It shows the current percent (20) with the text selected, so typing replaces it.
2. They type `22`. No quick pick is pressed, and the results update live. If they type `18`, the 18% pick lights up, because the field and the picks are one value.
3. A value outside 0 to 100, or letters, shows "Enter a tip from 0 to 100" under the Tip row. The results go back to placeholders and the display line reads "Check the Tip to see the split."
4. If they clear the field (Backspace while it still has focus), "Enter a tip, like 20" appears under the Tip row on that same keystroke, no pick is pressed, the results show placeholders and the display line reads "Enter a tip to see the split." Typing a number or tapping a pick clears it.
5. A 0 tip is a real value: Tip Amount shows $0.00 and the split is the bill alone.

**Flow 3: A Rounded-Up Split**
1. With Bill 100, 18% and 3 people, Each Person Pays reads **$39.34**.
2. The rounding line reads "Rounded up to the cent: 3 × $39.34 = $118.02, 2¢ over the Total." It shows whenever the split is rounded up and is never hidden behind a tap.

**Flow 4: Share the Split**
1. They tap **Copy Link**. The button reads "Link Copied" with a check mark for 2 seconds, and screen readers hear "Link copied."
2. They paste the link into the group chat. A friend opens it and sees the same Bill, Tip and People with the same results, without typing anything. Bill isn't auto-focused because it is already filled.
3. If a link has bad values (letters, a 500% tip, 0 people), the page quietly loads the defaults for those fields (Bill empty, 20%, 2). No error shows on load. If Bill fell back to empty, it shows its usual first-open prompt, in the neutral style, never the red error style.
4. If the clipboard is unavailable, the button area shows "Couldn’t copy. Copy the link from the address bar."

**Flow 5: Fix a Typo**
1. They type `86.4o` in Bill. The field border turns red and "Enter a number, like 86.40" appears under it. All three results show "—" and the display line reads "Check the Bill to see the split." Stale numbers are never left on screen.
2. They fix the typo. The message disappears and the results come back on the same keystroke.
3. If instead they delete everything in Bill, the red error is replaced at once by the neutral prompt "Enter the bill before tip, like 86.40" and the display line returns to "Enter the bill to see each person’s share."
4. If they type `0` in Bill, that is a value, not a typo: the results show $0.00 (Tip Amount $0.00, Total $0.00, Each Person Pays $0.00) with "Splits evenly: 2 × $0.00 = $0.00." and no message under the field.

**Flow 6: Switch the Theme**
1. On the first visit the page matches the phone's system setting with no flash. The matching segment of the Light | Dark control is pressed.
2. Tapping the other segment switches the whole page instantly. After a reload the page keeps that choice, applied before first paint by the `theme-init.html` script with the `tip-calculator.theme.v1` key.

## Screen Descriptions

There is one screen: a single centred column, `max-width: var(--page-max)` (28rem, 448px), with 16px side padding at 360px. The DOM order is the visual order, top to bottom.

**Wireframe at 360px (filled, rounded-up split)**

```
+--------------------------------------+
| Tip Calculator         [Light][Dark] |  header: h1 left, theme control right
|                                      |
| +----------------------------------+ |
| | Each Person Pays                 | |  display card (results)
| | $39.34                           | |  hero number
| | Rounded up to the cent: 3 x      | |  rounding line (2 lines reserved)
| | $39.34 = $118.02, 2c over Total. | |
| | -------------------------------- | |
| | Tip Amount        Total          | |  two columns
| | $18.00            $118.00        | |
| +----------------------------------+ |
|                                      |
| Bill                                 |
| [ $  100                           ] |  56px tall
|                                      |  message slot (1 line reserved, blank when valid)
| Tip                                  |
| [15%] [18%] [20%] [25%] [   18  % ]  |  18% pressed (accent fill); field mirrors it
| Tap a pick or type any percent ...   |  helper / prompt / error slot
|                                      |
| People                               |
| [ - ] [            3           ] [+] |  48px stepper
|                                      |  message slot (1 line reserved, blank when valid)
| [             Copy Link            ] |  secondary button
| The link opens this same split ...   |
|                                      |
|          A project by XuSeak         |  footer
+--------------------------------------+
```

**Wireframe at 360px (first open: Bill empty)**, inputs region only; the card shows "—" ×3 and "Enter the bill to see each person’s share."

```
| Bill                                 |
| [ $                                ] |  focused on a physical keyboard
| Enter the bill before tip, like 86.40|  neutral prompt BY THE FIELD (--ink, 600)
| Tip                                  |
| [15%] [18%] [20%] [25%] [   20  % ]  |  20% pressed
| Tap a pick or type any percent ...   |  helper
| People                               |
| [ - ] [            2           ] [+] |
|                                      |  slot blank (People is valid)
```

**Regions, top to bottom**

1. **Header** (`<header>`, flex row, `justify-content: space-between`, `align-items: center`, `gap: var(--space-3)`, wraps if needed)
   - `h1` "Tip Calculator": `--fs-title`, weight 700, `--ink`.
   - Theme control: a two-segment group, `role="group"`, `aria-label="Theme"`. It holds two `<button>`s, "Light" and "Dark", each with `aria-pressed`. Height 40px, segment padding 0 14px, `--fs-small`, weight 600, 1px `--line-strong` outer border, `--radius-sm`. Unpressed segment: `--surface` background, `--ink` text. Pressed segment: `--ink` background, `--surface` text. The chrome stays neutral on purpose: the accent belongs to the calculator. Wire it with `assets/theme-toggle.md` (writes `localStorage('tip-calculator.theme.v1')` and `document.documentElement.dataset.theme`). Pressing the segment that is already pressed does nothing.
2. **Display card** (`<section aria-label="Results">`, `--surface`, 1px `--line` border, `--radius`, `--shadow`, padding `var(--space-4)`; a `<dl>` holds the three results)
   - Label "Each Person Pays": `--fs-label`, weight 600, `--muted`.
   - Hero value: `--fs-hero`, weight 700, `--ink`, `font-variant-numeric: tabular-nums`, `line-height: 1.1`, `overflow-wrap: anywhere`, so a very large amount wraps instead of scrolling sideways.
   - Rounding line (also the status line): `--fs-small`, `line-height: 1.4`, `min-height: 2.8em`, so two lines are always reserved and the card never changes height between states. Text is `--muted` for the empty, invalid, even and one-person states. For the rounded-up state it is `--ink`, with the overage phrase ("2¢ over the Total") in weight 600.
   - A 1px `--line` divider with `var(--space-3)` above and below.
   - A two-column grid (`grid-template-columns: 1fr 1fr`, `gap: var(--space-3)`). Each column has a label (`--fs-small`, `--muted`, weight 600) over a value (`--fs-result`, weight 600, `--ink`, tabular numbers, `overflow-wrap: anywhere`). Left column: Tip Amount. Right column: Total.
   - Placeholder state: each value shows "—" in `--muted`, wrapped as `<span aria-hidden="true">—</span><span class="visually-hidden">Not calculated yet</span>`. Placeholders appear only when a field is empty or invalid (AC1: "no bill entered"). Whenever all three fields hold valid entered values, the card shows the computed amounts to the cent (AC2), $0.00 included: a 0% tip gives Tip Amount $0.00, and a Bill of 0 gives $0.00 in all three results.
3. **Inputs** (`<form>` with `onSubmit` that calls `preventDefault`; there is no submit button, so Enter never reloads the page. `gap: var(--space-4)` between the three field groups; each group already ends in a reserved message line, so the visual gap stays generous. The inputs sit on the canvas, not in a card, which keeps the display card the only raised surface.)
   - **Bill**: a visible `<label for="bill">` reading "Bill" (`--fs-label`, weight 600, `--ink`). Below it a field 56px tall, full width, `--surface` background, 1px `--line-strong` border, `--radius-sm`. A non-editable "$" prefix sits inside on the left (`--muted`, `aria-hidden`), with the typed text left-aligned after it. Type size `--fs-input-lg`, weight 600, tabular numbers. Attributes: `type="text" inputmode="decimal" autocomplete="off" enterkeyhint="done"`. Enter or Done blurs the field, which closes the phone keyboard. Text is selected on focus. The field gets `autofocus` only when the page loads with no bill in the URL. A message slot sits under it, one line always reserved (`min-height: 1.4em` at `--fs-small`) so the inputs below never jump: the empty prompt "Enter the bill before tip, like 86.40" whenever Bill is blank (including on first open and while the field still has focus), an error when Bill is invalid, and blank when Bill holds a valid value (0 included).
   - **Tip**: a visible `<label for="tip">` reading "Tip". Below it one row (`display: flex; flex-wrap: wrap; gap: 6px`) with the four quick picks and then the Tip field.
     - Quick picks: `<button type="button" aria-pressed>` labelled "15%", "18%", "20%", "25%", inside a `role="group" aria-label="Tip Quick Picks"` wrapper. Each is 48px tall with `flex: 1 1 3.25rem`, `--fs-body`, weight 600, tabular numbers, `--radius-sm`. Unpressed: `--surface` background, 1px `--line-strong` border, `--ink` text; hover background `--track`. Pressed (the value equals the pick): `--accent` background and border, `--on-accent` text; hover `--accent-d`.
     - Tip field: `id="tip"`, `flex: 1.4 1 6rem` (revision 4: widened from 5.25rem so "100.00" fits at 360px, R-8), 48px tall, the same field style as Bill but at `--fs-input`, right-aligned, with a non-editable "%" suffix inside on the right (`--muted`, `aria-hidden`). Attributes: `type="text" inputmode="decimal" autocomplete="off" enterkeyhint="done"`. Text is selected on focus. ArrowUp and ArrowDown step by 1 and stop at 0 and 100. The field always mirrors the current percent: tapping a pick writes that number into it, and typing a value equal to a pick lights that pick. Decimals are accepted (17.5).
     - At 360px the five items fit on one row (4 × 52px + 96px + 4 × 6px gaps = 328px, exactly the width available: a wider pick, gap or field basis wraps the Tip field to its own row). When the space is narrower, the field wraps to its own full-width row on its own. Nothing overflows.
     - Helper, prompt and error slot under the row (one line reserved): by default the helper "Tap a pick or type any percent from 0 to 100." in `--muted`, `--fs-small`. When the Tip field is empty, the empty prompt "Enter a tip, like 20" (empty-prompt style, so it reads differently from the muted helper) replaces the helper on the same keystroke, even while the field has focus. When the value is invalid, the error replaces it. A 0 tip is valid and shows the helper.
   - **People**: a visible `<label for="people">` reading "People". Below it a stepper row (`display: flex; gap: 6px`):
     - A "−" button (U+2212), 48×48, `aria-label="Fewer People"`, `disabled` when the value is 1.
     - The field: `flex: 1`, 48px, `--fs-input`, weight 600, centred text. Attributes: `type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" enterkeyhint="done"`. Text is selected on focus. ArrowUp and ArrowDown step by 1, with a minimum of 1.
     - A "+" button, 48×48, `aria-label="More People"`.
     - The step buttons use the unpressed quick-pick style with the glyph at 1.5rem. When the field is empty or invalid, either button first treats the value as 1, then applies its step and the minimum of 1. There is no upper limit.
     - A message slot sits under the row, one line reserved: the empty prompt "Enter the number of people, like 4" whenever the field is blank (on the same keystroke, even while focused), an error when the value is invalid, blank otherwise.
   - **Field messages** (all three fields follow one rule): every field always has a message by it when it is empty or invalid, and the message appears or clears on the same keystroke that causes it; nothing waits for blur. Each slot has an `id`, the input's `aria-describedby` always points at it, and the slot has `aria-live="polite"`. There are two styles:
     - **Empty prompt** (nothing entered; not a mistake): text `--ink`, `--fs-small`, weight 600, `margin-top: var(--space-1)`. The field border stays `--line-strong` and the input keeps `aria-invalid="false"`. Calm enough to sit under Bill on first open without scolding anyone.
     - **Error** (something entered that cannot be used: negative, letters, zero people, out of range): the border becomes `--danger` with `box-shadow: inset 0 0 0 1px var(--danger)`, so it looks 2px wide without shifting the layout. The input gets `aria-invalid="true"`. The message is `--fs-small`, `--danger`, weight 600, `margin-top: var(--space-1)`. Colour is never the only signal, because the message text always appears.
     - "Empty" means no digits after stripping a leading "$", spaces and commas: "", "$" and "." are all empty; a lone "-" (with or without "$") is not empty but the negative error, as api-contract.md's parseBill says. Select-on-focus means retyping a value replaces it without passing through empty, so the prompt rarely flashes in normal use.
4. **Share** (after the form, `margin-top: var(--space-5)`)
   - "Copy Link" `<button type="button">`: full width, 48px, `--surface` background, 1px `--line-strong` border, `--ink` text, weight 600, `--radius-sm`, hover `--track`. It copies `window.location.href`, which the app keeps current. Success: the label becomes the inline check SVG plus "Link Copied" in `--good` for 2 seconds, then reverts. The button keeps its width, so nothing jumps. Check SVG: `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`. The button is always enabled.
   - Helper under it: "The link opens this same split for anyone you send it to." (`--fs-small`, `--muted`). When the clipboard write fails, this line is replaced by the failure message in `--danger`.
5. **Footer** (`margin-top: var(--space-6)`, centred, `--fs-small`, `--faint`)
   - "A project by XuSeak". The word "XuSeak" is an underlined link to `https://ai.xuseak.com/` (the same link the sibling XuSeak app Car TCO Compare uses), with `target="_blank" rel="noopener noreferrer"` and a visually hidden " (opens in a new tab)". Link colour `--muted`, hover `--ink`.

**States of the one screen**

| State | Display card | Fields | Rounding / status line |
|---|---|---|---|
| Empty (first open, or Bill blank) | "—" ×3 | Bill empty with its prompt "Enter the bill before tip, like 86.40" under it; 20% pressed; People 2 | "Enter the bill to see each person’s share." |
| Tip or People blank (even while still focused) | "—" ×3 | the blank field shows its prompt under it at once | "Enter a tip to see the split." or "Enter the number of people to see the split." (see UX Copy for two or more blank fields) |
| Bill is 0 | $0.00 ×3 (a real result, AC2) | Bill shows 0, no message | "Splits evenly: 2 × $0.00 = $0.00." (or the one-person line) |
| Even split | values | as entered | "Splits evenly: N × $S = $T." |
| Rounded-up split | values | as entered | "Rounded up to the cent: N × $S = $C, D over the Total." |
| One person | values (share = Total) | People 1, "−" disabled | "One person pays the full Total." |
| Invalid | "—" ×3 (never stale numbers) | the bad field shows its message | "Check the Bill to see the split." (names the bad field or fields) |
| Shared link | values from the URL | prefilled, no autofocus | as computed |
| Shared link with bad values | from the defaults | defaults, no error shown (a Bill that fell back to empty shows only its neutral prompt) | as computed or empty |

Placeholders appear only for a missing value (AC1) or an invalid one (AC6). A Bill of 0 is an entered value, so it computes like any other and shows $0.00 to the cent (AC2); it is not an error, so no message appears under it. Bill accepts a leading "$", spaces and thousands commas, which are stripped before parsing. "86." is read as 86, and "", "$" or "." alone count as empty (prompt, placeholders).

**Wider screens (600px and up).** The same single column, centred, with `padding-top: var(--space-6)`. There is no second column: the task is short and a two-column layout would split the answer from its inputs. Hover tints apply here, as described above.

**Page-level details.** `<html lang="en">`. Document `<title>` is exactly "Tip Calculator". Viewport meta is `width=device-width, initial-scale=1`, never `maximum-scale` or `user-scalable=no`. Use two theme-color metas, `<meta name="theme-color" content="#f4f5f2" media="(prefers-color-scheme: light)">` and `<meta name="theme-color" content="#16181c" media="(prefers-color-scheme: dark)">`; they follow the system, and a mismatch after a manual override only affects the browser bar. `body` uses `background: var(--surface-2)`, `color: var(--ink)`, `font-family: var(--font-sans)`, `font-size: var(--fs-body)` and `line-height: 1.5`. Override `baseline.css`'s `body` (its 14px size, 1240px max width and 22px padding) and its hard-coded dark body `#0f141b`.

## Design Tokens (CSS)

These use frontend-baseline's token names (`--ink`, `--muted`, `--faint`, `--line`, `--surface`, `--surface-2`, `--accent`, `--accent-d`, `--good`, `--track`, `--shadow-sm`, `--shadow`, `--radius`, `--radius-sm`) plus the additions marked below for this product. This is the only token source; there is no separate token file.

```css
:root {
  color-scheme: light;

  /* frontend-baseline names */
  --ink: #1b2a26;          /* primary text: 14.9:1 on surface, 13.6:1 on canvas */
  --muted: #56635e;        /* labels, helper text, placeholders: 6.2:1 surface, 5.7:1 canvas */
  --faint: #626e69;        /* footer: 5.3:1 surface, 4.8:1 canvas */
  --line: #dfe3dd;         /* decorative hairlines (card border, divider) */
  --surface: #ffffff;      /* display card, fields, unpressed buttons */
  --surface-2: #f4f5f2;    /* page canvas */
  --accent: #24776a;       /* pressed quick pick, focus ring: 5.3:1 vs white, 4.8:1 vs canvas */
  --accent-d: #1c6157;     /* hover on a pressed pick: 7.2:1 vs white text */
  --good: #1e7b3a;         /* "Link Copied": 5.3:1 surface */
  --track: #e8ebe6;        /* hover tint on unpressed controls */
  --shadow-sm: 0 1px 2px rgba(27, 42, 38, 0.06);
  --shadow: 0 1px 3px rgba(27, 42, 38, 0.06), 0 10px 24px rgba(27, 42, 38, 0.07);
  --radius: 16px;          /* display card */
  --radius-sm: 10px;       /* fields, buttons, theme control */

  /* additions for this product */
  --line-strong: #7d8782;  /* control borders (WCAG 1.4.11): 3.7:1 surface, 3.3:1 canvas */
  --on-accent: #ffffff;    /* text on --accent / --accent-d */
  --danger: #b42318;       /* field errors: 6.5:1 surface, 6.0:1 canvas */
  --focus: var(--accent);  /* focus ring colour */
  --font-sans: system-ui, -apple-system, "Segoe UI Variable", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --fs-body: 1rem;         /* 16px */
  --fs-small: 0.875rem;    /* 14px: helper, errors, rounding line, result labels */
  --fs-label: 0.9375rem;   /* 15px: field labels, "Each Person Pays" */
  --fs-title: 1.25rem;     /* 20px: h1 */
  --fs-input: 1.25rem;     /* 20px: Tip and People fields (>=16px stops iOS zoom) */
  --fs-input-lg: 1.5rem;   /* 24px: Bill field */
  --fs-result: 1.25rem;    /* 20px: Tip Amount, Total */
  --fs-hero: clamp(2.5rem, 1.75rem + 4vw, 3.25rem); /* ~42px at 360, 52px max: Each Person Pays */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --control-h: 48px;       /* quick picks, Tip and People fields, steppers, Copy Link */
  --control-h-lg: 56px;    /* Bill field */
  --page-max: 28rem;       /* 448px single column */
  --dur: 120ms;            /* colour transitions only; numbers never animate */
}

:root[data-theme="dark"] {
  color-scheme: dark;

  --ink: #edf0f5;          /* 13.7:1 surface, 15.5:1 canvas */
  --muted: #a9b0ba;        /* 7.2:1 surface, 8.1:1 canvas */
  --faint: #8d95a0;        /* 5.2:1 surface, 5.8:1 canvas */
  --line: #2e333b;
  --surface: #202329;      /* neutral charcoal card and fields */
  --surface-2: #16181c;    /* neutral charcoal canvas, no green cast */
  --accent: #85d0b8;       /* 8.7:1 surface, 9.9:1 canvas */
  --accent-d: #a3dcc9;     /* hover on a pressed pick (lighter in dark) */
  --good: #7fd69a;         /* 8.8:1 surface */
  --track: #2a2e35;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.35), 0 10px 24px rgba(0, 0, 0, 0.35);

  --line-strong: #6b737e;  /* 3.2:1 surface, 3.7:1 canvas */
  --on-accent: #10201c;    /* 9.4:1 on --accent */
  --danger: #ff8a80;       /* 6.8:1 surface, 7.7:1 canvas */
}

@media (prefers-reduced-motion: reduce) {
  :root { --dur: 0ms; }
}
```

How to use them: set `transition: background-color var(--dur), border-color var(--dur), color var(--dur)` on buttons and fields, and nothing else animates. Every ratio above was computed with the WCAG 2.x relative-luminance formula and rounded down. Re-check any colour added later.

## UX Copy

Labels use Title Case; helper, status and error text is plain prose. The apostrophes are typographic (’, U+2019), the multiplication sign is × (U+00D7) and the minus button glyph is − (U+2212).

**Page and Chrome**

| Where | Text |
|---|---|
| Document `<title>` | Tip Calculator |
| `<meta name="description">` | Split a dinner bill with the tip, to the cent. Enter the bill, pick a tip, set the people. |
| `h1` | Tip Calculator |
| Theme control | group label "Theme" (`aria-label`); buttons "Light" and "Dark" |
| Footer | A project by XuSeak (link on "XuSeak"; hidden suffix " (opens in a new tab)") |

**Inputs and Primary Actions**

| Element | Visible text | Accessible name or notes |
|---|---|---|
| Bill label | Bill | the "$" prefix is `aria-hidden` |
| Tip label | Tip | the field's name is "Tip"; the "%" suffix is `aria-hidden` |
| Quick picks | 15% · 18% · 20% · 25% | group `aria-label="Tip Quick Picks"`; each has `aria-pressed` |
| Bill message slot | Enter the bill before tip, like 86.40 (when empty) | linked with `aria-describedby` |
| Tip helper | Tap a pick or type any percent from 0 to 100. | linked with `aria-describedby` |
| People label | People | |
| Stepper buttons | − and + | `aria-label` "Fewer People" and "More People" |
| Share button | Copy Link | becomes "Link Copied" (with a check mark) for 2 seconds |
| Share helper | The link opens this same split for anyone you send it to. | |

**Results**

| Element | Text |
|---|---|
| Hero label | Each Person Pays |
| Secondary labels | Tip Amount · Total |
| Placeholder value | — (screen readers hear "Not calculated yet") |
| Money format | `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`, for example $1,234.56 |

**Empty State, Status and Rounding Line** (one slot under the hero number; only one message shows at a time, in this order of priority)

| Condition | Text |
|---|---|
| A non-empty field is invalid | Check the Bill to see the split. · Check the Tip to see the split. · Check People to see the split. With two fields: Check Bill and Tip to see the split. With all three: Check Bill, Tip and People to see the split. (Names only the invalid fields; an empty field alongside still shows its own prompt by the field.) |
| Only Bill is empty (no field invalid) | Enter the bill to see each person’s share. |
| Only Tip is empty (no field invalid) | Enter a tip to see the split. |
| Only People is empty (no field invalid) | Enter the number of people to see the split. |
| Two or three fields empty (no field invalid) | Fill in Bill and Tip to see the split. · Fill in Bill and People to see the split. · Fill in Tip and People to see the split. · Fill in Bill, Tip and People to see the split. |
| People = 1 (any valid Bill, 0 included) | One person pays the full Total. |
| Even split (Share × People = Total; a Bill of 0 lands here) | Splits evenly: 4 × $25.92 = $103.68. · With Bill 0: Splits evenly: 2 × $0.00 = $0.00. |
| Rounded-up split, difference under $1 | Rounded up to the cent: 3 × $39.34 = $118.02, 2¢ over the Total. |
| Rounded-up split, difference $1 or more (only possible above 100 people) | Rounded up to the cent: 150 × $0.81 = $121.50, $1.25 over the Total. (This example only shows the format: a Total of $120.25 split 150 ways. The difference is formatted as currency.) |

**Field Messages: Empty Prompts and Errors** (always shown directly under the field, in its message slot; short and plain)

| Field | Condition | Style | Text | When it shows |
|---|---|---|---|---|
| Bill | empty ("", "$", ".") | empty prompt | Enter the bill before tip, like 86.40 | immediately: on first open and on the keystroke that empties it, even while focused |
| Bill | letters or malformed (`86.4o`, `8.6.4`) | error | Enter a number, like 86.40 | on the keystroke |
| Bill | negative (including a lone "-") | error | The bill can’t be negative | on the keystroke |
| Bill | more than 2 decimals | error | Use dollars and cents, like 86.40 | on the keystroke |
| Bill | 0 | none | (no message; a valid value, results show $0.00) | n/a |
| Tip | empty | empty prompt | Enter a tip, like 20 | on the keystroke that empties it, even while focused |
| Tip | letters, below 0 or above 100 | error | Enter a tip from 0 to 100 | on the keystroke |
| People | empty | empty prompt | Enter the number of people, like 4 | on the keystroke that empties it, even while focused |
| People | 0, negative, decimal or letters | error | Enter a whole number, 1 or more | on the keystroke |
| Copy Link | clipboard write rejected | error | Couldn’t copy. Copy the link from the address bar. | on tap |

No message waits for blur: a field emptied while it still has focus shows its prompt at once, and the status line under the hero number says which field to fill in. Empty prompts use the calm style because an empty field is not a mistake; errors use red. While any field is empty or invalid, the results show placeholders; once all three hold valid values, they show the computed amounts, $0.00 included.

**Screen-Reader Announcements** (one visually hidden `role="status"` region, updated 700 ms after the last change, and only when the results are valid)

- Format: "Each person pays $25.92. Total $103.68." followed by the rounding sentence when the split is rounded up: "Each person pays $39.34. Total $118.00. Rounded up to the cent, 2¢ over the Total."
- Copy success: "Link copied."

## Accessibility Notes

**Contrast (WCAG AA, both themes; ratios in the token comments).** All text is at least 4.5:1 on the surface it sits on: ink, muted and faint on both the card and the canvas, the error red, the success green, and white or dark text on the accent. The large hero and result text clears this with a wide margin. Control boundaries and state indicators meet 3:1 under 1.4.11 Non-text Contrast: field and button borders use `--line-strong`, and a pressed pick's accent fill is 4.8:1 against the canvas. `--line` is decorative only and never the only edge of a control. The focus ring (`--accent`) is at least 4.8:1 against the canvas in light mode and 9.9:1 in dark.

**Not colour alone.** Errors always show a text message, and the red border is extra. Empty prompts are text in `--ink` (14.9:1 on the card, 13.6:1 on the canvas in light). A pressed quick pick differs in both fill and text colour (a solid fill against an outline), and `aria-pressed` announces it. The pressed theme segment is an inverted solid fill. In Windows High Contrast (`@media (forced-colors: active)`), give pressed buttons `outline: 3px solid Highlight` and pressed theme segments `forced-color-adjust: none` or an equivalent outline, because forced colours remove background fills.

**Focus order** (matches the visual order; no positive `tabindex`). Light → Dark → Bill → 15% → 18% → 20% → 25% → Tip field → Fewer People → People field → More People → Copy Link → XuSeak link. The results are text and not focusable. Bill is auto-focused only when the page opens without a bill in the URL, because entering the bill is the page's single first task. A shared link keeps focus at the top.

**Visible focus.** For every button, field and link: `:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }`. Text fields show this ring whenever they are focused. **Do not keep `baseline.css`'s `input:focus { outline: none }` and its faint 15% halo.** The 2px offset keeps the ring visible next to a pressed (accent-filled) pick.

**Keyboard.** Everything works without a pointer. Tab and Shift+Tab move through the order above. Space and Enter activate buttons. Enter in a field never submits or reloads (`preventDefault` on the form) and blurs the field. ArrowUp and ArrowDown step Tip (0 to 100) and People (minimum 1). Focusing a field selects its text, so typing replaces the value. "Fewer People" is `disabled` at 1. The page has no traps, no modals and no keyboard shortcuts to learn.

**Labels and semantics.** Every input has a visible `<label for>`: Bill, Tip, People. Quick picks sit in a labelled group. Each field's message slot (empty prompt or error) is linked with `aria-describedby`, so the Bill prompt is read when the auto-focused Bill field is announced on first open. Only errors set `aria-invalid="true"`; an empty prompt keeps `aria-invalid="false"`. Message slots use `aria-live="polite"`, so a prompt or error that appears while typing, including when a focused field is emptied, is heard. Results are a `<dl>`. Headings: one `h1`. Icon-like controls ("−", "+") have `aria-label`s. The external link announces that it opens a new tab.

**Touch targets.** Every interactive control except the theme segments is at least 48px tall, and the quick picks are at least 52px wide at 360px. The theme segments are 40px, a secondary control that is still well above the 24px AA minimum (2.5.8).

**Reflow and zoom.** There is no horizontal scroll at 360px or at 320px. The Tip row wraps its field to a new line and long amounts wrap with `overflow-wrap: anywhere`. Grids use `min()` caps and `min-width: 0` on text-bearing children, per `responsive-and-a11y.md`. Pinch zoom stays enabled. Input text is 16px or larger, so iOS doesn't zoom in on focus.

**Reduced motion.** Only colour transitions exist (120 ms), and `prefers-reduced-motion: reduce` sets `--dur: 0ms`. Numbers never count up or animate, and the theme switch is instant. The "Link Copied" swap is a text change, not an animation.

**Theme.** No flash of the wrong theme: the `theme-init.html` script runs in `<head>` before the stylesheet and bundle, and `color-scheme` follows the theme so native controls and scrollbars match.

## Engineering Notes (UX Decisions to Respect)

- The display card comes before the inputs in both the DOM and the visual order. Do not reorder the page with CSS `order`.
- Results recompute on every keystroke, synchronously, with no debounce and no submit. Only the screen-reader status waits 700 ms.
- An invalid or empty input means placeholders. Never leave the last valid numbers on screen.
- A Bill of 0 is a value, not empty: compute it and show $0.00 to the cent. Placeholders are reserved for "nothing entered" and invalid input.
- Every field message (empty prompt or error) appears and clears on the keystroke, never on blur. Each field's message line is always reserved so nothing below it jumps.
- The Tip field and the quick picks are one value. A pick is pressed if and only if the value equals it.
- Use `type="text"` with `inputmode`, not `type="number"`. A number input hides letters from the app (its value becomes ""), so the "letters" error could never show, and it accepts "e".
- Don't reformat what the user typed (no cursor jumps). Only the results are formatted.
- Reserve two lines for the rounding line so the card never changes height.
- The whole UI uses no maths of its own: tip, total, share, difference and the even/rounded-up/one-person state all come from the Tech Lead's pure module.

## Open Design Questions

- A native share sheet (`navigator.share`) on phones in addition to Copy Link. It is one tap fewer in a group chat but behaves differently on each platform and is harder for QA to test, so it is left out for now.
- A third "System" theme segment, to return to following the device after an override. It is left out to match the owner's labelled Light/Dark convention and the init script's two values; for now, clearing site data returns to the system setting.
