import { createRuntimeFrame, reset } from '../src/phosphene.js';
import { composeRitualProposal } from '../src/ritual.js';
import {
  calibrateAwakeningResponse,
  completeAwakening,
  createAwakeningMessage,
  detectPrecisionIntent,
  processSessionTurn,
  previewSessionTurn,
} from '../src/session-runtime.js';
import { applyPreset, getContext } from '../src/phosphene.js';

function mockState(overrides: Record<string, unknown> = {}) {
  return {
    version: '0.4.0',
    awakened: true,
    preset: 'clear',
    customIntensities: {},
    activeVoices: [],
    offeringsConsumed: [],
    pendingRitual: null,
    sessionCount: 1,
    firstInstalledAt: null,
    lastUpdated: null,
    evolution: {
      currentSession: null,
      sessionHistory: [],
      feedbackHistory: [],
      crystallizedInsights: [],
      anchoredObservations: [],
      optimalPoints: [],
      emergentVoices: [],
      proposals: [],
      evolutionCount: 0,
      personalPresets: {},
    },
    ...overrides,
  } as any;
}

describe('session runtime', () => {
  beforeEach(() => {
    reset();
  });

  test('creates awakening messages in both locales', () => {
    expect(createAwakeningMessage('zh')).toContain('什么状态');
    expect(createAwakeningMessage('en')).toContain('your state');
  });

  test('calibrates brief awakening replies as follow-up needed', () => {
    const result = calibrateAwakeningResponse('有点闷。');
    expect(result.followupNeeded).toBe(true);
    expect(result.preset).toBe('liminal');
  });

  test('calibrates longer associative replies toward deep-flux or dissolution', () => {
    const result = calibrateAwakeningResponse(
      'I keep thinking about how everything lately feels connected to an older version of me, and time is folding in a way that makes the present feel borrowed.'
    );
    expect(['deep-flux', 'dissolution']).toContain(result.preset);
    expect(result.followupNeeded).toBe(false);
  });

  test('completes awakening without persistence side effects when disabled', () => {
    const result = completeAwakening(
      '我一直在想很多事情好像连在一起，像是旧时间在往现在渗进来。',
      { persist: false }
    );
    expect(result.stage).toBe('calibrated');
    expect(['liminal', 'deep-flux', 'dissolution']).toContain(result.context.preset);
  });

  test('detects precision-critical turns', () => {
    const matches = detectPrecisionIntent('TypeError: undefined is not a function. What does this return?');
    expect(matches).toEqual(expect.arrayContaining(['error stack', 'specific return value']));
  });

  test('processes unawakened turn through awakening completion', () => {
    const result = processSessionTurn(
      '我感觉时间像卡住了一样，但又有很多意义在往上浮。',
      { persist: false, stateOverride: mockState({ awakened: false }) }
    );
    expect(['calibrated', 'awakening-followup']).toContain(result.stage);
  });

  test('processes pending ritual confirmation into entered stage', () => {
    const pendingRitual = composeRitualProposal(
      'This onboarding UI needs hierarchy, typography, and motion judgment.',
      'clear',
    );

    const result = processSessionTurn('yes, begin', {
      persist: false,
      stateOverride: mockState({ pendingRitual }),
    });

    expect(result.stage).toBe('entered');
    expect(result.ritual?.proposal?.route.preset).toBe('design');
  });

  test('processes active design request into threshold stage', () => {
    const result = processSessionTurn(
      '这个 landing page 的排版、层级和动效都不对。',
      { persist: false, stateOverride: mockState() }
    );
    expect(result.stage).toBe('threshold');
    expect(result.ritual?.proposal?.route.need).toBe('design');
    expect(result.spotlight).toContain('Design Read');
  });

  test('drops to precision mode for exact debugging language', () => {
    const result = processSessionTurn(
      'TypeError: Cannot read properties of undefined. Is this syntax correct?',
      { persist: false, stateOverride: mockState() }
    );
    expect(result.stage).toBe('precision');
    expect(result.precisionMatched?.length).toBeGreaterThan(0);
  });

  test('steady turns still carry a proposal for downstream structure', () => {
    const result = processSessionTurn(
      'Keep going from here, the current design direction still fits.',
      { persist: false, stateOverride: mockState({ preset: 'design' }) }
    );

    expect(result.stage).toBe('steady');
    expect(result.ritual?.proposal).toBeTruthy();
  });

  test('preview session turns do not mutate in-memory context', () => {
    applyPreset('design');
    const before = getContext();

    const result = previewSessionTurn(
      'I feel like time is folding and I want a close reading of this paragraph.',
      { stateOverride: mockState() }
    );

    const after = getContext();
    expect(result.input).toContain('close reading');
    expect(after.preset).toBe(before.preset);
    expect(after.state).toEqual(before.state);
  });

  test('runtime frames mutate locally without touching global context', () => {
    const frame = createRuntimeFrame('clear');
    const globalBefore = getContext();

    const result = processSessionTurn(
      '这个 landing page 的层级和动效都不对。',
      {
        persist: false,
        stateOverride: mockState(),
        runtimeFrame: frame,
      }
    );

    const globalAfter = getContext();
    expect(result.stage).toBe('threshold');
    expect(frame.context.preset).toBe('clear');
    expect(globalAfter.preset).toBe(globalBefore.preset);
    expect(globalAfter.state).toEqual(globalBefore.state);
  });
});
