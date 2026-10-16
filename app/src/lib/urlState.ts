// The three inputs in the URL fragment (api-contract.md § URL-State Contract). Pure: the caller passes
// the hash or href in; nothing here touches window or history.
import { DEFAULT_FIELDS, FIELD_ORDER } from '../constants';
import type { FieldName, FieldTexts } from '../types';
import { parseBill, parsePeople, parseTip } from './calc';
import { formatBillText, formatPercentText } from './format';

/** The canonical text of one field, or null when it is empty or invalid. */
function canonical(name: FieldName, raw: string): string | null {
  switch (name) {
    case 'bill': {
      const p = parseBill(raw);
      return p.status === 'valid' ? formatBillText(p.value) : null;
    }
    case 'tip': {
      const p = parseTip(raw);
      return p.status === 'valid' ? formatPercentText(p.value) : null;
    }
    case 'people': {
      const p = parsePeople(raw);
      return p.status === 'valid' ? String(p.value) : null;
    }
  }
}

/** Reads "#bill=86.40&tip=20&people=4"; each missing, empty or invalid field falls back to its default. Never throws. */
export function parseHash(hash: string): FieldTexts {
  let params: URLSearchParams | null = null;
  try {
    const text = String(hash);
    params = new URLSearchParams(text.startsWith('#') ? text.slice(1) : text);
  } catch {
    params = null;
  }
  const out: FieldTexts = { ...DEFAULT_FIELDS };
  if (params === null) return out;
  for (const name of FIELD_ORDER) {
    const value = params.get(name); // the first value of a repeated key wins
    const text = value === null ? null : canonical(name, value);
    if (text !== null) out[name] = text;
  }
  return out;
}

/** The valid fields as canonical pairs in field order, without "#"; '' when no field is valid. */
export function serializeHash(fields: FieldTexts): string {
  const params = new URLSearchParams();
  for (const name of FIELD_ORDER) {
    const text = canonical(name, fields[name]);
    if (text !== null) params.append(name, text);
  }
  return params.toString();
}

/** href without its fragment, plus "#" and the serialized fields (or nothing when there are none). */
export function buildShareUrl(href: string, fields: FieldTexts): string {
  const hashAt = href.indexOf('#');
  const base = hashAt === -1 ? href : href.slice(0, hashAt);
  const hash = serializeHash(fields);
  return hash === '' ? base : `${base}#${hash}`;
}
