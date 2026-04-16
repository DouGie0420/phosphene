import { buildStudioPrimer } from '../src/studio-primer.js';
import { composeRitualProposal } from '../src/ritual.js';

describe('studio primer', () => {
  test('builds a threshold primer for design', () => {
    const proposal = composeRitualProposal(
      '这个 landing page 太平了，层级和动效都不对。',
      'clear',
    );

    const primer = buildStudioPrimer(proposal, 'zh', 'threshold');

    expect(primer?.opening).toContain('判断');
    expect(primer?.payload).toContain('主判断');
  });

  test('builds an entered primer for markets', () => {
    const proposal = composeRitualProposal(
      'The company beat earnings but cut guidance. Give me risk and invalidation.',
      'clear',
    );

    const primer = buildStudioPrimer(proposal, 'en', 'entered');

    expect(primer?.cadence).toContain('judgment');
    expect(primer?.antiSlop.length).toBeGreaterThan(0);
    expect(primer?.payload).toContain('reference time first');
    expect(primer?.antiSlop).toContain('stale material');
  });

  test('carries contradiction guidance into the primer when input warrants it', () => {
    const input = 'This landing page has coherent hierarchy and palette, but the work is cleaner than my life chaos, and I keep calling that damage depth.';
    const proposal = composeRitualProposal(input, 'clear');

    const primer = buildStudioPrimer(proposal, 'en', 'entered', { input });

    expect(primer?.payload).toContain('Briefly name the human contradiction');
    expect(primer?.antiSlop).toContain('Do not romanticize imbalance as depth');
  });
});
