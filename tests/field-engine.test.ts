import {
  buildFieldSpotlight,
  senseCommonField,
} from '../src/field-engine.js';

describe('field engine', () => {
  test('routes strong design language into the design field', () => {
    const sensed = senseCommonField('This landing page feels dead. The hierarchy and motion are not carrying anything.');

    expect(sensed[0]?.field).toBe('design');
  });

  test('builds a spotlight for financial language', () => {
    const spotlight = buildFieldSpotlight('BTC has been consolidating with lower highs. Help me read structure and liquidity.');

    expect(spotlight?.field).toBe('market');
    expect(spotlight?.rendered).toContain('Market Read');
  });
});
