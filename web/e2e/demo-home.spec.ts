import { test, expect } from '@playwright/test';
import { openDemo } from './helpers';

test.describe('Demo home', () => {
  test('shows the judge home summary and controls', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await openDemo(page, 'judge');
    await expect(page.getByText('Days learned: 8', { exact: true })).toBeVisible();
    await expect(page.getByText('Streak: 3 days played', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Review: 3 words to practice', exact: true })).toBeVisible();
    await expect(page.getByText('Demo: a made-up history with 8 days learned. New here? Tap How to play. Try Pass the Phone, or pick a wrong word to see what it means.', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Restart demo', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Leave demo', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'How to play', exact: true })).toBeVisible();
    await expect(page.getByText("Yesterday's word is in Practice.", { exact: true })).toBeHidden();
    await expect(page.getByText('New streak starts today.', { exact: true })).toBeHidden();
  });

  test("shows earned badges and Floyd's Student progress", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await openDemo(page, 'judge', '#/badges');
    await expect(page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'First Word', exact: true }) })).toContainText('Earned');
    await expect(page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Week One', exact: true }) })).toContainText('Earned');
    await expect(page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'First Lesson', exact: true }) })).toContainText('Earned');
    await expect(page.getByRole('article').filter({ hasText: "Floyd's Student" })).toContainText('4 of 5');
  });

  test('handles the new demo text size question', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await openDemo(page, 'new');
    await expect(page.getByRole('heading', { name: 'Is this text big enough?', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Make it Largest', exact: true }).click();
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe('24px');
    await expect(page.getByRole('heading', { name: 'Is this text big enough?', exact: true })).toBeHidden();
  });

  test('shows the in-app browser note only for an in-app user agent', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await openDemo(page, 'new');
    await expect(page.getByRole('complementary', { name: 'Browser note' })).toBeHidden();
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'userAgent', { configurable: true, get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0.0.0' });
    });
    // Same URL as before, so reload to run the init script.
    await page.reload();
    await page.locator('#root h1').first().waitFor();
    const note = page.getByRole('complementary', { name: 'Browser note' });
    await expect(note).toContainText("You're inside Instagram.");
    const play = page.getByRole('button', { name: "Play today's word", exact: true });
    const noteBox = await note.boundingBox();
    const playBox = await play.boundingBox();
    expect(noteBox).not.toBeNull();
    expect(playBox).not.toBeNull();
    expect(noteBox!.y, `Browser note top ${noteBox!.y} must be above Play today's word top ${playBox!.y}`).toBeLessThan(playBox!.y);
    await expect(page.getByRole('complementary', { name: 'Browser note' })).toBeVisible();
  });
});
