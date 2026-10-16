import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BillField } from './components/BillField';
import { CopyLinkButton } from './components/CopyLinkButton';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { PeopleField } from './components/PeopleField';
import { ResultsCard } from './components/ResultsCard';
import { SrStatus } from './components/SrStatus';
import type { LiveMessage } from './components/SrStatus';
import { TipField } from './components/TipField';
import { announcement, fieldMessages, statusLine } from './lib/messages';
import { useSplitState } from './state/useSplitState';
import { useTheme } from './state/useTheme';

/** The screen-reader summary waits for a pause in typing; the visible results never wait. */
const ANNOUNCE_DELAY_MS = 700;

export default function App() {
  const { theme, choose } = useTheme();
  const { fields, setField, evaluation, shareUrl, autofocusBill } = useSplitState();
  const messages = useMemo(() => fieldMessages(evaluation.parsed), [evaluation]);
  const status = useMemo(() => statusLine(evaluation), [evaluation]);

  const [live, setLive] = useState<LiveMessage>({ id: 0, text: '' });
  /** Always speaks, even the same sentence twice (Copy Link pressed again). */
  const announceNow = useCallback((text: string) => setLive((prev) => ({ id: prev.id + 1, text })), []);

  // After a change, speak the new split (or clear a stale one); the first render stays silent.
  const firstEvaluation = useRef(evaluation);
  useEffect(() => {
    if (evaluation === firstEvaluation.current) return undefined;
    const timer = window.setTimeout(() => {
      const text = announcement(evaluation) ?? '';
      setLive((prev) => (prev.text === text ? prev : { id: prev.id + 1, text }));
    }, ANNOUNCE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [evaluation]);

  return (
    <div className="page">
      <Header theme={theme} onChooseTheme={choose} />
      <main>
        <ResultsCard evaluation={evaluation} status={status} />
        <form className="inputs" noValidate onSubmit={(event) => event.preventDefault()}>
          <BillField
            value={fields.bill}
            message={messages.bill}
            autoFocus={autofocusBill}
            onChange={(text) => setField('bill', text)}
          />
          <TipField
            value={fields.tip}
            parse={evaluation.parsed.tip}
            message={messages.tip}
            onChange={(text) => setField('tip', text)}
          />
          <PeopleField
            value={fields.people}
            parse={evaluation.parsed.people}
            message={messages.people}
            onChange={(text) => setField('people', text)}
          />
        </form>
        <CopyLinkButton getUrl={shareUrl} announce={announceNow} />
        <SrStatus id={live.id} text={live.text} />
      </main>
      <Footer />
    </div>
  );
}
