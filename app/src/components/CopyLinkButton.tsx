import { useEffect, useRef, useState } from 'react';
import { CLIPBOARD_FAILED_MESSAGE, LINK_COPIED_ANNOUNCEMENT } from '../lib/messages';

interface CopyLinkButtonProps {
  /** Returns the link for the current fields and flushes the pending address-bar write. */
  getUrl: () => string;
  /** Speaks through the page's one status region. */
  announce: (text: string) => void;
}

type CopyState = 'idle' | 'copied' | 'failed';

const COPIED_FOR_MS = 2000;
const SHARE_HELPER = 'The link opens this same split for anyone you send it to.';

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 8.5l3 3 7-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CopyLinkButton({ getUrl, announce }: CopyLinkButtonProps) {
  const [state, setState] = useState<CopyState>('idle');
  const revertTimer = useRef<number | null>(null);

  function clearRevertTimer(): void {
    if (revertTimer.current !== null) window.clearTimeout(revertTimer.current);
    revertTimer.current = null;
  }

  useEffect(() => clearRevertTimer, []);

  async function copy(): Promise<void> {
    const url = getUrl();
    try {
      const clipboard = navigator.clipboard;
      if (!clipboard || typeof clipboard.writeText !== 'function') throw new Error('Clipboard unavailable');
      await clipboard.writeText(url);
    } catch {
      // An earlier success's timer must not swap the failure line back to the helper (R-3).
      clearRevertTimer();
      setState('failed');
      announce(CLIPBOARD_FAILED_MESSAGE);
      return;
    }
    setState('copied');
    announce(LINK_COPIED_ANNOUNCEMENT);
    clearRevertTimer();
    revertTimer.current = window.setTimeout(() => {
      revertTimer.current = null;
      setState('idle');
    }, COPIED_FOR_MS);
  }

  return (
    <div className="share">
      <button type="button" className="btn copy" data-state={state} onClick={() => void copy()}>
        {state === 'copied' ? (
          <span className="copy-done">
            <CheckIcon />
            Link Copied
          </span>
        ) : (
          'Copy Link'
        )}
      </button>
      <p className={state === 'failed' ? 'share-help share-help--error' : 'share-help'}>
        {state === 'failed' ? CLIPBOARD_FAILED_MESSAGE : SHARE_HELPER}
      </p>
    </div>
  );
}
