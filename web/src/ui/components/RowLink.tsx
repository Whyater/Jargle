import type { ComponentChildren } from 'preact';
import { Icon } from './Icons';

interface RowLinkProps {
  title: ComponentChildren;
  note?: ComponentChildren;
  href?: string;
  onClick?: () => void;
  /** Right-hand mark: a check for done, a lock for not open yet. */
  mark?: 'check' | 'lock' | null;
  /** Locked rows stay in the list but cannot be opened. */
  locked?: boolean;
}

/** One banded row in a .rows list. A link when it has an href, else a button. */
export function RowLink({ title, note, href, onClick, mark, locked }: RowLinkProps) {
  const inside = (
    <>
      <span class="main">
        <span class="title">{title}</span>
        {note ? <span class="note">{note}</span> : null}
      </span>
      {mark ? (
        <span class="mark">
          <Icon name={mark} />
        </span>
      ) : null}
    </>
  );
  if (locked) {
    return (
      <div class="row-link is-locked" aria-disabled="true">
        {inside}
      </div>
    );
  }
  if (href) {
    return (
      <a class="row-link" href={href}>
        {inside}
      </a>
    );
  }
  return (
    <button type="button" class="row-link" onClick={onClick}>
      {inside}
    </button>
  );
}
