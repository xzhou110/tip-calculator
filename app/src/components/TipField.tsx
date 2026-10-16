import { TIP_PICKS_BP } from '../constants';
import { pressedPick, stepTip } from '../lib/calc';
import { formatPercentText } from '../lib/format';
import type { FieldMessage, TipParse } from '../types';
import { FieldMessageLine } from './FieldMessageLine';
import { arrowStep, blurFocusedInput, blurOnEnter, useSelectOnFocus } from './inputBehavior';

interface TipFieldProps {
  value: string;
  parse: TipParse;
  message: FieldMessage;
  onChange: (text: string) => void;
}

/** The quick picks and the custom field are one value: a pick is pressed if and only if the value equals it. */
export function TipField({ value, parse, message, onChange }: TipFieldProps) {
  const selectOnFocus = useSelectOnFocus();
  const pressed = pressedPick(parse);
  return (
    <div className="field">
      <label className="field-label" htmlFor="tip">
        Tip
      </label>
      <div className="tip-row">
        <div className="picks" role="group" aria-label="Tip Quick Picks">
          {TIP_PICKS_BP.map((bp) => (
            <button
              key={bp}
              type="button"
              className="btn pick"
              aria-pressed={pressed === bp}
              onClick={() => {
                blurFocusedInput();
                onChange(formatPercentText(bp));
              }}
            >
              {`${formatPercentText(bp)}%`}
            </button>
          ))}
        </div>
        <div className="affix-box tip-box">
          <input
            id="tip"
            className="input input--tip"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            enterKeyHint="done"
            spellCheck={false}
            value={value}
            aria-invalid={message.tone === 'error'}
            aria-describedby="tip-msg"
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              const delta = arrowStep(event);
              if (delta !== null) {
                event.preventDefault();
                onChange(stepTip(value, delta));
                return;
              }
              blurOnEnter(event);
            }}
            {...selectOnFocus}
          />
          <span className="affix affix--suffix" aria-hidden="true">
            %
          </span>
        </div>
      </div>
      <FieldMessageLine id="tip-msg" message={message} />
    </div>
  );
}
