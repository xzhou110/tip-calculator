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
