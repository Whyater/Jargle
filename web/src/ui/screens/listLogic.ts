import type { PtpSummary } from '../../engine/api';
import type { TopicId } from '../../engine/types';

const names: Record<string, string> = {
  'locks-and-keys': 'Locks and Keys',
  'talking-computers': 'Talking Computers',
  'scams-and-fakes': 'Scams and Fakes',
  'your-phone': 'Your Phone',
  'internet-talk': 'Internet Talk',
  'how-the-internet-works': 'How the Internet Works',
  'money-on-your-phone': 'Money on Your Phone',
  'old-tech': 'Old Tech',
};
export function topicName(id: TopicId | string): string {
  return names[id] || id;
}
export function roundSummaryLine(round: PtpSummary['rounds'][number]): string {
  if (!round.solved) return 'Learned it';
  return 'Solved with ' + round.bars + (round.bars === 1 ? ' bar left' : ' bars left');
}
export function pluralText(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}
