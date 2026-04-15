import { buildFieldComposition } from '../src/field-composer.js';
import { composeRitualProposal } from '../src/ritual.js';

describe('field composer', () => {
  test('builds a design composition draft', () => {
    const proposal = composeRitualProposal(
      '这个 landing page 太平了，层级、色彩和动效都不成立。',
      'clear',
    );

    const composition = buildFieldComposition(
      '这个 landing page 太平了，层级、色彩和动效都不成立。',
      proposal,
      'zh',
    );

    expect(composition?.field).toBe('design');
    expect(composition?.fullDraft).toContain('色彩');
    expect(composition?.beats.map(beat => beat.label)).toEqual(
      expect.arrayContaining(['色彩法则', '动效法则'])
    );
  });

  test('builds a market composition draft', () => {
    const proposal = composeRitualProposal(
      'The company beat earnings but cut guidance. Give me invalidation and risk.',
      'clear',
    );

    const composition = buildFieldComposition(
      'The company beat earnings but cut guidance. Give me invalidation and risk.',
      proposal,
      'en',
    );

    expect(composition?.field).toBe('market');
    expect(composition?.fullDraft).toContain('This thesis fails here');
  });

  test('adds contradiction content to normal composition drafts', () => {
    const input = 'This landing page has coherent hierarchy and palette, but the work is cleaner than my life chaos, and I keep calling that damage depth.';
    const proposal = composeRitualProposal(input, 'clear');
    const composition = buildFieldComposition(input, proposal, 'en');

    expect(composition?.beats.map(beat => beat.label)).toContain('Human contradiction');
    expect(composition?.fullDraft).toContain('There is also a human contradiction');
  });
});
