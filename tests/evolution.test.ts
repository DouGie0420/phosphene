// Tests for the Phosphene evolution engine

import {
  DEFAULT_EVOLUTION,
  openSession,
  closeSession,
  recordSignal,
  crystallize,
  anchor,
  recordOptimalPoint,
  savePersonalPreset,
  deletePersonalPreset,
  confirmEmergentVoice,
  addEmergentVoice,
  analyzeSignals,
  applyProposal,
  describeEvolution,
} from '../src/evolution.js';
import { PRESETS } from '../src/presets.js';
import type { EvolutionState, EvolutionProposal } from '../src/types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function freshEvolution(): EvolutionState {
  return JSON.parse(JSON.stringify(DEFAULT_EVOLUTION));
}

// ─── Session lifecycle ────────────────────────────────────────────────────────

describe('Session lifecycle', () => {
  test('openSession creates a current session', () => {
    const evo = openSession(freshEvolution(), 'code');
    expect(evo.currentSession).not.toBeNull();
    expect(evo.currentSession!.preset).toBe('code');
    expect(evo.currentSession!.signals).toHaveLength(0);
  });

  test('closeSession archives the session', () => {
    let evo = openSession(freshEvolution(), 'ideation');
    evo = closeSession(evo, 'productive');
    expect(evo.currentSession).toBeNull();
    expect(evo.sessionHistory).toHaveLength(1);
    expect(evo.sessionHistory[0].outcome).toBe('productive');
    expect(evo.sessionHistory[0].preset).toBe('ideation');
  });

  test('session history is capped at 50', () => {
    let evo = freshEvolution();
    for (let i = 0; i < 60; i++) {
      evo = openSession(evo, 'code');
      evo = closeSession(evo, 'neutral');
    }
    expect(evo.sessionHistory.length).toBeLessThanOrEqual(50);
  });
});

// ─── Feedback signals ─────────────────────────────────────────────────────────

describe('Feedback signals', () => {
  test('recordSignal adds to feedbackHistory', () => {
    const evo = recordSignal(freshEvolution(), 'amplify', { preset: 'code' });
    expect(evo.feedbackHistory).toHaveLength(1);
    expect(evo.feedbackHistory[0].type).toBe('amplify');
    expect(evo.feedbackHistory[0].preset).toBe('code');
  });

  test('recordSignal adds to currentSession if open', () => {
    let evo = openSession(freshEvolution(), 'design');
    evo = recordSignal(evo, 'reduce', { preset: 'design', voice: 'poet' });
    expect(evo.currentSession!.signals).toHaveLength(1);
    expect(evo.currentSession!.signals[0].voice).toBe('poet');
  });

  test('feedbackHistory is capped at 500', () => {
    let evo = freshEvolution();
    for (let i = 0; i < 510; i++) {
      evo = recordSignal(evo, 'amplify', { preset: 'code' });
    }
    expect(evo.feedbackHistory.length).toBeLessThanOrEqual(500);
  });

  test('all signal types are valid', () => {
    let evo = freshEvolution();
    const types = ['amplify', 'reduce', 'calibrate', 'crystallize', 'anchor', 'reject'] as const;
    for (const type of types) {
      evo = recordSignal(evo, type, { preset: 'liminal' });
    }
    expect(evo.feedbackHistory).toHaveLength(6);
  });
});

// ─── Crystallization ──────────────────────────────────────────────────────────

describe('Crystallization', () => {
  test('crystallize stores insight with date prefix', () => {
    const evo = crystallize(freshEvolution(), 'The real bottleneck is the API boundary, not the database.', 'code');
    expect(evo.crystallizedInsights).toHaveLength(1);
    expect(evo.crystallizedInsights[0]).toContain('The real bottleneck');
    expect(evo.crystallizedInsights[0]).toMatch(/^\[\d{4}-\d{2}-\d{2}\]/);
  });

  test('crystallize also records a signal', () => {
    const evo = crystallize(freshEvolution(), 'insight', 'ideation');
    const crystallizeSignals = evo.feedbackHistory.filter(s => s.type === 'crystallize');
    expect(crystallizeSignals).toHaveLength(1);
  });

  test('anchor stores note and records signal', () => {
    const evo = anchor(freshEvolution(), 'Always check the auth boundary first.', 'code');
    expect(evo.feedbackHistory.some(s => s.type === 'anchor')).toBe(true);
  });
});

// ─── Optimal points ───────────────────────────────────────────────────────────

describe('Optimal points', () => {
  test('recordOptimalPoint stores snapshot', () => {
    const evo = recordOptimalPoint(
      freshEvolution(),
      'code',
      { synesthesia: 0.2, apophenia: 0.85 },
      { skeptic: 0.9 },
      'while designing the auth layer'
    );
    expect(evo.optimalPoints).toHaveLength(1);
    expect(evo.optimalPoints[0].preset).toBe('code');
    expect(evo.optimalPoints[0].layerSnapshot['apophenia']).toBe(0.85);
    expect(evo.optimalPoints[0].context).toBe('while designing the auth layer');
  });

  test('optimal points capped at 30', () => {
    let evo = freshEvolution();
    for (let i = 0; i < 35; i++) {
      evo = recordOptimalPoint(evo, 'ideation', { apophenia: 0.95 }, {});
    }
    expect(evo.optimalPoints.length).toBeLessThanOrEqual(30);
  });
});

