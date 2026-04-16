import { buildFieldLaws } from '../src/field-laws.js';
import { composeRitualProposal } from '../src/ritual.js';

describe('field laws', () => {
  test('builds design laws for design proposals', () => {
    const proposal = composeRitualProposal(
      'This interface feels flat. The hierarchy and motion are failing.',
      'clear',
    );

    const laws = buildFieldLaws(proposal, 'en');

    expect(laws?.field).toBe('design');
    expect(laws?.laws.join(' ')).toContain('Motion');
    expect(laws?.forbiddenMoves.length).toBeGreaterThan(0);
  });

  test('builds market laws for finance proposals', () => {
    const proposal = composeRitualProposal(
      'BTC has been range-bound. I need invalidation, risk, and flow.',
      'clear',
    );

    const laws = buildFieldLaws(proposal, 'zh');

    expect(laws?.field).toBe('market');
    expect(laws?.laws.join(' ')).toContain('用户当前时间');
    expect(laws?.forbiddenMoves.join(' ')).toContain('旧价格');
    expect(laws?.proofOfPower.join(' ')).toContain('失效');
  });
});
