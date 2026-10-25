import type { Page } from '@playwright/test';

export interface Viewport { name: string; width: number; height: number }

export const VIEWPORTS: Viewport[] = [
  { name: '320x480', width: 320, height: 480 },
  { name: '320x568', width: 320, height: 568 },
  { name: '360x560', width: 360, height: 560 },
  { name: '375x548', width: 375, height: 548 },
  { name: '360x640', width: 360, height: 640 },
  { name: '640x360', width: 640, height: 360 },
  { name: '1280x800', width: 1280, height: 800 },
];

export interface ScreenInfo { name: string; hash: string }

export const SCREENS: ScreenInfo[] = [
  { name: 'home', hash: '#/' },
  { name: 'settings', hash: '#/settings' },
  { name: 'how', hash: '#/how' },
  { name: 'about', hash: '#/about' },
  { name: 'review', hash: '#/review' },
  { name: 'learn', hash: '#/learn' },
  { name: 'practice', hash: '#/practice' },
  { name: 'oldtech', hash: '#/oldtech' },
  { name: 'ptp', hash: '#/ptp' },
  { name: 'badges', hash: '#/badges' },
  { name: 'code', hash: '#/code' },
  { name: 'codeUse', hash: '#/code/use' },
  { name: 'get', hash: '#/get' },
  { name: 'notFound', hash: '#/no-such-page' },
];

export type TextSize = 'Normal' | 'Large' | 'Largest';

export async function waitForReady(page: Page): Promise<void> {
  await page.locator('#root [aria-busy="true"]').waitFor({ state: 'detached' });
  await page.locator('#root h1').first().waitFor({ state: 'visible' });
}

export async function openDemo(page: Page, demo: 'judge' | 'new', hash = '#/'): Promise<void> {
  await page.goto(`/?demo=${demo}${hash}`);
  await waitForReady(page);
}

export async function goToHash(page: Page, hash: string): Promise<void> {
  await page.evaluate((nextHash) => {
    window.location.hash = nextHash;
  }, hash);
  await waitForReady(page);
}

export async function setTextSize(page: Page, size: TextSize): Promise<void> {
  if (size !== 'Normal') {
    await goToHash(page, '#/settings');
    const button = page.getByRole('button', { name: size, exact: true });
    await button.click();
    await button.waitFor({ state: 'visible' });
    await page.locator(`button[aria-pressed="true"]`).filter({ hasText: size }).waitFor();
  }
  await goToHash(page, '#/');
}

export async function startTodaysRound(page: Page): Promise<void> {
  const start = page.getByRole('button', { name: /^(Play today's word|Continue)$/ });
  if (await start.count()) await start.first().click();
  else await page.getByRole('link', { name: /^(Play today's word|Continue)$/ }).first().click();
  await page.getByRole('button', { name: 'Check', exact: true }).waitFor({ state: 'visible' });
}

export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const details = await page.evaluate(() => {
    const viewport = window.innerWidth;
    const width = document.documentElement.scrollWidth;
    const items = Array.from(document.querySelectorAll<HTMLElement>('*'))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          element,
          right: rect.right,
          depth: (() => {
            let count = 0;
            let current: HTMLElement | null = element;
            while (current) {
              count += 1;
              current = current.parentElement;
            }
            return count;
          })(),
        };
      })
      .filter(({ element, right }) => {
        const style = getComputedStyle(element);
        return right > viewport + 1 && element.getClientRects().length > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      })
      .sort((a, b) => b.depth - a.depth || b.right - a.right)
      .slice(0, 5)
      .map(({ element, right }) => {
        const text = element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 40) || '';
        const className = typeof element.className === 'string' ? element.className : '';
        return `<${element.tagName.toLowerCase()}> class="${className}" '${text}' right=${Math.round(right)}`;
      });
    return { viewport, width, items };
  });
  if (details.width > details.viewport) {
    const causes = details.items.length > 0 ? details.items.join('; ') : 'no visible element identified';
    throw new Error(`horizontal scroll ${details.width} > ${details.viewport}: ${causes}`);
  }
}

export async function findClippedText(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const clipped: string[] = [];
    const elements = Array.from(document.querySelectorAll<HTMLElement>('*'));
    for (const element of elements) {
      if (!element.offsetParent && element !== document.body) continue;
      if (element.closest('.visually-hidden, [aria-hidden="true"]')) continue;
      const style = getComputedStyle(element);
      const hidesOverflow = ['hidden', 'clip'].includes(style.overflowX) || ['hidden', 'clip'].includes(style.overflowY) || style.textOverflow === 'ellipsis';
      const hasOverflow = element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1;
      if (hidesOverflow && hasOverflow && element.textContent?.trim()) {
        clipped.push(`<${element.tagName.toLowerCase()}> '${element.textContent.trim().slice(0, 40)}'`);
      }
    }
    return clipped;
  });
}

export async function findButtonsNotReachedByTab(page: Page): Promise<string[]> {
  const names = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>('button, a, [role="button"], input, select, textarea'));
    return items.filter((item) => {
      const style = getComputedStyle(item);
      return style.display !== 'none' && style.visibility !== 'hidden' && item.getClientRects().length > 0 && !(item instanceof HTMLButtonElement && item.disabled);
    }).map((item) => item.getAttribute('aria-label') || item.textContent?.trim() || item.tagName.toLowerCase());
  });
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo(0, 0);
  });
  const reached = new Set<string>();
  const limit = names.length * 2 + 10;
  for (let i = 0; i < limit; i += 1) {
    await page.keyboard.press('Tab');
    const name = await page.evaluate(() => {
      const item = document.activeElement as HTMLElement | null;
      if (!item || !item.matches('button, a, [role="button"], input, select, textarea')) return '';
      return item.getAttribute('aria-label') || item.textContent?.trim() || item.tagName.toLowerCase();
    });
    if (name) reached.add(name);
  }
  return names.filter((name) => !reached.has(name));
}

export async function isBottomBarPinned(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const check = Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Check');
    if (!check) return false;
    let element: HTMLElement | null = check;
    while (element) {
      const position = getComputedStyle(element).position;
      if (position === 'fixed' || position === 'sticky') return true;
      element = element.parentElement;
    }
    return false;
  });
}

export async function saveScreen(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `e2e/.output/screens/${name}.png`, fullPage: true });
}
