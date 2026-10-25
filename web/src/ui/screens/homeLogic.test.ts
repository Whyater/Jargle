import { describe, expect, it } from 'vitest';
import { todayItemId, judgeLineVisible } from './homeLogic';
import type { ContentBundle } from '../../engine/types';

const content = {
  schedule: { days: [{ date: '2026-10-26', term: 'first', rerun: false }] },
} as ContentBundle;
describe('home helpers', () => {
  it('finds the scheduled item', () => {
    expect(todayItemId(content, '2026-10-26')).toBe('first');
    expect(todayItemId(content, '2026-10-27')).toBe(null);
  });
  it('hides the judge link in judge demo', () => {
    expect(judgeLineVisible(true, null)).toBe(true);
    expect(judgeLineVisible(true, 'judge')).toBe(false);
  });
});
