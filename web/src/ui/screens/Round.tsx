import { useEffect, useRef, useState } from 'preact/hooks';
import type { RoundAction, RoundView } from '../../engine/api';
import { engine } from '../engine';
import { useApp, commit } from '../store';
import { goBack } from '../router';
import { playSound } from '../../platform/audio';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { AnswerCard } from '../components/AnswerCard';
import { Battery } from '../components/Battery';
import { Mascot } from '../components/Mascot';
import { BottomBar, InlineStrip, Announcer, usePinned } from '../components/BottomBar';
import { RoundAfter } from './RoundAfter';
import {
  newBadgesByRound,
  shouldIgnoreNextClue,
  stripTextAfterTap,
  tallestMessage,
} from './roundLogic';
import './round.css';

const endedRounds = new Set<string>();

/** "No. 12" for a daily round key like "d:12"; other rounds have no number. */
function catalogNumber(roundKey: string): string | undefined {
  if (roundKey.indexOf('d:') !== 0) return undefined;
  return 'No. ' + roundKey.slice(2);
}

export function RoundScreen({ roundKey }: { roundKey: string }) {
  const app = useApp();
  if (app.status !== 'ready' || !app.save || !app.content) return null;
  let view: RoundView;
  try {
    view = engine.roundView(app.save, app.content, roundKey, app.today);
  } catch {
    return (
      <Screen title="Word not found">
        <Button primary block onClick={goBack}>
          Back
        </Button>
      </Screen>
    );
  }
  if (!app.save.rounds[roundKey]) {
    return (
      <Screen title="Word not found">
        <Button primary block onClick={goBack}>
          Back
        </Button>
      </Screen>
    );
  }
  if (view.ended && view.record.post_step > 0) {
    return <RoundAfter roundKey={roundKey} view={view} />;
  }
  if (view.ended) {
    if (
      view.record.status === 'learned' &&
      view.cards.some((card) => card.state === 'missed') &&
      view.cards.some((card) => card.state === 'answer')
    ) {
      return <EndedMissBoard roundKey={roundKey} view={view} />;
    }
    return <RoundAfter roundKey={roundKey} view={view} />;
  }
  return <PlayingRound roundKey={roundKey} view={view} />;
}

function EndedMissBoard({ roundKey, view }: { roundKey: string; view: RoundView }) {
  const [open, setOpen] = useState(false);
  if (open) return <RoundAfter roundKey={roundKey} view={view} />;
  return (
    <Screen title={view.title} runhead={catalogNumber(roundKey)}>
      <div class="round stack">
        <div class="battery-wrap">
          <div class="battery-row">
            <Battery bars={view.bars} />
            <Mascot who="bud" size={56} mood="sympathetic" />
          </div>
          <p>{view.batteryLine}</p>
        </div>
        <ul class="cards">
          {view.cards.map((card, i) => (
            <li key={card.term}>
              <AnswerCard card={card} index={i + 1} onPick={() => undefined} />
            </li>
          ))}
        </ul>
        <Button primary block onClick={() => setOpen(true)}>
          See what it means
        </Button>
        <Announcer message="" />
      </div>
    </Screen>
  );
}

