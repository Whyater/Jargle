import { engine } from '../engine';
import { useApp } from '../store';
import { hrefFor } from '../router';
import { Screen } from '../components/Screen';
import { Announcer } from '../components/BottomBar';
import { LinkButton } from '../components/Button';
import { Badge } from '../components/art';
import { shortDate } from '../actions';

export function BadgesScreen() {
  const app = useApp();
  if (!app.save || !app.content) return null;
  const badges = engine.badgeViews(app.save, app.content, app.today);
  return (
    <Screen title="Badges">
      <div class="badge-grid">
        {badges.map((badge) => (
          <article class={'badge-card' + (badge.earned ? ' earned' : '')} key={badge.id}>
            <Badge id={badge.id} earned={Boolean(badge.earned)} size={72} />
            <div>
              <h2>{badge.name}</h2>
              {badge.earned ? (
                <p>
                  Earned <span class="badge-date">{shortDate(badge.earned)}</span>
                </p>
              ) : (
                <p>
                  {badge.condition}
                  {badge.progress ? ' ' + badge.progress.have + ' of ' + badge.progress.need : ''}
                </p>
              )}
              {badge.note ? <p class="small">{badge.note}</p> : null}
            </div>
          </article>
        ))}
      </div>
      <LinkButton primary block href={hrefFor('home')}>
        Home
      </LinkButton>
      <Announcer message="" />
    </Screen>
  );
}
