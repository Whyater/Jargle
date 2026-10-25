import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { leaveDemoHref, restartDemo, useApp } from '../store';
import { hrefFor } from '../router';
import { Button } from './Button';
import { Icon } from './Icons';

interface ScreenProps {
  title: string;
  children: ComponentChildren;
  focusKey?: string;
  isHome?: boolean;
  /** The sheet's header line, for example "No. 12 · Fri, Oct 30". */
  runhead?: string;
  /** Optional right side of the header line, for example "Card 2 of 3". */
  runheadRight?: string;
  /** Hide the visible h1 (the heading is still there for screen readers). */
  quietTitle?: boolean;
}

/**
 * Frame for every screen: Home / Settings / How to play, the running head, the demo strip,
 * and the heading that takes focus when the screen opens.
 */
export function Screen({ title, children, focusKey, isHome, runhead, runheadRight, quietTitle }: ScreenProps) {
  const app = useApp();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = isHome ? 'Jargle' : title + ' | Jargle';
    // Move focus to the heading so screen readers start at the top of the new screen.
    if (heading.current) heading.current.focus();
    window.scrollTo(0, 0);
  }, [title, focusKey]);

  return (
    <div class="sheet">
      <nav class="topbar" aria-label="Main">
        {isHome ? (
          <span class="brand">Jargle</span>
        ) : (
          <a class="nav-link" href={hrefFor('home')}>
            <Icon name="home" />
            Home
          </a>
        )}
        <span class="spacer" />
        <a class="nav-link" href={hrefFor('settings')}>
          Settings
        </a>
        <a class="nav-link" href={hrefFor('how')}>
          How to play
        </a>
      </nav>
      {app.demo ? <DemoStrip full={!!isHome && app.demo === 'new'} /> : null}
      {app.status !== 'ready' || app.canSave ? null : (
        <p class="note-box small" style={{ marginTop: '0.5rem' }}>
          Progress can't be saved in this window.
        </p>
      )}
      {runhead ? (
        <p class="runhead">
          <span>{runhead}</span>
          {runheadRight ? <span>{runheadRight}</span> : null}
        </p>
      ) : null}
      <h1 class={quietTitle ? 'screen-title visually-hidden' : 'screen-title'} tabIndex={-1} ref={heading}>
        {title}
      </h1>
      <main>{children}</main>
    </div>
  );
}

/**
 * The new-player Home spells out which demo this is (the judge Home has its own longer line).
 * Other screens keep it to one short row to save space.
 */
function DemoStrip({ full }: { full: boolean }) {
  let label = 'Demo';
  if (full) label = 'Demo: a new player.';
  return (
    <div class={full ? 'demo-strip' : 'demo-strip compact'}>
      <div class="row">
        <p class="label">{label}</p>
        <Button small onClick={() => restartDemo()}>
          Restart demo
        </Button>
        <a class="btn btn-small" href={leaveDemoHref()}>
          <span>Leave demo</span>
        </a>
      </div>
    </div>
  );
}
