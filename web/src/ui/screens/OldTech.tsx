import { useState } from 'preact/hooks';
import { engine } from '../engine';
import { useApp } from '../store';
import { hrefFor, goBack } from '../router';
import { openRound, openReveal, shortDate } from '../actions';
import { Screen } from '../components/Screen';
import { Announcer } from '../components/BottomBar';
import { Button, LinkButton } from '../components/Button';
import { Icon } from '../components/Icons';
import { Exchange } from '../components/Exchange';
import { OLD_TECH_INTRO } from '../../engine/api';

export function OldTechScreen() {
  const app = useApp();
  const [message, setMessage] = useState<string | null>(null);
  if (!app.save || !app.content) return null;
  const entries = engine.oldTechList(app.save, app.content, app.today);
  function next() {
    const result = engine.nextWord(app.save!, app.content!, 'oldtech', app.today);
    if ('entry' in result) openRound(result.entry.key, result.entry.itemId, 'oldtech');
    else setMessage(result.message);
  }
  return (
    <Screen title="Floyd's Old Tech">
      <Exchange
        lines={[{ speaker: 'floyd', text: OLD_TECH_INTRO }]}
      />
      <p class="small">Just for fun: this doesn't change your streak or Days learned.</p>
      {entries.length ? (
        <ul class="rows">
          {entries.map((entry, i) => (
            <li key={entry.key}>
              {entry.open ? (
                <a
                  class="row-link"
                  href={hrefFor('play', entry.key)}
                  onClick={(event) => {
                    event.preventDefault();
                    if (entry.finished) openReveal(entry.key);
                    else openRound(entry.key, entry.itemId, 'oldtech');
                  }}
                >
                  <span class="main">
                    <span class="title">{entry.label}</span>
                    <span class="note">
                      Old tech {i + 1}{entry.date ? ' · ' + shortDate(entry.date) : ''}
                    </span>
                  </span>
                  {entry.finished ? (
                    <span class="mark">
                      <Icon name="check" />
                    </span>
                  ) : null}
                </a>
              ) : (
                <div class="row-link" aria-disabled="true">
                  <span class="main">
                    <span class="title">{entry.label}</span>
                    <span class="note">
                      Old tech {i + 1} · <Icon name="lock" /> {entry.lockLine}
                    </span>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {message ? (
        <div class="note-box">
          <p>{message}</p>
          <Button onClick={() => goBack()}>Back</Button>
        </div>
      ) : null}
      <div class="stack-sm">
        <Button primary block onClick={next}>
          Next word
        </Button>
        <LinkButton block href={hrefFor('home')}>
          Home
        </LinkButton>
      </div>
      <Announcer message={message || ''} />
    </Screen>
  );
}
