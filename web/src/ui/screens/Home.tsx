import { Screen } from '../components/Screen';
import { Button, LinkButton } from '../components/Button';
import { Battery } from '../components/Battery';
import { BottomBar, usePinned } from '../components/BottomBar';
import { Counter } from '../components/Counter';
import { MascotPair } from '../components/Mascot';
import { RowLink } from '../components/RowLink';
import { InAppNote, inAppNoteShows } from './InAppNote';
import { commit, useApp } from '../store';
import { engine } from '../engine';
import { hrefFor, navigate } from '../router';
import { openRound, shortDate } from '../actions';
import { showJudgesLine } from '../../config';
import { judgeLineVisible, todayItemId } from './homeLogic';
import type { ContentBundle, SaveState, TextSize } from '../../engine/types';
import type { HomeView } from '../../engine/api';

export function HomeScreen() {
  const app = useApp();
  // Hooks run before any early return.
  const pin = usePinned(app.save ? app.save.settings.textSize : 'normal');
  if (!app.save || !app.content) return <Screen title="Jargle" isHome quietTitle children={null} />;

  const save = app.save;
  const content = app.content;
  const today = app.today;
  const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  const noteShowing = inAppNoteShows(save, userAgent);
  const hv = engine.homeView(save, content, today);
  const judges = judgeLineVisible(showJudgesLine, app.demo);

  if (hv.phase === 'prelaunch') {
    return (
      <Screen title="Jargle" isHome quietTitle>
        <div class="stack-lg">
          <MascotPair size={88} />
          <p class="result-line">Jargle starts Monday, Oct 26.</p>
          <LinkButton primary block href="?demo=new">
            Try the demo
          </LinkButton>
          {judges ? <JudgesLine /> : null}
        </div>
      </Screen>
    );
  }

  function openToday() {
    if (!hv.today) return;
    const itemId = todayItemId(content, today);
    if (!itemId) return;
    // Pressing Play also answers the text size question.
    if (!save.flags.textSizeAsked) {
      commit({ ...save, flags: { ...save.flags, textSizeAsked: true } });
    }
    openRound(hv.today.key, itemId, 'daily');
  }

  function openGrace() {
    if (!hv.grace) return;
    const date = engine.dateOfDay(hv.grace.day);
    for (const day of content.schedule.days) {
      if (day.date === date) {
        openRound(hv.grace.key, day.term, 'daily');
        return;
      }
    }
  }

  const played = hv.phase === 'played';
  const noWord = hv.phase === 'noWord';
  const first = hv.phase === 'first';
  const runhead = hv.today ? 'No. ' + hv.today.day + ' · ' + shortDate(today) : shortDate(today);

  return (
    <Screen title="Jargle" isHome quietTitle runhead={runhead}>
      <div class="stack-lg">
        {app.demo === 'judge' ? (
          <p>
            Demo: a made-up history with 8 days learned. New here? Tap How to play. Try Pass the Phone, or pick
            a wrong word to see what it means.
          </p>
        ) : null}

        {first && !save.flags.textSizeAsked ? <TextSizeQuestion save={save} /> : null}

        {first ? (
          <section class="stack">
            <div class="stack-sm">
              <Battery bars={6} small />
              <p>
                Guess today's tech word from clues. If your bars run out, we show you the answer, and it still
                counts.
              </p>
            </div>
            <div class="home-meet">
              <MascotPair size={84} />
              <p>Meet Floyd and Bud. Tap either one to say hi.</p>
            </div>
          </section>
        ) : (
          <section class="home-score">
            {played ? <h2>Done for today</h2> : null}
            <div class="home-score-row">
              <Counter value={hv.daysLearned} label="Days learned" />
              <MascotPair size={84} />
            </div>
            {hv.streakLine ? <p class="streak">{hv.streakLine}</p> : null}
            {hv.gentleLine ? <p class="note-box">{hv.gentleLine}</p> : null}
          </section>
        )}

        {played && hv.shareLine ? <p class="share-preview">{hv.shareLine}</p> : null}

        <InAppNote />

        {noWord ? <p class="note-box beige">New words are on the way. Open Jargle online to get them.</p> : null}

        {!played && !noWord && hv.today ? (
          <BottomBar pinned={pin.pinned && !noteShowing} measuring={pin.measuring} barRef={pin.barRef} message="" tallestMessage="">
            <Button primary block onClick={openToday}>
              {hv.today.started ? 'Continue' : "Play today's word"}
            </Button>
          </BottomBar>
        ) : null}

        <hr class="perf" />

        <HomeLinks hv={hv} save={save} content={content} today={today} onGrace={openGrace} />

        {judges ? <JudgesLine /> : null}
      </div>
    </Screen>
  );
}

function TextSizeQuestion({ save }: { save: SaveState }) {
  function choose(size: TextSize) {
    commit({
      ...save,
      settings: { ...save.settings, textSize: size },
      flags: { ...save.flags, textSizeAsked: true },
    });
  }
  return (
    <section class="note-box stack-sm" aria-labelledby="text-size-q">
      <h2 id="text-size-q">Is this text big enough?</h2>
      <Button block onClick={() => choose('normal')}>
        Yes, it's fine
      </Button>
      <Button block onClick={() => choose('large')}>
        Make it Large
      </Button>
      <Button block onClick={() => choose('largest')}>
        Make it Largest
      </Button>
    </section>
  );
}

interface HomeLinksProps {
  hv: HomeView;
  save: SaveState;
  content: ContentBundle;
  today: string;
  onGrace: () => void;
}

function HomeLinks({ hv, save, content, today, onGrace }: HomeLinksProps) {
  function newSet() {
    commit(engine.startPtpSet(save, content, today));
    navigate('ptp');
  }
  return (
    <section class="stack">
      {hv.todaysLesson ? (
        <LinkButton block href={hrefFor('lesson', hv.todaysLesson.id)}>
          Today's lesson: {hv.todaysLesson.title}
        </LinkButton>
      ) : null}
      {hv.grace ? (
        <Button block onClick={onGrace}>
          Finish yesterday's word
        </Button>
      ) : null}
      <ul class="rows">
        <li>
          <RowLink href={hrefFor('review')} title={hv.reviewLink} />
        </li>
        <li>
          <RowLink href={hrefFor('oldtech')} title="Floyd's Old Tech: you might be the expert" />
        </li>
        {hv.ptpInProgress ? (
          <>
            <li>
              <RowLink href={hrefFor('ptp')} title="Continue your set" />
            </li>
            <li>
              <RowLink onClick={newSet} title="Start a new set (ends this one)" />
            </li>
          </>
        ) : (
          <li>
            <RowLink href={hrefFor('ptp')} title="Pass the Phone: play with someone next to you" />
          </li>
        )}
        <li>
          <RowLink href={hrefFor('learn')} title="Lessons and practice" />
        </li>
        <li>
          <RowLink href={hrefFor('badges')} title="Badges" />
        </li>
      </ul>
    </section>
  );
}

function JudgesLine() {
  return (
    <p>
      <a class="link" href="?demo=judge">
        For judges: see a made-up history.
      </a>
    </p>
  );
}
