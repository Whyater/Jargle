import { Screen } from '../components/Screen';
import { LinkButton } from '../components/Button';
import { hrefFor } from '../router';

export function NotFoundScreen() {
  return (
    <Screen title="Page not found">
      <div class="stack">
        <p>This page isn't part of Jargle.</p>
        <LinkButton href={hrefFor('home')} primary block>
          Back
        </LinkButton>
      </div>
    </Screen>
  );
}
