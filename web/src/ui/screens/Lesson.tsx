import { useEffect, useState } from 'preact/hooks';
import { engine } from '../engine';
import { playSound } from '../../platform/audio';
import { commit, useApp } from '../store';
import { hrefFor, useRoute } from '../router';
import { Screen } from '../components/Screen';
import { Button, LinkButton } from '../components/Button';
import { Announcer } from '../components/BottomBar';
import { Badge } from '../components/art';
import { Exchange } from '../components/Exchange';
import { QuizOption } from './QuizOption';
import type { BadgeId } from '../../engine/types';

function Sources({ sources }: { sources: { name: string; url: string }[] }) {
  return (
    <section>
      <hr class="perf" />
      <h2>Where this comes from</h2>
      <ul class="plain-list">
        {sources.map((source) => (
          <li key={source.url}>
            <a class="link" href={source.url} target="_blank" rel="noopener">
              {source.name}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LessonScreen({ lessonId }: { lessonId?: string }) {
  const route = useRoute();
  const id = lessonId || route.param || '';
  const app = useApp();
  const [card, setCard] = useState(() => (app.save && app.save.lessons[id] ? app.save.lessons[id].card : 0));
  const [check, setCheck] = useState(() =>
    app.save && app.save.lessons[id] ? app.save.lessons[id].answers.length : 0,
  );
  // The screen title stays the same between cards, so start each new card or question at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [card, check]);
  const [newBadges, setNewBadges] = useState<{ id: BadgeId; name: string }[]>([]);
  const [done, setDone] = useState(
    () => !!(app.save && app.save.lessons[id] && app.save.lessons[id].finished_on),
  );
  if (!app.save || !app.content) return null;

  const lesson = app.content.lessons.filter((item) => item.id === id)[0];
  if (!lesson) {
    return (
      <Screen title="Lesson">
        <p>Lesson not found.</p>
        <LinkButton href={hrefFor('home')}>Home</LinkButton>
      </Screen>
    );
  }

  const finish = () => {
    const result = engine.finishLesson(app.save!, app.content!, id, app.today);
    commit(result.state);
    const views = engine.badgeViews(result.state, app.content!, app.today);
    if (result.newBadges.length) playSound('stamp');
    setNewBadges(
      result.newBadges.map((id) => {
        const view = views.filter((badge) => badge.id === id)[0];
        return { id, name: view ? view.name : String(id) };
      }),
    );
    setDone(true);
  };

  if (done) {
    const earned = newBadges;
    return (
      <Screen title={lesson.title} runhead={'Lesson ' + lesson.number}>
        <div class="stack">
          <p class="result-line">Lesson done.</p>
          <div class="learn-card">
            <p>{lesson.takeaway}</p>
          </div>
          {earned.map((badge) => (
            <div class="new-badge stamp" key={badge.id}>
              <Badge id={badge.id} earned size={72} />
              <p>New badge: {badge.name}</p>
            </div>
          ))}
          <Sources sources={lesson.sources} />
          <LinkButton primary block href={hrefFor('home')}>
            Home
          </LinkButton>
          <Announcer message="Lesson done." />
        </div>
      </Screen>
    );
  }

  if (card < lesson.cards.length) {
    const learnCard = lesson.cards[card];
    const nextCard = card + 1;
    return (
      <Screen
        title={lesson.title}
        runhead={'Lesson ' + lesson.number}
        runheadRight={'Card ' + (card + 1) + ' of ' + lesson.cards.length}
      >
        <div class="stack">
          <div class="learn-card">
            <p>{learnCard.text}</p>
          </div>
          <Exchange lines={[{ speaker: learnCard.mascot, text: learnCard.line }]} />
          <Button
            primary
            block
            onClick={() => {
              commit(engine.saveLessonProgress(app.save!, id, { card: nextCard }));
              setCard(nextCard);
            }}
          >
            {nextCard === lesson.cards.length ? 'Start the questions' : 'Next'}
          </Button>
          <Sources sources={lesson.sources} />
          <Announcer message="" />
        </div>
      </Screen>
    );
  }

  const checkIndex = check < lesson.checks.length ? check : lesson.checks.length - 1;
  const checkData = lesson.checks[checkIndex];
  const options = engine.lessonOptions(lesson, checkIndex).map((term) => ({
    term,
    meaning: checkData.why,
  }));

  return (
    <Screen
      title={lesson.title}
      runhead={'Lesson ' + lesson.number}
      runheadRight={'Question ' + (checkIndex + 1) + ' of ' + lesson.checks.length}
    >
      <div class="stack">
        <p>
          <strong>{checkData.prompt}</strong>
        </p>
        <QuizOption
          key={checkIndex}
          options={options}
          answer={checkData.answer}
          last={checkIndex === lesson.checks.length - 1}
          onAnswer={(_correct, term) => {
            commit(engine.saveLessonProgress(app.save!, id, { answer: term }));
          }}
          onNext={() => {
            if (checkIndex + 1 < lesson.checks.length) setCheck(checkIndex + 1);
            else finish();
          }}
        />
        <Sources sources={lesson.sources} />
      </div>
    </Screen>
  );
}
