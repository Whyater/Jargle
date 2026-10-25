import { describe, expect, it } from 'vitest';
import { roundSummaryLine, topicName } from './listLogic';

describe('list helpers', () => {
  it('names topics', () => expect(topicName('locks-and-keys')).toBe('Locks and Keys'));
  it('summarizes solved and learned rounds', () => {
    expect(roundSummaryLine({ itemId: 'x', term: 'X', solved: true, bars: 1 })).toBe(
      'Solved with 1 bar left',
    );
    expect(roundSummaryLine({ itemId: 'x', term: 'X', solved: false, bars: 0 })).toBe('Learned it');
  });
});
