import { Screen } from '../components/Screen';
import { Battery } from '../components/Battery';
import { MascotPair } from '../components/Mascot';

export function HowToPlayScreen() {
  return (
    <Screen title="How to play">
      <div class="stack">
        <section>
          <h2>The goal</h2>
          <p>
            Guess today's tech word from clues. If your bars run out, we show you the answer, and it still
            counts.
          </p>
        </section>
        <section>
          <h2>Your battery</h2>
          <Battery bars={6} />
          <p>6 bars left. An extra clue costs 1. A wrong guess costs 3.</p>
        </section>
        <p>Tap Next clue if you're not sure. More bars left is better.</p>
        <p>Tap a word to pick it.</p>
        <p>Then tap Check.</p>
        <p>A wrong word flips over and shows what it means, so a miss still teaches you a word.</p>
        <p>Your streak ends only if you miss two days in a row.</p>
        <p>Just for fun: this doesn't change your streak or Days learned.</p>
        <section>
          <h2>Floyd and Bud</h2>
          <p>Meet Floyd and Bud. Tap either one to say hi.</p>
          <MascotPair />
        </section>
        <p class="desktop-tip">Tip: press 1 to 4 to pick, Enter to check.</p>
      </div>
    </Screen>
  );
}
