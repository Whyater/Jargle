import { useState } from 'preact/hooks';
import { playSound } from '../../platform/audio';
import { Announcer } from '../components/BottomBar';
import { Button } from '../components/Button';
import { Icon } from '../components/Icons';

export interface QuizOptionItem {
  term: string;
  meaning: string;
}
interface QuizOptionProps {
  options: QuizOptionItem[];
  answer: string;
  onAnswer?: (correct: boolean, term: string) => void;
  last?: boolean;
  onNext?: () => void;
}

/** A check answers as soon as one of its cards is tapped. */
export function QuizOption({ options, answer, onAnswer, last, onNext }: QuizOptionProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const answered = picked !== null;
  const correct = picked === answer;
  const pickedItem = picked ? options.filter((item) => item.term === picked)[0] : null;

  function choose(term: string) {
    if (answered) return;
    const isCorrect = term === answer;
    setPicked(term);
    playSound(isCorrect ? 'chime' : 'tock');
    if (onAnswer) onAnswer(isCorrect, term);
  }

  const message = answered && pickedItem ? (correct ? 'Right. ' : 'Not this one. ') + pickedItem.meaning : '';

  return (
    <div class="stack-sm">
      <div class="cards">
        {options.map((item, index) => {
          const isAnswer = answered && item.term === answer;
          const isMissed = answered && !correct && item.term === picked;
          let className = 'answer-card';
          if (isAnswer) className += ' is-answer';
          if (isMissed) className += ' is-missed';
          return (
            <button
              type="button"
              class={className}
              key={item.term}
              aria-pressed={picked === item.term ? 'true' : 'false'}
              aria-disabled={answered ? 'true' : undefined}
              onClick={() => choose(item.term)}
            >
              {isMissed ? <span class={'tab tab-' + ((index % 3) + 1)}>Not this one</span> : null}
              <span class="term">{item.term}</span>
              {isAnswer ? (
                <span class="state-icon">
                  <Icon name="check" />
                </span>
              ) : null}
              {/* The why (the picked option's meaning) is shown once, below the cards. */}
            </button>
          );
        })}
      </div>
      {answered && pickedItem ? (
        <div class="stack-sm">
          <p class="result-line">{correct ? 'Right.' : 'Not this one.'}</p>
          <p>{pickedItem.meaning}</p>
        </div>
      ) : null}
      <Announcer message={message} />
      {answered && onNext ? (
        <Button primary block onClick={onNext}>
          {last ? 'Finish' : 'Next question'}
        </Button>
      ) : null}
    </div>
  );
}
