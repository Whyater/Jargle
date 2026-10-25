import { engine } from '../engine';
import { commit, useApp } from '../store';
import { navigate } from '../router';
import { openRound } from '../actions';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { MascotPair } from '../components/Mascot';
import { Badge } from '../components/art';
import { newBadgesByRound } from './roundLogic';
import { roundSummaryLine } from './listLogic';
import type { ContentBundle, PtpSet, SaveState } from '../../engine/types';
import { ptpRoundCardLines, ptpTotalLine, ptpBestLine } from '../../engine/api';

function ptpKey(set: PtpSet, r: number): string {
  return 'ptp:' + set.id + ':' + r;
}

function isEnded(save: SaveState, key: string): boolean {
  const record = save.rounds[key];
  return !!record && record.status !== 'playing';
}

export function PtpScreen() {
  const app = useApp();
  if (!app.save || !app.content) return null;
  const save = app.save;
  const content = app.content;
  const today = app.today;
  const set = save.ptpSet;

  function startSet() {
    commit(engine.startPtpSet(save, content, today));
  }

  if (!set) return <StartCard onStart={startSet} />;
  if (set.done || (set.r === set.rounds.length && isEnded(save, ptpKey(set, set.rounds.length)))) {
    return <Summary save={save} content={content} today={today} set={set} onStart={startSet} />;
  }

  // A round that ended without the reveal moving the set on (for example after a reload).
  let r = set.r;
  if (isEnded(save, ptpKey(set, r)) && r < set.rounds.length) {
    r = r + 1;
  }
  const key = ptpKey(set, r);
  const itemId = engine.ptpRoundItem(save, r);
  if (!itemId) return <StartCard onStart={startSet} />;
  const roundItemId = itemId;
  const record = save.rounds[key];

  if (record && record.status === 'playing') {
    return (
      <Screen title="Pass the Phone" focusKey="continue">
        <div class="stack">
          <p>Round {r} of {set.rounds.length}.</p>
          <Button primary block onClick={() => navigate('play', key)}>
            Continue
          </Button>
        </div>
      </Screen>
    );
  }

  function beReader() {
    if (r !== set!.r) commit(engine.advancePtp(save));
    openRound(key, roundItemId, 'ptp');
  }

  const item = content.items[itemId];
  const cardLines = ptpRoundCardLines(r, Boolean(item && item.old_tech));
  cardLines[2] = 'Round ' + r + ' of ' + set.rounds.length + '.';
  return (
    <Screen title="Pass the Phone" focusKey={'round-' + r}>
      <div class="stack">
        <MascotPair size={64} />
        <p>
          <strong>{cardLines[0]}</strong>
        </p>
        <p>{cardLines[1]}</p>
        <p class="result-line">{cardLines[2]}</p>
        <p class="small">{cardLines[3]}</p>
        <p class="note-box beige">{cardLines[4]}</p>
        <p>{cardLines[5]}</p>
        <Button primary block onClick={beReader}>
          I'm the reader.
        </Button>
      </div>
    </Screen>
  );
}

function StartCard({ onStart }: { onStart: () => void }) {
  return (
    <Screen title="Pass the Phone" focusKey="start">
      <div class="stack">
        <MascotPair size={64} />
        <p>
          <strong>{ptpRoundCardLines(1, false)[0]}</strong>
        </p>
        <p>{ptpRoundCardLines(1, false)[1]}</p>
        <p class="small">{ptpRoundCardLines(1, false)[3]}</p>
        <Button primary block onClick={onStart}>
          Start a set
        </Button>
      </div>
    </Screen>
  );
}

interface SummaryProps {
  save: SaveState;
  content: ContentBundle;
  today: string;
  set: PtpSet;
  onStart: () => void;
}

function Summary({ save, content, today, set, onStart }: SummaryProps) {
  const summary = engine.ptpSummary(save, content);
  // Taught Someone is earned by the last round finish, so its badge is kept under that round.
  const badgeIds = newBadgesByRound.get(ptpKey(set, set.rounds.length)) || [];
  const badgeNames = engine.badgeViews(save, content, today);
  return (
    <Screen title="Pass the Phone" focusKey="summary">
      <div class="stack-lg">
        <div class="stack-sm">
          <p>
            <strong>{ptpTotalLine(summary.total)}</strong>
          </p>
          <p>{ptpBestLine(summary.best)}</p>
        </div>
        <ol class="rows">
          {summary.rounds.map((round, index) => (
            <li key={round.itemId} class="summary-row">
              <span class="title">
                Round {index + 1}: {round.term}
              </span>
              <span class="note">{roundSummaryLine(round)}</span>
            </li>
          ))}
        </ol>
        {badgeIds.map((id) => {
          let name: string = id;
          for (const view of badgeNames) {
            if (view.id === id) name = view.name;
          }
          return (
            <div class="new-badge stamp" key={id}>
              <Badge id={id} earned size={72} />
              <p>New badge: {name}</p>
            </div>
          );
        })}
        <div class="stack-sm">
          <Button primary block onClick={() => navigate('home')}>
            Done
          </Button>
          <Button block onClick={onStart}>
            Start a new set
          </Button>
        </div>
      </div>
    </Screen>
  );
}
