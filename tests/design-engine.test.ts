import {
  readDesignIntent,
  renderDesignReading,
} from '../src/design-engine.js';

describe('design engine', () => {
  test('judges flat landing-page language as hierarchy failure', () => {
    const reading = readDesignIntent(
      '这个 landing page 太平了，层级不成立，动效也没有呼吸感，我不要模板感。'
    );

    expect(reading.thesis).toContain('对比秩序');
    expect(reading.accidentalMessage).toContain('值得');
    expect(reading.motionPrinciples.length).toBeGreaterThan(0);
  });

  test('renders a design reading with composition and anti-goals', () => {
    const rendered = renderDesignReading(
      readDesignIntent('I want a minimal luxury wellness interface with motion and strong hierarchy.')
    );

    expect(rendered).toContain('[Phosphene Design Read]');
    expect(rendered).toContain('Composition moves:');
    expect(rendered).toContain('Anti-goals:');
  });
});
