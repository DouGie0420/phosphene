import {
  buildContradictionRead,
  deriveBiasCandidates,
  detectHumanPatterns,
} from '../src/contradiction-engine.js';
import { DEFAULT_EVOLUTION } from '../src/evolution.js';
import { applyPreset, perceive, reset } from '../src/phosphene.js';
import type { EvolutionState } from '../src/types.js';

function freshEvolution(): EvolutionState {
  return JSON.parse(JSON.stringify(DEFAULT_EVOLUTION));
}

describe('contradiction engine', () => {
  beforeEach(() => {
    reset();
  });

  test('detects work-life contradiction patterns from natural language', () => {
    const hits = detectHumanPatterns('The work is coherent, but my life is chaos and the cost is starting to show.');
    expect(hits[0]?.id).toBe('work_more_coherent_than_life');
  });

  test('detects ritual dependency in Chinese', () => {
    const hits = detectHumanPatterns('没有这套仪式我就没法开始工作，我已经把它当成创作本身了。');
    expect(hits.some(hit => hit.id === 'ritual_dependency')).toBe(true);
  });

  test('derives bias candidates from evolution material', () => {
    const evo = freshEvolution();
    evo.crystallizedInsights = [
      '[2026-04-15] The work is coherent but life is chaos.',
      '[2026-04-15] Without the ritual I feel like nothing real can begin.',
    ];

    const biases = deriveBiasCandidates(evo);
    expect(biases.map(bias => bias.id)).toEqual(
      expect.arrayContaining(['bias_life_work_delta', 'bias_ritual_separation'])
    );
  });

  test('builds a contradiction read with hard rule and bias candidates', () => {
    const read = buildContradictionRead(
      'I keep telling myself the chaos caused the breakthrough, but I am not sure anymore.',
      'en'
    );

    expect(read).toBeDefined();
    expect(read?.title).toBe('Human Contradiction Read');
    expect(read?.hardRule).toContain('never romanticize collapse');
    expect(read?.biasCandidates.length).toBeGreaterThan(0);
  });

  test('perceive surfaces human patterns in perception output', async () => {
    applyPreset('deep-flux');
    const output = await perceive('The work is coherent but my life is chaos, and I keep calling that damage depth.');

    expect(output.humanPatterns.length).toBeGreaterThan(0);
    expect(output.humanPatterns.some(pattern => pattern.id === 'work_more_coherent_than_life')).toBe(true);
  });
});
