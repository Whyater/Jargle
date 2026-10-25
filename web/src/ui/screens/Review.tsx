import { useState } from 'preact/hooks';
import { engine } from '../engine';
import { commit, useApp } from '../store';
import { hrefFor } from '../router';
import { Screen } from '../components/Screen';
import { Announcer } from '../components/BottomBar';
import { LinkButton } from '../components/Button';
import { QuizOption } from './QuizOption';
import { reviewDoneLine } from '../../engine/api';
import type { ContentBundle, LocalDate, SaveState } from '../../engine/types';

export function ReviewScreen() {
  const app = useApp();
  if (!app.save || !app.content) return null;
  return <ReviewReady save={app.save} content={app.content} today={app.today} />;
}

function ReviewReady({
  save,
  content,
  today,
}: {
  save: SaveState;
  content: ContentBundle;
  today: LocalDate;
}) {
  const [questions, setQuestions] = useState(() => engine.reviewSession(save, content, today));
  const [index, setIndex] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [retried, setRetried] = useState<string[]>([]);

  if (!questions.length)
    return (
      <Screen title="Review">
        <p>Review: nothing due today.</p>
        <LinkButton primary block href={hrefFor('home')}>
          Home
        </LinkButton>
        <Announcer message="" />
      </Screen>
    );
  if (index >= questions.length)
    return (
      <Screen title="Review">
        <p class="result-line">{reviewDoneLine(answeredCount)}</p>
        <LinkButton primary block href={hrefFor('home')}>
          Home
        </LinkButton>
        <Announcer message="" />
      </Screen>
    );

  const question = questions[index];
  function answer(correct: boolean) {
    commit(engine.answerReview(save, question.itemId, correct, today));
    if (retried.indexOf(question.itemId) < 0) setAnsweredCount((count) => count + 1);
    if (!correct && retried.indexOf(question.itemId) < 0) {
      setRetried((current) => current.concat(question.itemId));
      setQuestions((current) => current.concat(question));
    }
  }

  const last = index === questions.length - 1 && retried.indexOf(question.itemId) >= 0;
  return (
    <Screen title="Review">
      <p>
        <strong>{question.prompt}</strong>
      </p>
      <QuizOption
        key={question.itemId + ':' + index}
        options={question.options}
        answer={question.answer}
        onAnswer={answer}
        last={last}
        onNext={() => setIndex((value) => value + 1)}
      />
    </Screen>
  );
}
