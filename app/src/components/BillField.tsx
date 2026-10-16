import type { FieldMessage } from '../types';
import { FieldMessageLine } from './FieldMessageLine';
import { blurOnEnter, useSelectOnFocus } from './inputBehavior';

interface BillFieldProps {
  value: string;
  message: FieldMessage;
  autoFocus: boolean;
  onChange: (text: string) => void;
}

export function BillField({ value, message, autoFocus, onChange }: BillFieldProps) {
  const selectOnFocus = useSelectOnFocus();
  return (
    <div className="field">
      <label className="field-label" htmlFor="bill">
        Bill
      </label>
      <div className="affix-box">
        <span className="affix affix--prefix" aria-hidden="true">
          $
        </span>
        <input
          id="bill"
          className="input input--bill"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          spellCheck={false}
          autoFocus={autoFocus}
          value={value}
          aria-invalid={message.tone === 'error'}
          aria-describedby="bill-msg"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={blurOnEnter}
          {...selectOnFocus}
        />
      </div>
      <FieldMessageLine id="bill-msg" message={message} />
    </div>
  );
}
