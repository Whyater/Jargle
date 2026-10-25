import { test, expect } from '@playwright/test';
import { goToHash, isBottomBarPinned, openDemo, setTextSize, startTodaysRound } from './helpers';

const belowPinning = [[320, 480], [375, 548], [360, 560]] as const;
const pinningHeights = [[360, 640], [375, 667], [320, 568]] as const;

type Page = Parameters<typeof openDemo>[0];

async function openRoundAt(page: Page, width: number, height: number, size: 'Normal' | 'Large' | 'Largest' = 'Normal', demo: 'judge' | 'new' = 'judge') {
  await page.setViewportSize({ width, height });
  await openDemo(page, demo);
  // Tests open several rounds on one page, so wipe the saved demo and load it fresh each time.
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await goToHash(page, '#/');
  if (size !== 'Normal') await setTextSize(page, size);
  await startTodaysRound(page);
}

function card(page: Page, term: string) {
  return page.getByRole('button').filter({ hasText: term }).first();
}

async function checkFirstRoundLabels(page: Page, viewport: string, textSize: 'Normal' | 'Largest') {
  const viewportHeight = page.viewportSize()!.height;
  const cards = page.locator('button.answer-card');
  const cardTops = await cards.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().top));
  const lastCardTop = cardTops[cardTops.length - 1] ?? Number.NaN;
  // A pinned bottom bar covers the bottom of the screen, so a card under it is out of view too.
  const visibleBottom = await page.evaluate((height) => {
    const check = Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Check');
    let element: HTMLElement | null = check || null;
    while (element) {
      if (getComputedStyle(element).position === 'fixed') return Math.min(height, element.getBoundingClientRect().top);
      element = element.parentElement;
    }
    return height;
  }, viewportHeight);
  const anyCardBelow = cardTops.some((top) => top >= visibleBottom);
  const useScrollLabel = anyCardBelow || textSize === 'Largest';
  const message = `last card top ${lastCardTop}px, visible bottom ${visibleBottom}px`;
  const inlineLabel = page.getByText('Tap a word to pick it.', { exact: true });
  const secondInlineLabel = page.getByText('Then tap Check.', { exact: true });
  const scrollLabel = page.getByText('Scroll to see all four words. Tap one to pick it, then tap Check at the bottom.', { exact: true });

  if (useScrollLabel) {
    test.info().annotations.push({ type: 'first-round', description: `${viewport} ${textSize}: scroll label` });
    await expect(scrollLabel, `${message}: scroll label should be visible`).toBeVisible();
    await expect(inlineLabel, `${message}: inline label should be hidden`).toBeHidden();
    await expect(secondInlineLabel, `${message}: second inline label should be hidden`).toBeHidden();
    await card(page, 'Claude').click();
    await expect(scrollLabel, `${message}: scroll label should stay visible after picking Claude`).toBeVisible();
    await page.getByRole('button', { name: 'Check', exact: true }).click();
    await expect(scrollLabel, `${message}: scroll label should be hidden after checking`).toBeHidden();
  } else {
    test.info().annotations.push({ type: 'first-round', description: `${viewport} ${textSize}: inline labels` });
    await expect(inlineLabel, `${message}: inline label should be visible`).toBeVisible();
    await expect(secondInlineLabel, `${message}: second inline label should be visible`).toBeVisible();
    await expect(scrollLabel, `${message}: scroll label should be hidden`).toBeHidden();
    await card(page, 'Claude').click();
    await expect(inlineLabel, `${message}: inline label should be hidden after picking Claude`).toBeHidden();
    await expect(secondInlineLabel, `${message}: second inline label should be hidden after picking Claude`).toBeHidden();
  }
}

