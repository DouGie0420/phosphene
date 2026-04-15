import { buildResponseScaffold } from '../src/response-scaffold.js';
import { composeRitualProposal } from '../src/ritual.js';

describe('response scaffold', () => {
  test('builds a design scaffold from a design proposal', () => {
    const proposal = composeRitualProposal(
      'This landing page feels dead. The hierarchy, palette, and motion all feel wrong.',
      'clear',
    );

    const scaffold = buildResponseScaffold(proposal, 'en', 'entered');

    expect(scaffold?.field).toBe('design');
    expect(scaffold?.sections.map(section => section.label)).toEqual(
      expect.arrayContaining(['Judgment', 'Palette law', 'Motion law'])
    );
  });

  test('builds a market scaffold from a finance proposal', () => {
    const proposal = composeRitualProposal(
      'BTC has been consolidating. Give me structure, invalidation, and liquidity.',
      'clear',
    );

    const scaffold = buildResponseScaffold(proposal, 'zh', 'entered');

    expect(scaffold?.field).toBe('market');
    expect(scaffold?.sections.map(section => section.label)).toEqual(
      expect.arrayContaining(['主判断', '失效条件', '风险栈'])
    );
  });

  test('injects a contradiction section when the input carries human-pattern language', () => {
    const input = 'This landing page has coherent hierarchy and palette, but the work is cleaner than my life chaos, and I keep calling that damage depth.';
    const proposal = composeRitualProposal(input, 'clear');

    const scaffold = buildResponseScaffold(proposal, 'en', 'entered', {
      input,
    });

    expect(scaffold?.sections.map(section => section.label)).toContain('Human contradiction');
  });
});
