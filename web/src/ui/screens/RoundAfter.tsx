import { useEffect, useRef, useState } from 'preact/hooks';
import type { RoundView } from '../../engine/api';
import { engine } from '../engine';
import { useApp, commit } from '../store';
import { goBack, hrefFor, navigate } from '../router';
import { openRound } from '../actions';
import { appUrl, feedbackEmail, feedbackLink } from '../../config';
import { shareOrCopy, selectTextOf } from '../../platform/share';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { AnswerCard } from '../components/AnswerCard';
import { Battery } from '../components/Battery';
import { Exchange } from '../components/Exchange';
import { Counter } from '../components/Counter';
import { Badge } from '../components/art';
import { RowLink } from '../components/RowLink';
import { canPlayAgain, newBadgesByRound } from './roundLogic';
import { Announcer } from '../components/BottomBar';

export function RoundAfter({ roundKey, view }: { roundKey: string; view: RoundView }) {
  const app = useApp();
  const [step, setStep] = useState(view.record.post_step);
  useEffect(() => setStep(view.record.post_step), [view.record.post_step]);
  function move(next: number) {
    const result = engine.applyRound(
      app.save!,
      app.content!,
      roundKey,
      { type: 'postStep', step: next },
      app.today,
    );
    commit(result.state);
    setStep(next);
  }
  if (view.mode === 'ptp') return <PtpAfter roundKey={roundKey} view={view} />;
  if (step === 0)
    return (
      <Reveal
        view={view}
        onContinue={() => move(view.record.mode === 'daily' && view.record.counted_day !== undefined ? 1 : 2)}
        onSkip={() => move(2)}
        onReplay={
          canPlayAgain(roundKey, view.record.mode, engine.dayNumber(app.today))
            ? () => {
                commit(engine.replayRound(app.save!, app.content!, roundKey, app.today));
              }
            : undefined
        }
      />
    );
  if (step === 1) return <ShareStep roundKey={roundKey} onFinish={() => move(2)} onSkip={() => move(2)} />;
  return <DoneStep view={view} />;
}

function Reveal({
  view,
  onContinue,
  onSkip,
  onReplay,
}: {
  view: RoundView;
  onContinue: () => void;
  onSkip: () => void;
  onReplay?: () => void;
}) {
  const item = view.item;
  const answer = view.cards.filter((card) => card.state === 'answer')[0] || {
    term: item.term,
    state: 'answer' as const,
    selected: false,
    meaning: item.meaning,
  };
  return (
    <Screen title="What it means">
      <div class="stack">
        <p class="result-line">{view.resultLine}</p>
        {view.resultNote ? <p>{view.resultNote}</p> : null}
        <Battery bars={view.bars} lightUp={view.record.status === 'solved'} small />
        <AnswerCard card={answer} index={1} onPick={() => undefined} />
        <Exchange lines={item.exchange} budMood={view.record.status === 'solved' ? 'happy' : 'sympathetic'} />
        <hr class="perf" />
        <h2>Where this comes from</h2>
        <ul class="plain-list">
          {item.sources.map((source) => (
            <li key={source.url}>
              <a class="link" href={source.url} target="_blank" rel="noopener">
                {source.name}
              </a>
            </li>
          ))}
        </ul>
        <p class="feedback-line">
          <a class="link" href={feedbackLink(item.id)} target={feedbackEmail ? undefined : '_blank'} rel="noopener">
            Something wrong? Tell us
          </a>
        </p>
        <Button primary block onClick={onContinue}>
          Continue
        </Button>
        {onReplay ? (
          <Button block onClick={onReplay}>
            Play again
          </Button>
        ) : null}
        <Button block onClick={onSkip}>
          Skip to the end.
        </Button>
      </div>
    </Screen>
  );
}

function ShareStep({
  roundKey,
  onFinish,
  onSkip,
}: {
  roundKey: string;
  onFinish: () => void;
  onSkip: () => void;
}) {
  const app = useApp();
  const preview = useRef<HTMLDivElement | null>(null);
  const [notice, setNotice] = useState('');
  const [text, setText] = useState('');
  useEffect(() => {
    setText(engine.shareText(app.save!, app.content!, roundKey, { appUrl, demo: app.demo !== null }));
  }, [roundKey, app.save, app.content, app.demo]);
  async function share() {
    const result = await shareOrCopy(text);
    if (result === 'copied') setNotice('Copied. Paste it into a text or email.');
    if (result === 'failed') {
      if (preview.current) selectTextOf(preview.current);
      setNotice('Press and hold the text to copy it.');
    }
  }
  return (
    <Screen title="Share">
      <div class="stack">
        <div class="share-preview" ref={preview}>
          {text}
        </div>
        <Button primary block onClick={share}>
          Send to someone
        </Button>
        {notice ? <p>{notice}</p> : null}
        <Button block onClick={onFinish}>
          Finish
        </Button>
        <Button block onClick={onSkip}>
          Skip to the end.
        </Button>
        <Announcer message={notice} />
      </div>
    </Screen>
  );
}

