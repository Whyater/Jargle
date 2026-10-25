import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { SCREENS, openDemo, goToHash, setTextSize, startTodaysRound } from './helpers';

const sizes = ['Normal', 'Large', 'Largest'] as const;
const a11yViewports = [
  { name: '375x667', width: 375, height: 667 },
  { name: '1280x800', width: 1280, height: 800 },
];

async function expectA11y(page: Parameters<typeof openDemo>[0]): Promise<void> {
  const result = await new AxeBuilder({ page }).analyze();
  const serious = result.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');
  if (serious.length === 0) return;
  const details = serious
    .map((violation) => {
      const targets = violation.nodes.slice(0, 3).map((node) => node.target.join(' ')).join(', ');
      return `${violation.id} (${violation.impact}): ${targets}`;
    })
    .join('\n');
  throw new Error(`Accessibility violations:\n${details}`);
}

for (const viewport of a11yViewports) {
  for (const size of sizes) {
    for (const screen of SCREENS) {
      test(`axe ${viewport.name} ${size} ${screen.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await openDemo(page, 'judge');
        await setTextSize(page, size);
        await goToHash(page, screen.hash);
        await expectA11y(page);
      });
    }

    test(`axe ${viewport.name} ${size} new home`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await openDemo(page, 'new');
      await setTextSize(page, size);
      await expectA11y(page);
    });

    test(`axe ${viewport.name} ${size} round flow`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await openDemo(page, 'judge');
      await setTextSize(page, size);
      await startTodaysRound(page);
      await expectA11y(page);

      await page.getByRole('button', { name: /Gemini/ }).click();
      await page.getByRole('button', { name: 'Check', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Check', exact: true })).toBeFocused();
      await expectA11y(page);

      await page.getByRole('button', { name: 'Show me the answer', exact: true }).click();
      await expect(page.getByText('Show the answer now?', { exact: true })).toBeVisible();
      await expectA11y(page);

      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: 'Yes, show it', exact: true }).click();
      const seeMeaning = page.getByRole('button', { name: 'See what it means', exact: true });
      await expect(seeMeaning).toBeVisible();
      await seeMeaning.click();
      await expect(page.getByRole('heading', { name: 'What it means' })).toBeVisible();
      await expectA11y(page);

      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Share' })).toBeVisible();
      await expectA11y(page);

      await page.getByRole('button', { name: 'Finish', exact: true }).click();
      await expect(page.getByRole('heading', { name: /Done/ })).toBeVisible();
      await expectA11y(page);
    });
  }
}

test('at most one polite live region per screen, exactly one on the round', async ({ page }) => {
  await openDemo(page, 'judge');
  // Static screens show no changing messages, so they may have none.
  for (const screen of SCREENS) {
    await goToHash(page, screen.hash);
    const politeCount = await page.locator('[aria-live="polite"]').count();
    expect.soft(politeCount, `${screen.name}: found ${politeCount} polite live region(s), expected at most one`).toBeLessThanOrEqual(1);
  }
  await goToHash(page, '#/');
  await startTodaysRound(page);
  await expect.soft(page.locator('[aria-live="polite"]'), 'round: expected exactly one polite live region').toHaveCount(1);
});

test('page basics and distinct screen titles', async ({ page }) => {
  await openDemo(page, 'judge');
  const titles = new Map<string, string>();
  for (const screen of SCREENS) {
    await goToHash(page, screen.hash);
    expect(await page.locator('html').getAttribute('lang')).toBe('en');
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport || '').not.toContain('maximum-scale');
    expect(viewport || '').not.toContain('user-scalable=no');
    const title = await page.title();
    expect(title.trim()).not.toBe('');
    titles.set(screen.name, title);
  }
  await goToHash(page, '#/');
  await startTodaysRound(page);
  titles.set('round', await page.title());
  expect(titles.get('home')).not.toBe(titles.get('settings'));
  expect(titles.get('home')).not.toBe(titles.get('round'));
  expect(titles.get('settings')).not.toBe(titles.get('round'));
});

test('focus moves to headings when opening settings and the round', async ({ page }) => {
  await openDemo(page, 'judge');
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await expect(page.locator('h1')).toBeFocused();
  await goToHash(page, '#/');
  await page.getByRole('button', { name: "Play today's word", exact: true }).click();
  await expect(page.locator('h1')).toBeFocused();
});

test('answer cards expose pressed state and wrong check keeps focus', async ({ page }) => {
  await openDemo(page, 'judge');
  await startTodaysRound(page);
  const cards = page.getByRole('button').filter({ hasText: /Claude|Gemini|Copilot|ChatGPT/ });
  await expect(cards).toHaveCount(4);
  for (let i = 0; i < 4; i += 1) await expect(cards.nth(i)).toHaveAttribute('aria-pressed');
  await page.getByRole('button', { name: /Gemini/ }).click();
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Check', exact: true })).toBeFocused();
});

test('disabled next clue stays focusable and explains why', async ({ page }) => {
  await openDemo(page, 'judge');
  await startTodaysRound(page);
  await page.getByRole('button', { name: /Gemini/ }).click();
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  const bars = page.locator('.battery-wrap p').first();
  for (let i = 0; i < 2; i += 1) {
    const beforeNextClue = await bars.innerText();
    // Next clue taps within 700 ms count once by design.
    await page.waitForTimeout(750);
    await page.getByRole('button', { name: /Next clue/ }).click();
    await expect.poll(() => bars.innerText()).not.toBe(beforeNextClue);
  }
  const disabled = page.getByRole('button', { name: 'Last bar: pick a word', exact: true });
  await expect(disabled).toHaveAttribute('aria-disabled', 'true');
  expect(await disabled.evaluate((element) => (element as HTMLElement).tabIndex)).toBeGreaterThanOrEqual(0);
  await expect(disabled).toHaveAccessibleName('Last bar: pick a word');
});

test('root font size follows the selected text size', async ({ page }) => {
  await openDemo(page, 'judge');
  for (const [size, expected] of [['Normal', '16px'], ['Large', '20px'], ['Largest', '24px']] as const) {
    await setTextSize(page, size);
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe(expected);
  }
});

test('visible controls meet the 48 pixel target', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await openDemo(page, 'judge');
  for (const screen of SCREENS) {
    await goToHash(page, screen.hash);
    const small = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button, a, [role="button"]'))
        .filter((item) => {
          const element = item as HTMLElement;
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          const inlineTextLink = element.tagName === 'A' && element.closest('p') && style.display === 'inline';
          return !inlineTextLink && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 && (rect.width < 48 || rect.height < 48);
        })
        .map((item) => `${(item.textContent || item.getAttribute('aria-label') || '').trim()} ${Math.round(item.getBoundingClientRect().width)}x${Math.round(item.getBoundingClientRect().height)}`);
    });
    expect.soft(small, `${screen.name}: undersized control(s): ${small.join('; ')}`).toEqual([]);
  }
  await goToHash(page, '#/');
  await startTodaysRound(page);
  const roundSmall = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, a, [role="button"]'))
      .filter((item) => {
        const element = item as HTMLElement;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const inlineTextLink = element.tagName === 'A' && element.closest('p') && style.display === 'inline';
        return !inlineTextLink && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 && (rect.width < 48 || rect.height < 48);
      })
      .map((item) => `${(item.textContent || item.getAttribute('aria-label') || '').trim()} ${Math.round(item.getBoundingClientRect().width)}x${Math.round(item.getBoundingClientRect().height)}`);
  });
  expect.soft(roundSmall, `round: undersized control(s): ${roundSmall.join('; ')}`).toEqual([]);
});

