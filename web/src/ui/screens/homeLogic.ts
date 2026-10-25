import type { ContentBundle } from '../../engine/types';

export function todayItemId(content: ContentBundle, today: string): string | null {
  for (const day of content.schedule.days) if (day.date === today) return day.term;
  return null;
}

export function judgeLineVisible(show: boolean, demo: 'judge' | 'new' | null): boolean {
  return show && demo !== 'judge';
}