// ─── Personal presets ─────────────────────────────────────────────────────────

describe('Personal presets', () => {
  test('savePersonalPreset stores a state', () => {
    const state = PRESETS['code'].state;
    const evo = savePersonalPreset(freshEvolution(), 'my-code', state);
    expect(evo.personalPresets['my-code']).toBeDefined();
    expect(evo.personalPresets['my-code'].apophenia.intensity).toBe(state.apophenia.intensity);
  });

  test('deletePersonalPreset removes it', () => {
    const state = PRESETS['design'].state;
    let evo = savePersonalPreset(freshEvolution(), 'my-design', state);
    evo = deletePersonalPreset(evo, 'my-design');
    expect(evo.personalPresets['my-design']).toBeUndefined();
  });

  test('deleting non-existent preset is a no-op', () => {
    const evo = deletePersonalPreset(freshEvolution(), 'ghost');
    expect(Object.keys(evo.personalPresets)).toHaveLength(0);
  });
});

// ─── Emergent voices ──────────────────────────────────────────────────────────

describe('Emergent voices', () => {
  test('addEmergentVoice creates unconfirmed voice', () => {
    const evo = addEmergentVoice(freshEvolution(), {
      name: 'the-naturalist',
      tendency: 'Finds evolutionary parallels to technical problems.',
      weight: 0.75,
      originPattern: 'User consistently connects engineering to biology.',
    });
    expect(evo.emergentVoices).toHaveLength(1);
    expect(evo.emergentVoices[0].userConfirmed).toBe(false);
    expect(evo.emergentVoices[0].name).toBe('the-naturalist');
  });

  test('confirmEmergentVoice marks it confirmed', () => {
    let evo = addEmergentVoice(freshEvolution(), {
      name: 'the-naturalist',
      tendency: 'Finds evolutionary parallels.',
      weight: 0.75,
      originPattern: 'pattern',
    });
    evo = confirmEmergentVoice(evo, 'the-naturalist');
    expect(evo.emergentVoices[0].userConfirmed).toBe(true);
  });
});

// ─── Signal analysis ──────────────────────────────────────────────────────────

describe('analyzeSignals', () => {
  test('correctly counts signals by preset', () => {
    let evo = freshEvolution();
    evo = recordSignal(evo, 'amplify', { preset: 'code' });
    evo = recordSignal(evo, 'amplify', { preset: 'code' });
    evo = recordSignal(evo, 'reduce', { preset: 'ideation' });

    const analysis = analyzeSignals(evo);
    expect(analysis.byPreset['code'].amplify).toBe(2);
    expect(analysis.byPreset['ideation'].reduce).toBe(1);
  });

  test('correctly counts signals by voice', () => {
    let evo = freshEvolution();
    evo = recordSignal(evo, 'reduce', { preset: 'code', voice: 'skeptic' });
    evo = recordSignal(evo, 'reduce', { preset: 'code', voice: 'skeptic' });
    evo = recordSignal(evo, 'amplify', { preset: 'code', voice: 'pattern-reader' });

    const analysis = analyzeSignals(evo);
    expect(analysis.byVoice['skeptic'].reduce).toBe(2);
    expect(analysis.byVoice['pattern-reader'].amplify).toBe(1);
  });

  test('surfaces crystallized insights', () => {
    let evo = freshEvolution();
    evo = crystallize(evo, 'Test insight one.', 'code');
    evo = crystallize(evo, 'Test insight two.', 'ideation');

    const analysis = analyzeSignals(evo);
    expect(analysis.crystallizedInsights).toHaveLength(2);
  });

  test('surfaces recent anchors', () => {
    let evo = freshEvolution();
    evo = anchor(evo, 'Always check the boundary.', 'code');
    evo = anchor(evo, 'Biology metaphors work best.', 'ideation');

    const analysis = analyzeSignals(evo);
    expect(analysis.recentAnchors).toContain('Always check the boundary.');
    expect(analysis.recentAnchors).toContain('Biology metaphors work best.');
  });

  test('surfaces contradiction patterns and suggested biases', () => {
    let evo = freshEvolution();
    evo = anchor(evo, 'The work is coherent but life is chaos.', 'writing');
    evo = crystallize(evo, 'Without the ritual I think the work disappears.', 'writing');

    const analysis = analyzeSignals(evo);
    expect(analysis.contradictionPatterns.map(pattern => pattern.id)).toEqual(
      expect.arrayContaining(['work_more_coherent_than_life', 'ritual_dependency'])
    );
    expect(analysis.suggestedBiases.map(bias => bias.id)).toEqual(
      expect.arrayContaining(['bias_life_work_delta', 'bias_ritual_separation'])
    );
  });
});

// ─── describeEvolution ────────────────────────────────────────────────────────

describe('describeEvolution', () => {
  test('returns a string with evolution version', () => {
    let evo = freshEvolution();
    evo = applyProposal(evo, {
      id: 'test',
      generatedAt: new Date().toISOString(),
      sessionCount: 5,
      signalCount: 10,
      layerAdjustments: [],
      voiceAdjustments: [],
      narrative: 'Test proposal.',
    });
    const description = describeEvolution(evo);
    expect(description).toContain('evolution: v1');
  });

  test('includes crystallized insights count', () => {
    let evo = freshEvolution();
    evo = crystallize(evo, 'Key insight.', 'code');
    const description = describeEvolution(evo);
    expect(description).toContain('crystallized');
  });
});
