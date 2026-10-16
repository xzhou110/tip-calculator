import { useRef } from 'react';
import { stepPeople } from '../lib/calc';
import type { FieldMessage, PeopleParse } from '../types';
import { FieldMessageLine } from './FieldMessageLine';
import { arrowStep, blurOnEnter, useSelectOnFocus } from './inputBehavior';

interface PeopleFieldProps {
  value: string;
  parse: PeopleParse;
  message: FieldMessage;
  onChange: (text: string) => void;
}

const MINUS_SIGN = '−';

export function PeopleField({ value, parse, message, onChange }: PeopleFieldProps) {
  const selectOnFocus = useSelectOnFocus();
  const moreButton = useRef<HTMLButtonElement>(null);
  const atMinimum = parse.status === 'valid' && parse.value === 1;
  return (
    <div className="field">
      <label className="field-label" htmlFor="people">
        People
      </label>
      <div className="stepper">
        <button
          type="button"
          className="btn step"
          aria-label="Fewer People"
          disabled={atMinimum}
          onClick={(event) => {
            const next = stepPeople(value, -1);
            onChange(next);
            // Reaching 1 disables this button; a keyboard user (detail 0) keeps focus on More People
            // instead of losing it to the page. A tap leaves focus alone so no phone keyboard opens.
            if (next === '1' && event.detail === 0) moreButton.current?.focus();
          }}
        >
          {MINUS_SIGN}
        </button>
        <input
          id="people"
          className="input input--people"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          enterKeyHint="done"
          spellCheck={false}
          value={value}
          aria-invalid={message.tone === 'error'}
          aria-describedby="people-msg"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            const delta = arrowStep(event);
            if (delta !== null) {
              event.preventDefault();
              onChange(stepPeople(value, delta));
              return;
            }
            blurOnEnter(event);
          }}
          {...selectOnFocus}
        />
        <button
          ref={moreButton}
          type="button"
          className="btn step"
          aria-label="More People"
          onClick={() => onChange(stepPeople(value, 1))}
        >
          +
        </button>
      </div>
      <FieldMessageLine id="people-msg" message={message} />
    </div>
  );
}