test.describe('Clue Ladder', () => {
  // Each test here opens several rounds, so it gets more time.
  test.describe.configure({ timeout: 60000 });

  test('pins only at the allowed sizes and heights', async ({ page }) => {
    for (const [width, height] of belowPinning) {
      await openRoundAt(page, width, height);
      expect(await isBottomBarPinned(page)).toBe(false);
      await openRoundAt(page, width, height, 'Largest');
      expect(await isBottomBarPinned(page)).toBe(false);
    }
    for (const [width, height] of pinningHeights) {
      for (const size of ['Normal', 'Large'] as const) {
        await openRoundAt(page, width, height, size);
        const pinned = await isBottomBarPinned(page);
        test.info().annotations.push({
          type: 'pinning',
          description: `${width}x${height} ${size}: ${pinned ? 'pinned' : 'not pinned'}`,
        });
        if (pinned) {
          const barHeight = await page.locator('.bottom-bar.pinned').evaluate((element) => {
            return element.getBoundingClientRect().height;
          });
          expect(barHeight, `${width}x${height} ${size} pinned bar height`).toBeLessThanOrEqual(height * 0.4);
        }
      }
    }
    for (const [width, height] of [...belowPinning, ...pinningHeights, [640, 360], [1280, 800]] as const) {
      await openRoundAt(page, width, height, 'Largest');
      expect(await isBottomBarPinned(page)).toBe(false);
    }
  });

  test('does not change pinning during a round', async ({ page }) => {
    for (const [width, height, size] of [[320, 568, 'Large'], [375, 667, 'Normal']] as const) {
      await openRoundAt(page, width, height, size);
      const before = await isBottomBarPinned(page);
      await card(page, 'Claude').click();
      expect(await isBottomBarPinned(page)).toBe(before);
      await page.getByRole('button', { name: 'Next clue (costs 1 bar)', exact: true }).click();
      expect(await isBottomBarPinned(page)).toBe(before);
      await card(page, 'Gemini').click();
      await page.getByRole('button', { name: 'Check', exact: true }).click();
      expect(await isBottomBarPinned(page)).toBe(before);
      await card(page, 'Copilot').click();
      expect(await isBottomBarPinned(page)).toBe(before);
    }
  });

  test('shows a flipped wrong card, miss line, and the three bar warning', async ({ page }) => {
    const missLines = [
      'Good guess. Another clue can narrow it down.', "That one's tricky.", 'Take your time. No clock here.',
      'Every miss teaches you a word.', "New words take a few tries. That's normal.", 'Cross that one off and keep going.',
      'I always say: read the label first.', "I've seen plenty of words come and go. You'll get this one.",
      'No rush. Patience is an old habit worth keeping.', 'In my experience, a clue is worth reading.',
    ];
    for (const [width, height, size] of [[375, 667, 'Normal'], [320, 568, 'Largest']] as const) {
      await openRoundAt(page, width, height, size);
      await card(page, 'Claude').click();
      await page.getByRole('button', { name: 'Next clue (costs 1 bar)', exact: true }).click();
      await card(page, 'Gemini').click();
      await page.getByRole('button', { name: 'Check', exact: true }).click();
      const wrong = card(page, 'Gemini');
      await expect(wrong).toContainText('Not this one');
      expect((await wrong.innerText()).length).toBeGreaterThan('GeminiNot this one'.length);
      const cards = page.getByRole('button').filter({ hasText: /Claude|Gemini|Copilot|ChatGPT/ });
      const terms = await cards.allTextContents();
      expect(terms[terms.length - 1]).toContain('Gemini');
      let found = false;
      for (const line of missLines) {
        if (await page.getByText(line, { exact: true }).first().isVisible().catch(() => false)) found = true;
      }
      expect(found).toBe(true);
      await card(page, 'Copilot').click();
      const visibleStrips = await page.locator('.strip:visible, .strip-inline:visible').allTextContents();
      const batteryText = await page.locator('.battery-wrap p').first().innerText();
      expect(
        visibleStrips.join('\n'),
        `Expected the warning when bars are 3 or fewer after the next tap; ${batteryText}; visible strip text: ${visibleStrips.join(' | ')}`,
      ).toContain('Careful: a wrong guess now ends the round. It still counts.');
    }
  });

  test('makes the answer reveal wait before it can be confirmed', async ({ page }) => {
    await openRoundAt(page, 375, 667);
    await card(page, 'Gemini').click();
    await page.getByRole('button', { name: 'Check', exact: true }).click();
    await page.getByRole('button', { name: 'Show me the answer', exact: true }).click();
    const answer = page.getByRole('button', { name: 'Yes, show it (wait a moment)', exact: true });
    const started = Date.now();
    await expect(answer).toHaveAttribute('aria-disabled', 'true');
    await answer.focus();
    await expect(answer).toBeFocused();
    // Playwright waits for aria-disabled buttons to become enabled, so force the click to test that an early tap does nothing.
    await answer.click({ force: true });
    await expect(page.getByText('Show the answer now?', { exact: true })).toBeVisible();
    await expect.poll(() => page.getByRole('button', { name: 'Yes, show it', exact: true }).count(), { timeout: 2000 }).toBe(1);
    expect(Date.now() - started).toBeGreaterThanOrEqual(600);
    const ready = page.getByRole('button', { name: 'Yes, show it', exact: true });
    await expect(ready).not.toHaveAttribute('aria-disabled', 'true');
    await ready.click();
    const seeMeaning = page.getByRole('button', { name: 'See what it means', exact: true });
    await expect(seeMeaning).toBeVisible();
    await seeMeaning.click();
    await expect(page.getByText('Learned it: Claude.', { exact: true })).toBeVisible();

    await openRoundAt(page, 375, 667);
    await card(page, 'Gemini').click();
    await page.getByRole('button', { name: 'Check', exact: true }).click();
    await page.getByRole('button', { name: 'Show me the answer', exact: true }).click();
    await page.getByRole('button', { name: 'Keep playing', exact: true }).click();
    await expect(page.getByText('Show the answer now?', { exact: true })).toBeHidden();
  });

  test('supports desktop keyboard controls and hides the tip on a phone', async ({ page }) => {
    await openRoundAt(page, 1280, 800);
    await expect(page.getByText('Tip: press 1 to 4 to pick, Enter to check.', { exact: true })).toBeVisible();
    const cards = await page.locator('button.answer-card .term').allTextContents();
    for (let i = 0; i < cards.length; i += 1) {
      await page.keyboard.press(String(i + 1));
      for (const term of cards) await expect(card(page, term)).toHaveAttribute('aria-pressed', term === cards[i] ? 'true' : 'false');
    }
    const claudeIndex = cards.indexOf('Claude');
    expect(claudeIndex).toBeGreaterThanOrEqual(0);
    await page.keyboard.press(String(claudeIndex + 1));
    await card(page, 'Claude').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText(/^You learned Claude\. Solved with \d+ bars? left\.$/)).toBeVisible();
    const box = await page.locator('main').boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(480);
    await openRoundAt(page, 375, 667);
    await expect(page.getByText('Tip: press 1 to 4 to pick, Enter to check.', { exact: true })).toBeHidden();
  });

  test('first round labels at 375x667 Normal', async ({ page }) => {
    await openRoundAt(page, 375, 667, 'Normal', 'new');
    await checkFirstRoundLabels(page, '375x667', 'Normal');
  });

  test('first round labels at 1280x800 Normal', async ({ page }) => {
    await openRoundAt(page, 1280, 800, 'Normal', 'new');
    await checkFirstRoundLabels(page, '1280x800', 'Normal');
  });

  test('first round label at 375x667 Largest', async ({ page }) => {
    await openRoundAt(page, 375, 667, 'Largest', 'new');
    await checkFirstRoundLabels(page, '375x667', 'Largest');
  });
});
