import { expect, test, type Page } from '@playwright/test';
import {
  SCREENS,
  VIEWPORTS,
  expectNoHorizontalScroll,
  findButtonsNotReachedByTab,
  findClippedText,
  goToHash,
  openDemo,
  saveScreen,
  setTextSize,
  startTodaysRound,
  type TextSize,
} from './helpers';

const SIZES: TextSize[] = ['Normal', 'Largest'];

// These tests walk through many states or screen sizes, so they get more time.
test.describe.configure({ timeout: 60000 });

async function layoutGate(page: Page, state: string) {
  // Let short animations (like a card flip) finish first. A looping animation never ends, so give up after 3 s.
  try {
    await expect
      .poll(
        () => page.evaluate(() => document.getAnimations().some((animation) => animation.playState === 'running')),
        { timeout: 3000 },
      )
      .toBe(false);
  } catch (_error) {
    // Measure anyway.
  }
  let scrollError = '';
  try {
    await expectNoHorizontalScroll(page);
  } catch (error) {
    scrollError = String(error);
  }
  expect.soft(scrollError, `${state}: horizontal scroll`).toBe('');
  expect.soft(await findClippedText(page), `${state}: clipped text`).toEqual([]);
  expect.soft(await findButtonsNotReachedByTab(page), `${state}: keyboard reachability`).toEqual([]);
}

for (const viewport of VIEWPORTS) {
  for (const size of SIZES) {
    for (const screen of SCREENS) {
      test(`layout ${viewport.name} ${size} ${screen.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await openDemo(page, 'judge', screen.hash);
        await setTextSize(page, size);
        if (screen.hash !== '#/') await goToHash(page, screen.hash);
        await layoutGate(page, `${screen.name}`);
      });
    }
  }
}

async function startJudgeRound(page: Page, size: TextSize) {
  await openDemo(page, 'judge');
  await setTextSize(page, size);
  await startTodaysRound(page);
}

async function wrongGuess(page: Page) {
  await page.getByRole('button', { name: /Gemini/ }).click();
  await page.getByRole('button', { name: 'Check', exact: true }).click();
}

async function showAnswer(page: Page) {
  const show = page.getByRole('button', { name: 'Show me the answer', exact: true });
  const endedMiss = page.getByRole('button', { name: 'See what it means', exact: true });
  if (await show.count()) {
    await show.click();
    await page.getByRole('button', { name: /Yes, show it(?: \(wait a moment\))?/, exact: true }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Yes, show it', exact: true }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Yes, show it', exact: true }).click();
  } else if (await endedMiss.count()) {
    await endedMiss.click();
  } else {
    throw new Error('No answer reveal button is visible');
  }
  if (await endedMiss.count()) await endedMiss.click();
  await page.getByRole('button', { name: 'Continue', exact: true }).waitFor({ state: 'visible' });
}

async function continueToShare(page: Page) {
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('heading', { name: 'Share', exact: true }).waitFor({ state: 'visible' });
}

async function finishShare(page: Page) {
  const finish = page.getByRole('button', { name: 'Finish', exact: true });
  if (await finish.count()) {
    await finish.click();
    await page.getByRole('heading', { name: /Done(?: for today)?/, exact: true }).waitFor({ state: 'visible' });
  }
}

for (const viewport of VIEWPORTS) {
  for (const size of SIZES) {
    test(`clue ladder ${viewport.name} ${size}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await startJudgeRound(page, size);
      await layoutGate(page, 'fresh round');

      await page.getByRole('button', { name: /Gemini/ }).click();
      await layoutGate(page, 'after selecting a card');

      const nextClue = page.getByRole('button', { name: /^(Next clue|Last clue)/ });
      if (await nextClue.isEnabled()) await nextClue.click();
      await layoutGate(page, 'after Next clue');

      await wrongGuess(page);
      await layoutGate(page, 'after wrong guess');

      await showAnswer(page);
      await layoutGate(page, 'after reveal');

      await continueToShare(page);
      await layoutGate(page, 'after Continue');

      await finishShare(page);
      await layoutGate(page, 'after Finish');
      await expect(page.locator('h1')).toBeVisible();
    });
  }
}

for (const viewport of VIEWPORTS) {
  for (const size of SIZES) {
    test(`new demo first round ${viewport.name} ${size}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await openDemo(page, 'new');
      await setTextSize(page, size);
      await startTodaysRound(page);
      await layoutGate(page, 'new fresh round');
      await wrongGuess(page);
      await layoutGate(page, 'new after wrong guess');
    });
  }
}

const screenshotViewports = [
  { name: '375x667', width: 375, height: 667 },
  VIEWPORTS.find((viewport) => viewport.name === '320x568')!,
];
for (const viewport of screenshotViewports) {
  for (const size of SIZES) {
    test(`screenshots ${viewport.name} ${size}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await openDemo(page, 'judge');
      await setTextSize(page, size);
      for (const screen of SCREENS) {
        await goToHash(page, screen.hash);
        await saveScreen(page, `judge-${screen.name}-${viewport.name}-${size}`);
      }

      await openDemo(page, 'new');
      await setTextSize(page, size);
      await saveScreen(page, `new-home-${viewport.name}-${size}`);

      await startJudgeRound(page, size);
      await saveScreen(page, `round-fresh-${viewport.name}-${size}`);
      await page.getByRole('button', { name: /Gemini/ }).click();
      await saveScreen(page, `round-selected-${viewport.name}-${size}`);
      const nextClue = page.getByRole('button', { name: /^(Next clue|Last clue)/ });
      if (await nextClue.isEnabled()) await nextClue.click();
      await saveScreen(page, `round-next-clue-${viewport.name}-${size}`);
      await wrongGuess(page);
      await saveScreen(page, `round-after-miss-${viewport.name}-${size}`);
      await showAnswer(page);
      await saveScreen(page, `round-reveal-${viewport.name}-${size}`);
      await continueToShare(page);
      await saveScreen(page, `round-share-${viewport.name}-${size}`);
      await finishShare(page);
      await saveScreen(page, `round-done-${viewport.name}-${size}`);
    });
  }
}
