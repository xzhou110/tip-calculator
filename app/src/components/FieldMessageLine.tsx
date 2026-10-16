import type { FieldMessage } from '../types';

interface FieldMessageLineProps {
  id: string;
  message: FieldMessage;
}

/** The one reserved line under a field: blank, helper, empty prompt or error (api-contract § FieldMessage). */
export function FieldMessageLine({ id, message }: FieldMessageLineProps) {
  return (
    <p id={id} className={`msg msg--${message.tone}`} aria-live="polite">
      {message.text}
    </p>
  );
}
