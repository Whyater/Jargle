import { LinkButton } from '../components/Button';
import { Screen } from '../components/Screen';
import { sourceUrl } from '../../config';

export function AboutScreen() {
  return (
    <Screen title="About this app">
      <div class="stack-lg">
        <section class="stack-sm">
          <h2>What Jargle is</h2>
          <p>
            Jargle is a daily word game for tech words. You guess the word from clues and four answer cards. A
            wrong guess flips over and shows what that word means, so a miss still teaches you something.
          </p>
        </section>

        <section class="stack-sm">
          <h2>How it was made</h2>
          <p>
            Floyd, Bud, the badges and the app icon are drawings made as code with the same tools. The sounds
            are made inside the app with the Web Audio API, so there are no sound files.
          </p>
        </section>

        <section class="stack-sm">
          <h2>Your privacy</h2>
          <p>
            No accounts, no ads, no tracking. Your progress stays on this device. The app has no AI features
            while you play: every clue and answer is fixed text.
          </p>
        </section>

        <section class="stack-sm">
          <h2>Fonts and libraries</h2>
          <ul class="plain-list">
            <li>
              Atkinson Hyperlegible Next, by the Braille Institute (SIL Open Font License 1.1)
            </li>
            <li>Young Serif, by Bastien Sozeau (SIL Open Font License 1.1)</li>
            <li>Preact (MIT License)</li>
            <li>Vite, the build tool (MIT License)</li>
          </ul>
        </section>

        <section class="stack-sm">
          <h2>Source code</h2>
          <p>
            <a class="link" href={sourceUrl} target="_blank" rel="noopener">
              See the source code on GitHub
            </a>
          </p>
        </section>

        <LinkButton block href="?demo=judge">
          Try the demo: 8 days already learned
        </LinkButton>
      </div>
    </Screen>
  );
}
