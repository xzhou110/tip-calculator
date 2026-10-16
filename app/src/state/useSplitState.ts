// The app's only input state: the three field texts, mirrored into the URL fragment
// (api-contract.md § URL-State Contract, runtime rules 1 to 5).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { evaluate } from '../lib/calc';
import { buildShareUrl, parseHash } from '../lib/urlState';
import type { Evaluation, FieldName, FieldTexts } from '../types';

const URL_WRITE_DELAY_MS = 150;

/** replaceState with the current link; skipped when nothing would change, and never throws. */
function writeUrl(fields: FieldTexts): void {
  try {
    const next = buildShareUrl(window.location.href, fields);
    if (next !== window.location.href) window.history.replaceState(window.history.state, '', next);
  } catch {
    // Safari's replaceState rate limit or a sandboxed frame: the next change writes again.
  }
}

/** A physical keyboard is likely, so autofocus will not pop a phone keyboard (design-doc focus rule). */
function hasFinePointer(): boolean {
  try {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  } catch {
    return false;
  }
}

function sameFields(a: FieldTexts, b: FieldTexts): boolean {
  return a.bill === b.bill && a.tip === b.tip && a.people === b.people;
}

export interface SplitState {
  fields: FieldTexts;
  setField: (name: FieldName, text: string) => void;
  evaluation: Evaluation;
  /** The link for the current fields; also flushes a pending address-bar write. */
  shareUrl: () => string;
  /** The hydrated Bill was empty and the device has a fine pointer. */
  autofocusBill: boolean;
}

export function useSplitState(): SplitState {
  // Rule 1: hydrate once, synchronously, so the first render already shows the link's values.
  const [fields, setFields] = useState<FieldTexts>(() => parseHash(window.location.hash));
  // Rule 5: decided from the hydrated value only, never re-evaluated.
  const [autofocusBill] = useState(() => fields.bill === '' && hasFinePointer());

  const evaluation = useMemo(() => evaluate(fields), [fields]);

  const setField = useCallback((name: FieldName, text: string) => {
    setFields((prev) => (prev[name] === text ? prev : { ...prev, [name]: text }));
  }, []);

  // Rule 2: write the link 150 ms after the last change (the first render writes too).
  const pendingTimer = useRef<number | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      pendingTimer.current = null;
      writeUrl(fields);
    }, URL_WRITE_DELAY_MS);
    pendingTimer.current = timer;
    return () => {
      window.clearTimeout(timer);
      if (pendingTimer.current === timer) pendingTimer.current = null;
    };
  }, [fields]);

  // Rule 3: a pasted or edited link in the same tab replaces the fields.
  useEffect(() => {
    const onHashChange = () => {
      const next = parseHash(window.location.hash);
      setFields((prev) => (sameFields(prev, next) ? prev : next));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Rule 4: correct even inside the 150 ms window, and flushes the pending write.
  const shareUrl = useCallback(() => {
    if (pendingTimer.current !== null) {
      window.clearTimeout(pendingTimer.current);
      pendingTimer.current = null;
    }
    writeUrl(fields);
    return buildShareUrl(window.location.href, fields);
  }, [fields]);

  return { fields, setField, evaluation, shareUrl, autofocusBill };
}
