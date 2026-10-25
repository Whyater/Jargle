// @vitest-environment jsdom

import { render } from 'preact';
import type { ComponentChildren } from 'preact';
import { afterEach, describe, expect, it } from 'vitest';

import { Badge, Bud, Floyd } from './index';
import type { BudMood } from './index';

const badgeIds = [
  'first-word',
  'week-one',
  'days-30',
  'days-60',
  'first-lesson',
  'floyds-student',
  'taught-someone',
] as const;

function renderArt(node: ComponentChildren) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(node, container);
  const svg = container.querySelector('svg');
  expect(svg).not.toBeNull();
  return svg as SVGSVGElement;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Floyd', () => {
  it('uses a default size of 96 and accepts a custom size', () => {
    const defaultSvg = renderArt(<Floyd />);
    expect(defaultSvg.getAttribute('width')).toBe('96');
    expect(defaultSvg.getAttribute('height')).toBe('96');

    const customSvg = renderArt(<Floyd size={128} />);
    expect(customSvg.getAttribute('width')).toBe('128');
    expect(customSvg.getAttribute('height')).toBe('128');
  });

  it('handles title, aria, and wiggle state', () => {
    const titledSvg = renderArt(<Floyd title="Floyd" wiggle />);
    expect(titledSvg.getAttribute('role')).toBe('img');
    expect(titledSvg.hasAttribute('aria-hidden')).toBe(false);
    expect(titledSvg.querySelector('title')?.textContent).toBe('Floyd');
    expect(titledSvg.classList.contains('art-wiggle')).toBe(true);

    const plainSvg = renderArt(<Floyd />);
    expect(plainSvg.getAttribute('aria-hidden')).toBe('true');
    expect(plainSvg.hasAttribute('role')).toBe(false);
    expect(plainSvg.classList.contains('art-wiggle')).toBe(false);
  });

  it('stays under the size budget', () => {
    expect(renderArt(<Floyd />).outerHTML.length).toBeLessThan(4000);
  });
});

describe('Bud', () => {
  it('uses a default size of 96 and accepts a custom size', () => {
    const defaultSvg = renderArt(<Bud />);
    expect(defaultSvg.getAttribute('width')).toBe('96');
    expect(defaultSvg.getAttribute('height')).toBe('96');

    const customSvg = renderArt(<Bud size={128} />);
    expect(customSvg.getAttribute('width')).toBe('128');
    expect(customSvg.getAttribute('height')).toBe('128');
  });

  it('handles title, aria, and wiggle state', () => {
    const titledSvg = renderArt(<Bud title="Bud" wiggle />);
    expect(titledSvg.getAttribute('role')).toBe('img');
    expect(titledSvg.hasAttribute('aria-hidden')).toBe(false);
    expect(titledSvg.querySelector('title')?.textContent).toBe('Bud');
    expect(titledSvg.classList.contains('art-wiggle')).toBe(true);

    const plainSvg = renderArt(<Bud />);
    expect(plainSvg.getAttribute('aria-hidden')).toBe('true');
    expect(plainSvg.hasAttribute('role')).toBe(false);
    expect(plainSvg.classList.contains('art-wiggle')).toBe(false);
  });

  it.each([
    ['idle', 'circle', '#1F3A68'],
    ['happy', 'path', '#FFD23F'],
    ['sympathetic', 'path', '#E08A1E'],
  ] as const)('draws the %s mood with the expected color', (mood, tag, color) => {
    const svg = renderArt(<Bud mood={mood as BudMood} />);
    const shape = svg.querySelector(tag + '[fill="' + color + '"]');
    expect(shape).not.toBeNull();

    if (mood !== 'idle') {
      expect(shape?.getAttribute('stroke')).not.toBe('none');
      expect(svg.getAttribute('stroke')).toBe('#1F3A68');
      expect(svg.getAttribute('stroke-width')).toBe('2');
    }
  });

  it.each(['idle', 'happy', 'sympathetic'] as const)('stays under the size budget for %s', (mood) => {
    expect(renderArt(<Bud mood={mood} />).outerHTML.length).toBeLessThan(4000);
  });
});

describe('Badge', () => {
  it.each(badgeIds)('%s renders earned and locked variants', (id) => {
    const earnedSvg = renderArt(<Badge id={id} earned />);
    const lockedSvg = renderArt(<Badge id={id} earned={false} />);

    expect(earnedSvg.getAttribute('viewBox')).toBe('0 0 96 96');
    expect(lockedSvg.getAttribute('viewBox')).toBe('0 0 96 96');
    expect(earnedSvg.classList.contains('art-badge-earned')).toBe(true);
    expect(lockedSvg.classList.contains('art-badge-earned')).toBe(false);
    expect(lockedSvg.outerHTML).not.toMatch(/#(FFD23F|E08A1E|FFFFFF)/i);
  });

  it('has the same title and aria behavior as the other art', () => {
    const titledSvg = renderArt(<Badge id="first-word" earned title="First word" />);
    expect(titledSvg.getAttribute('role')).toBe('img');
    expect(titledSvg.hasAttribute('aria-hidden')).toBe(false);
    expect(titledSvg.querySelector('title')?.textContent).toBe('First word');

    const plainSvg = renderArt(<Badge id="first-word" earned={false} />);
    expect(plainSvg.getAttribute('aria-hidden')).toBe('true');
    expect(plainSvg.hasAttribute('role')).toBe(false);
  });
});

describe('all rendered art', () => {
  it('contains no filters, gradients, or text elements', () => {
    const nodes = [
      <Floyd key="floyd" />,
      <Bud key="bud-idle" mood="idle" />,
      <Bud key="bud-happy" mood="happy" />,
      <Bud key="bud-sympathetic" mood="sympathetic" />,
      ...badgeIds.flatMap((id) => [
        <Badge key={`${id}-earned`} id={id} earned />,
        <Badge key={`${id}-locked`} id={id} earned={false} />,
      ]),
    ];

    for (const node of nodes) {
      const svg = renderArt(node);
      expect(svg.querySelector('filter, linearGradient, radialGradient, text')).toBeNull();
    }
  });
});
