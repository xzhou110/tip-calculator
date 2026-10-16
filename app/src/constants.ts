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