function PlayingRound({ roundKey, view }: { roundKey: string; view: RoundView }) {
  const app = useApp();
  const save = app.save!;
  const content = app.content!;
  // A miss line is saved with the round, so it comes back after a reload.
  const [message, setMessage] = useState(view.missLine || view.warning || '');
  const [anchor, setAnchor] = useState<'card' | 'clue' | 'button' | 'flip'>('button');
  const [confirm, setConfirm] = useState(false);
  const [confirmReady, setConfirmReady] = useState(false);
  const [mood, setMood] = useState<'idle' | 'happy' | 'sympathetic'>(view.budMood);
  const [peek, setPeek] = useState(false);
  const [reveal, setReveal] = useState<{ kind: 'card' | 'clue' } | null>(null);
  const cardList = useRef<HTMLUListElement>(null);
  const clueList = useRef<HTMLOListElement>(null);
  const [firstTap, setFirstTap] = useState(false);
  const [largestScroll, setLargestScroll] = useState(false);
  const [firstCheck, setFirstCheck] = useState(false);
  const [lastClueTap, setLastClueTap] = useState(0);
  const firstCard = useRef<HTMLButtonElement | null>(null);
  const inlineRef = useRef<HTMLDivElement | null>(null);
  const checkRef = useRef<HTMLButtonElement | null>(null);
  const { barRef, pinned, measuring } = usePinned(save.settings.textSize);
  const tallest = tallestMessage(content);

  useEffect(() => {
    const measure = () => {
      let visibleBottom = window.innerHeight;
      const bar = barRef.current || document.querySelector('.bottom-bar');
      if (bar) {
        const style = window.getComputedStyle(bar);
        if (bar.classList.contains('pinned') || style.position === 'fixed') {
          visibleBottom = bar.getBoundingClientRect().top;
        }
      }
      if (
        firstCard.current &&
        (firstCard.current.getBoundingClientRect().top >= window.innerHeight ||
          firstCard.current.getBoundingClientRect().top >= visibleBottom)
      )
        setLargestScroll(true);
      if (save.settings.textSize === 'largest') setLargestScroll(true);
    };
    measure();
  }, [save.settings.textSize, pinned]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (event.key >= '1' && event.key <= '4') {
        const index = Number(event.key) - 1;
        const card = view.cards[index];
        if (card && card.state === 'live') {
          event.preventDefault();
          tap({ type: 'select', term: card.term }, 'card');
        }
      } else if (
        event.key === 'Enter' &&
        document.activeElement &&
        (document.activeElement.classList.contains('answer-card') ||
          document.activeElement === checkRef.current)
      ) {
        event.preventDefault();
        tap({ type: 'check' }, 'button');
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });

  useEffect(() => {
    if (confirm) {
      setConfirmReady(false);
      const timer = window.setTimeout(() => setConfirmReady(true), 700);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [confirm]);

  useEffect(() => {
    if (!pinned && message && inlineRef.current) {
      try {
        inlineRef.current.scrollIntoView({ block: 'nearest' });
      } catch {
        inlineRef.current.scrollIntoView(false);
      }
    }
  }, [message, pinned]);

  // With the bar pinned, the newest clue or a flipped wrong card can end up hidden behind it,
  // so scroll it into the space above the bar. That is what the player needs to read next.
  useEffect(() => {
    if (!pinned || !reveal || !barRef.current) return;
    const list = reveal.kind === 'card' ? cardList.current : clueList.current;
    if (!list || list.children.length === 0) return;
    const target = list.children[list.children.length - 1] as HTMLElement;
    const visibleBottom = window.innerHeight - barRef.current.offsetHeight;
    const overlap = target.getBoundingClientRect().bottom - visibleBottom;
    if (overlap > 0) window.scrollBy(0, overlap + 8);
  }, [reveal]);

  function tap(action: RoundAction, nextAnchor: 'card' | 'clue' | 'button' | 'flip') {
    if (action.type !== 'showAnswer') setConfirm(false);
    if (action.type === 'nextClue') {
      const now = Date.now();
      if (shouldIgnoreNextClue(lastClueTap, now)) return;
      setLastClueTap(now);
    }
    const result = engine.applyRound(save, content, roundKey, action, app.today);
    commit(result.state);
    const nextView = engine.roundView(result.state, content, roundKey, app.today);
    const resultMessage =
      action.type === 'check' && result.outcome === 'wrong' && nextView.missLine
        ? nextView.missLine
        : result.message;
    setMessage(
      stripTextAfterTap(
        message,
        resultMessage,
        nextView.warning,
        action.type,
      ) || '',
    );
    // A wrong card flips and moves to the end of the list, so the strip goes under the cards.
    setAnchor(result.outcome === 'wrong' ? 'flip' : nextAnchor);
    // A new object each time, so the scroll effect runs again even for the same kind.
    if (result.outcome === 'wrong') setReveal({ kind: 'card' });
    else if (action.type === 'nextClue') setReveal({ kind: 'clue' });
    setMood(nextView.budMood);
    if (action.type === 'select') {
      setFirstTap(true);
      playSound('tap');
    }
    if (action.type === 'nextClue') playSound('flick');
    if (action.type === 'check') {
      setFirstCheck(true);
      if (result.outcome === 'wrong') {
        playSound('tock');
        checkRef.current?.focus();
      }
      if (result.outcome === 'solved') playSound('chime');
      if (result.outcome === 'learned') playSound('twoNotes');
    }
    if (action.type === 'showAnswer') playSound('twoNotes');
    if (result.state.rounds[roundKey] && result.state.rounds[roundKey].status !== 'playing') {
      endedRounds.add(roundKey);
      newBadgesByRound.set(roundKey, result.newBadges);
    }
  }

  const line = message || '';
  const inline =
    !pinned && line ? (
      <InlineStrip
        message={line}
        stripRef={(el) => {
          inlineRef.current = el;
        }}
      />
    ) : null;

  return (
    <Screen title={view.title} runhead={catalogNumber(roundKey)}>
      <div class="round stack">
        <div class="battery-wrap">
          <div class="battery-row">
            <Battery bars={view.bars} />
            <Mascot who="bud" size={56} mood={mood} />
          </div>
          <p>{view.batteryLine}</p>
          {view.justForFun ? <p>{view.justForFun}</p> : null}
        </div>
        {view.firstRoundHint ? <p>{view.firstRoundHint}</p> : null}
        {view.mode === 'ptp' ? <p>Reader: add your own hint if you like.</p> : null}
        {view.mode === 'ptp' ? (
          <div class="choice-row">
            <button
              type="button"
              class="choice"
              aria-pressed={peek ? 'true' : 'false'}
              onClick={() => setPeek(!peek)}
            >
              Peek at the answer
            </button>
            {peek ? <div class="note-box">Answer: {view.item.term}</div> : null}
          </div>
        ) : null}
        <ol class="clues" ref={clueList}>
          {view.clues.map((clue, i) => (
            <li key={i} class={i === view.clues.length - 1 ? 'clue newest slide' : 'clue'}>
              <span class="n">{i + 1}</span>
              {clue}
            </li>
          ))}
        </ol>
        {inline && anchor === 'clue' ? inline : null}
        {view.firstRound && !firstTap && !largestScroll ? <p class="first-label">Tap a word to pick it.</p> : null}
        {view.firstRound && largestScroll && !firstCheck ? (
          <p class="first-label">
            Scroll to see all four words. Tap one to pick it, then tap Check at the bottom.
          </p>
        ) : null}
        <ul class="cards" ref={cardList}>
          {view.cards.map((card, i) => (
            <li key={card.term}>
              <AnswerCard
                card={card}
                index={i + 1}
                cardRef={
                  i === 0
                    ? (el) => {
                        firstCard.current = el;
                      }
                    : undefined
                }
                onPick={(term) => tap({ type: 'select', term }, 'card')}
              />
            </li>
          ))}
        </ul>
        {inline && (anchor === 'card' || anchor === 'flip') ? inline : null}
        {view.mode !== 'ptp' ? <p class="desktop-tip">Tip: press 1 to 4 to pick, Enter to check.</p> : null}
        {confirm ? (
          <div class="confirm stack-sm">
            <p>
              <strong>Show the answer now?</strong>
            </p>
            <Button block onClick={() => setConfirm(false)}>
              Keep playing
            </Button>
            <Button
              block
              primary
              disabled={!confirmReady}
              onClick={() => tap({ type: 'showAnswer' }, 'button')}
            >
              {confirmReady ? 'Yes, show it' : 'Yes, show it (wait a moment)'}
            </Button>
          </div>
        ) : view.canShowAnswer ? (
          <Button
            block
            onClick={() => {
              setConfirm(true);
              setAnchor('button');
            }}
          >
            Show me the answer
          </Button>
        ) : null}
        {inline && anchor === 'button' ? inline : null}
        <BottomBar
          pinned={pinned}
          barRef={barRef}
          measuring={measuring}
          message={line}
          tallestMessage={tallest}
        >
          {view.firstRound && !firstTap && !largestScroll ? <p class="first-label">Then tap Check.</p> : null}
          <Button
            primary
            block
            id="check"
            buttonRef={(el) => {
              checkRef.current = el;
            }}
            onClick={() => tap({ type: 'check' }, 'button')}
          >
            Check
          </Button>
          <Button block disabled={!view.nextClue.enabled} onClick={() => tap({ type: 'nextClue' }, 'clue')}>
            {view.nextClue.enabled ? view.nextClue.label : view.nextClue.reason || view.nextClue.label}
          </Button>
        </BottomBar>
        <Announcer message={line} />
      </div>
    </Screen>
  );
}