function DoneStep({ view }: { view: RoundView }) {
  const app = useApp();
  const home = engine.homeView(app.save!, app.content!, app.today);
  const badgeIds = newBadgesByRound.get(view.key) || [];
  const badges = engine
    .badgeViews(app.save!, app.content!, app.today)
    .filter((badge) => badgeIds.indexOf(badge.id) >= 0);
  const [nextMessage, setNextMessage] = useState('');
  function next() {
    const result = engine.nextWord(
      app.save!,
      app.content!,
      view.record.mode === 'oldtech' ? 'oldtech' : 'practice',
      app.today,
    );
    if ('message' in result) setNextMessage(result.message);
    else openRound(result.entry.key, result.entry.itemId, view.record.mode);
  }
  const counted = view.record.mode === 'daily' && view.record.counted_day !== undefined;
  // A grace finish counts for yesterday; today's word may still be waiting.
  const graceful =
    counted && view.record.counted_day !== engine.dayNumber(app.today) && home.today && !home.today.finished;
  function openToday() {
    let itemId = '';
    for (const day of app.content!.schedule.days) {
      if (day.date === app.today) itemId = day.term;
    }
    if (home.today && itemId) openRound(home.today.key, itemId, 'daily');
  }
  return (
    // The card already ends with "Done for today.", so the heading is for screen readers only.
    <Screen title={counted ? 'Done for today' : 'Done'} quietTitle={counted && !graceful}>
      <div class="stack-lg">
        {counted ? <Counter value={home.daysLearned} from={home.daysLearned - 1} label="Days learned" /> : null}
        {badges.map((badge) => (
          <div class="new-badge stamp" key={badge.id}>
            <Badge id={badge.id} earned size={72} />
            <p>New badge: {badge.name}</p>
          </div>
        ))}
        {counted ? (
          <ul class="rows">
            {home.todaysLesson && !graceful ? (
              <li>
                <RowLink
                  href={hrefFor('lesson', home.todaysLesson.id)}
                  title={"Today's lesson: " + home.todaysLesson.title}
                />
              </li>
            ) : null}
            <li>
              <RowLink
                href={hrefFor('review')}
                title={home.reviewLink}
              />
            </li>
          </ul>
        ) : null}
        {graceful ? (
          <Button primary block onClick={openToday}>
            {home.today && home.today.started ? 'Continue' : "Play today's word"}
          </Button>
        ) : counted ? (
          <p class="result-line">Done for today.</p>
        ) : nextMessage ? (
          <div class="stack">
            <p class="result-line">{nextMessage}</p>
            <Button block onClick={goBack}>
              Back
            </Button>
          </div>
        ) : (
          <div class="stack-sm">
            <Button primary block onClick={next}>
              Next word
            </Button>
            <Button block onClick={goBack}>
              Back
            </Button>
          </div>
        )}
        <Announcer message={nextMessage} />
      </div>
    </Screen>
  );
}

function PtpAfter({ roundKey, view }: { roundKey: string; view: RoundView }) {
  const app = useApp();
  const [prompt, setPrompt] = useState(true);
  const r = Number(roundKey.split(':')[2]);
  const item = view.item;
  const answer = view.cards.filter((card) => card.state === 'answer')[0] || {
    term: item.term,
    state: 'answer' as const,
    selected: false,
    meaning: item.meaning,
  };

  function nextRound() {
    const save = app.save!;
    const set = save.ptpSet;
    if (set && r < set.rounds.length) commit(engine.advancePtp(save));
    navigate('ptp');
  }

  return (
    <Screen title="What it means">
      <div class="stack">
        <p class="note-box beige">
          <strong>Turn the screen so you both can see.</strong>
        </p>
        <p class="result-line">{view.resultLine}</p>
        {view.resultNote ? <p>{view.resultNote}</p> : null}
        <Battery bars={view.bars} lightUp={view.record.status === 'solved'} small />
        <AnswerCard card={answer} index={1} onPick={() => undefined} />
        <Exchange lines={item.exchange} budMood={view.record.status === 'solved' ? 'happy' : 'sympathetic'} />
        {prompt ? (
          <div class="note-box stack-sm">
            <p>
              {item.old_tech
                ? 'Reader, tell them what you remember.'
                : "Reader, tell them how you've seen it used, or how you use it."}
            </p>
            <Button small onClick={() => setPrompt(false)}>
              Skip
            </Button>
          </div>
        ) : null}
        <Button
          primary
          block
          onClick={nextRound}
        >
          {app.save && app.save.ptpSet && r < app.save.ptpSet.rounds.length ? 'Next round' : 'See the summary'}
        </Button>
      </div>
    </Screen>
  );
}
