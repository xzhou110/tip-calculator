import { formatMoney } from '../lib/format';
import type { Cents, Evaluation, StatusLine } from '../types';

interface ResultsCardProps {
  evaluation: Evaluation;
  status: StatusLine;
}

const EM_DASH = '—';

/** A computed amount, or the placeholder that never shows a stale or zero number (AC1, AC6). */
function ResultValue({ cents }: { cents: Cents | null }) {
  if (cents === null) {
    return (
      <>
        <span aria-hidden="true">{EM_DASH}</span>
        <span className="visually-hidden">Not calculated yet</span>
      </>
    );
  }
  return <>{formatMoney(cents)}</>;
}

/** The display card: renders only what the pure modules computed; it does no arithmetic. */
export function ResultsCard({ evaluation, status }: ResultsCardProps) {
  const result = evaluation.status === 'ready' ? evaluation.result : null;
  const placeholder = result === null ? ' is-placeholder' : '';
  return (
    <section className="card results" aria-label="Results">
      <dl className="results-list">
        <div className="result result--hero">
          <dt className="result-label result-label--hero">Each Person Pays</dt>
          <dd className={`hero-value${placeholder}`}>
            <ResultValue cents={result?.shareCents ?? null} />
          </dd>
          <dd className={`status status--${status.tone}`}>
            {status.lead}
            {status.strong !== '' && <strong>{status.strong}</strong>}
            {status.tail}
          </dd>
        </div>
        <div className="result">
          <dt className="result-label">Tip Amount</dt>
          <dd className={`result-value${placeholder}`}>
            <ResultValue cents={result?.tipCents ?? null} />
          </dd>
        </div>
        <div className="result">
          <dt className="result-label">Total</dt>
          <dd className={`result-value${placeholder}`}>
            <ResultValue cents={result?.totalCents ?? null} />
          </dd>
        </div>
      </dl>
    </section>
  );
}
