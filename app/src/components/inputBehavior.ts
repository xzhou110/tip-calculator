// Shared text-field behaviour (design-doc § Screen Descriptions and § Keyboard): select the text on
// focus so typing replaces it, and Enter or Done blurs the field (closing a phone keyboard).
import { useRef } from 'react';
import type { FocusEvent, KeyboardEvent, MouseEvent } from 'react';

export interface SelectOnFocusHandlers {
  onFocus: (event: FocusEvent<HTMLInputElement>) => void;
  onMouseDown: (event: MouseEvent<HTMLInputElement>) => void;
  onMouseUp: (event: MouseEvent<HTMLInputElement>) => void;
}

/**
 * Selects the whole text on focus. A click that focuses the field would otherwise drop the
 * selection on mouseup in Chromium and WebKit, so that one mouseup is cancelled.
 */
export function useSelectOnFocus(): SelectOnFocusHandlers {
  const focusingByPointer = useRef(false);
  return {
    onFocus: (event) => {
      const input = event.currentTarget;
      input.setSelectionRange(0, input.value.length);
    },
    onMouseDown: (event) => {
      focusingByPointer.current = document.activeElement !== event.currentTarget;
    },
    onMouseUp: (event) => {
      if (focusingByPointer.current) {
        event.preventDefault();
        focusingByPointer.current = false;
      }
    },
  };
}

/** Enter (or a phone's Done key) blurs the field and never submits; ignored mid IME composition. */
export function blurOnEnter(event: KeyboardEvent<HTMLInputElement>): boolean {
  if (event.key !== 'Enter' || event.nativeEvent.isComposing) return false;
  event.preventDefault();
  event.currentTarget.blur();
  return true;
}

/** ArrowUp is +1 and ArrowDown is -1; any other key is null. */
export function arrowStep(event: KeyboardEvent<HTMLInputElement>): 1 | -1 | null {
  if (event.key === 'ArrowUp') return 1;
  if (event.key === 'ArrowDown') return -1;
  return null;
}

/** Closes a phone keyboard when a button takes over from a focused text field. */
export function blurFocusedInput(): void {
  const active = document.activeElement;
  if (active instanceof HTMLInputElement) active.blur();
}
