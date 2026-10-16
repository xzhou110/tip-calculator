// Every string the UI renders for a field, the status line and the screen-reader region
// (api-contract.md § Error Shapes the UI Renders). Pure: no DOM, no React.
// The copy uses the typographic apostrophe ’ (U+2019), × (U+00D7) and ¢ (U+00A2).
import type {
  BillParse,
  Evaluation,
  FieldMessage,
  FieldName,
  ParsedFields,
  PeopleParse,
  StatusLine,
  TipParse,
} from '../types';
import { formatCount, formatMoney, formatOverage } from './format';

export const CLIPBOARD_FAILED_MESSAGE = 'Couldn’t copy. Copy the link from the address bar.';
export const LINK_COPIED_ANNOUNCEMENT = 'Link copied.';

const NONE: FieldMessage = { tone: 'none', text: '' };

function prompt(text: string): FieldMessage {
  return { tone: 'prompt', text };
}

function error(text: string): FieldMessage {
  return { tone: 'error', text };
}

export function billMessage(p: BillParse): FieldMessage {
  if (p.status === 'valid') return NONE;
  if (p.status === 'empty') return prompt('Enter the bill before tip, like 86.40');
  switch (p.problem) {
    case 'malformed':
      return error('Enter a number, like 86.40');
    case 'negative':
      return error('The bill can’t be negative');
    case 'tooManyDecimals':
      return error('Use dollars and cents, like 86.40');
    case 'tooLarge':
      return error('Enter a bill under $1 billion');
  }
}

export function tipMessage(p: TipParse): FieldMessage {
  if (p.status === 'valid') return { tone: 'helper', text: 'Tap a pick or type any percent from 0 to 100.' };
  if (p.status === 'empty') return prompt('Enter a tip, like 20');
  switch (p.problem) {
    case 'malformed':
    case 'outOfRange':
      return error('Enter a tip from 0 to 100');
    case 'tooManyDecimals':
      return error('Use up to two decimals, like 17.5');
  }
}

export function peopleMessage(p: PeopleParse): FieldMessage {
  if (p.status === 'valid') return NONE;
  if (p.status === 'empty') return prompt('Enter the number of people, like 4');
  switch (p.problem) {
    case 'notWhole':
      return error('Enter a whole number, 1 or more');
    case 'tooLarge':
      return error('Enter a smaller number of people');
  }
}

export function fieldMessages(parsed: ParsedFields): Readonly<Record<FieldName, FieldMessage>> {
  return {
    bill: billMessage(parsed.bill),
    tip: tipMessage(parsed.tip),
    people: peopleMessage(parsed.people),
  };
}

const FIELD_LABEL: Readonly<Record<FieldName, string>> = { bill: 'Bill', tip: 'Tip', people: 'People' };

/** "Bill", "Bill and Tip", "Bill, Tip and People" (the names are already in field order). */
function joinLabels(names: readonly FieldName[]): string {
  const labels = names.map((name) => FIELD_LABEL[name]);
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

/** One invalid field takes an article for Bill and Tip ("Check the Bill"), none for People. */
const CHECK_ONE: Readonly<Record<FieldName, string>> = { bill: 'the Bill', tip: 'the Tip', people: 'People' };

const ENTER_ONE: Readonly<Record<FieldName, string>> = {
  bill: 'Enter the bill to see each person’s share.',
  tip: 'Enter a tip to see the split.',
  people: 'Enter the number of people to see the split.',
};

function muted(kind: StatusLine['kind'], lead: string): StatusLine {
  return { kind, tone: 'muted', lead, strong: '', tail: '' };
}

/** The one line under the hero number; the first matching row of the contract's table wins. */
export function statusLine(e: Evaluation): StatusLine {
  if (e.status === 'incomplete') {
    if (e.invalid.length > 0) {
      const names = e.invalid.length === 1 ? CHECK_ONE[e.invalid[0]] : joinLabels(e.invalid);
      return muted('invalid', `Check ${names} to see the split.`);
    }
    if (e.empty.length === 1) return muted('empty', ENTER_ONE[e.empty[0]]);
    return muted('empty', `Fill in ${joinLabels(e.empty)} to see the split.`);
  }
  const { result, inputs } = e;
  const n = formatCount(inputs.people);
  const share = formatMoney(result.shareCents);
  switch (result.kind) {
    case 'one':
      return muted('one', 'One person pays the full Total.');
    case 'even':
      return muted('even', `Splits evenly: ${n} × ${share} = ${formatMoney(result.totalCents)}.`);
    case 'roundedUp':
      return {
        kind: 'roundedUp',
        tone: 'ink',
        lead: `Rounded up to the cent: ${n} × ${share} = ${formatMoney(result.collectedCents)}, `,
        strong: `${formatOverage(result.overageCents)} over the Total`,
        tail: '.',
      };
  }
}

/** The screen-reader sentence for a ready split; null otherwise (the UI debounces it 700 ms). */
export function announcement(e: Evaluation): string | null {
  if (e.status !== 'ready') return null;
  const { result } = e;
  const base = `Each person pays ${formatMoney(result.shareCents)}. Total ${formatMoney(result.totalCents)}.`;
  if (result.kind !== 'roundedUp') return base;
  return `${base} Rounded up to the cent, ${formatOverage(result.overageCents)} over the Total.`;
}
