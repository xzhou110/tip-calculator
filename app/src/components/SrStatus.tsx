export interface LiveMessage {
  /** Bumped for every announcement, so a repeated sentence (a second copy) is spoken again. */
  id: number;
  text: string;
}

/** The page's one visually hidden status region (design-doc § Screen-Reader Announcements). */
export function SrStatus({ id, text }: LiveMessage) {
  return (
    <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
      <span key={id}>{text}</span>
    </div>
  );
}
