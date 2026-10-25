import { engine } from '../engine';
import { useApp } from '../store';
import { hrefFor } from '../router';
import { openRound, openReveal, shortDate } from '../actions';
import { Screen } from '../components/Screen';
import { Announcer } from '../components/BottomBar';
import { RowLink } from '../components/RowLink';
import { Icon } from '../components/Icons';
import { TOPIC_ORDER } from '../../engine/types';
import { topicName } from './listLogic';

export function LearnScreen() {
  const app = useApp();
  if (!app.save || !app.content) return null;
  const statuses = engine.lessonStatuses(app.save, app.content, app.today);
  const practice = engine.practiceList(app.save, app.content, app.today);
  return (
    <Screen title="Lessons and practice">
      <div class="stack-lg">
        <ul class="rows">
          <li>
            <RowLink href={hrefFor('practice')} title="Practice: all past words" />
          </li>
          <li>
            <RowLink href={hrefFor('oldtech')} title="Floyd's Old Tech" />
          </li>
        </ul>
        {TOPIC_ORDER.map((topic) => {
          const lessons = statuses.filter((s) => s.lesson.topic === topic);
          const words = practice.filter(
            (entry) => app.content!.items[entry.itemId] && app.content!.items[entry.itemId].topic === topic,
          );
          if (!lessons.length && !words.length) return null;
          return (
            <section key={topic}>
              <h2>{topicName(topic)}</h2>
              <ul class="rows">
                {lessons.map((s) => (
                  <li key={s.lesson.id}>
                    {s.open ? (
                      <a class="row-link" href={hrefFor('lesson', s.lesson.id)}>
                        <span class="main">
                          <span class="title">
                            {s.lesson.number}. {s.lesson.title}
                          </span>
                        </span>
                        {s.done ? (
                          <span class="mark">
                            <Icon name="check" />
                            <span class="visually-hidden">Done</span>
                          </span>
                        ) : null}
                      </a>
                    ) : (
                      <div class="row-link" aria-disabled="true">
                        <span class="main">
                          <span class="title">
                            {s.lesson.number}. {s.lesson.title}
                          </span>
                          <span class="note">{s.lockLine}</span>
                        </span>
                        <span class="mark">
                          <Icon name="lock" />
                        </span>
                      </div>
                    )}
                  </li>
                ))}
                {words.map((entry) => (
                  <li key={entry.key}>
                    <button
                      type="button"
                      class="row-link"
                      onClick={() => {
                        if (entry.finished) openReveal(entry.key);
                        else openRound(entry.key, entry.itemId, 'practice');
                      }}
                    >
                      <span class="main">
                        <span class="title">{entry.label}</span>
                        <span class="note">{entry.date ? shortDate(entry.date) : ''}</span>
                      </span>
                      {entry.finished ? (
                        <span class="mark">
                          <Icon name="check" />
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <Announcer message="" />
    </Screen>
  );
}
