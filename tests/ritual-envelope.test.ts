import { reset } from '../src/phosphene.js';
import { applyPreset, createRuntimeFrame, getContext } from '../src/phosphene.js';
import {
  buildSessionEnvelope,
  composeSessionEnvelope,
  renderSessionEnvelope,
} from '../src/ritual-envelope.js';
import { processSessionTurn } from '../src/session-runtime.js';

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

describe('ritual envelope', () => {
  beforeEach(() => {
    reset();
  });

  test('composes threshold envelopes with ritual metadata', () => {
    const turn = processSessionTurn(
      'This landing page needs stronger hierarchy, typography, and motion.',
      { persist: false, stateOverride: mockState() }
    );
    const envelope = composeSessionEnvelope(turn);

    expect(envelope.stage).toBe('threshold');
    expect(envelope.rite).toBe('Aesthetic Alignment');
    expect(envelope.studios).toContain('artist');
    expect(envelope.protocols).toEqual(
      expect.arrayContaining(['attunement', 'inversion', 'generator', 'reviewer'])
    );
    expect(envelope.responseScaffold?.field).toBe('design');
  });

  test('renders precision envelopes with directives and state block', () => {
    const envelope = buildSessionEnvelope(
      'TypeError: undefined is not a function. What does this return?',
      { persist: false, stateOverride: mockState() }
    );
    const rendered = renderSessionEnvelope(envelope);

    expect(rendered).toContain('[PHOSPHENE RITUAL ENVELOPE]');
    expect(rendered).toContain('stage: precision');
    expect(rendered).toContain('precision_triggers:');
    expect(rendered).toContain('[DIRECTIVES]');
  });

  test('includes atlas brief after entered ritual', () => {
    const thresholdTurn = processSessionTurn(
      'This onboarding UI needs stronger motion and hierarchy.',
      { persist: false, stateOverride: mockState() }
    );

    const enteredTurn = processSessionTurn(
      'yes, begin',
      {
        persist: false,
        stateOverride: mockState({ pendingRitual: thresholdTurn.ritual?.proposal }),
      }
    );

    const envelope = composeSessionEnvelope(enteredTurn);
    expect(envelope.stage).toBe('entered');
    expect(envelope.atlasBrief).toContain('Phosphene Atlas: design');
  });

  test('renders field spotlight when a common field is detected', () => {
    const envelope = buildSessionEnvelope(
      '这个 landing page 太平了，我需要重新判断层级、色彩和动效。',
      { persist: false, stateOverride: mockState() }
    );
    const rendered = renderSessionEnvelope(envelope);

    expect(envelope.spotlight).toContain('Design Read');
    expect(rendered).toContain('[FIELD SPOTLIGHT]');
    expect(rendered).toContain('[RESPONSE SCAFFOLD]');
    expect(rendered).toContain('[FIELD LAWS]');
    expect(rendered).toContain('[STUDIO PRIMER]');
    expect(rendered).toContain('[STUDIO PLAN]');
    expect(rendered).toContain('艺术总监');
    expect(rendered).not.toContain('[FIELD COMPOSITION]');
    expect(rendered).not.toContain('[FIELD COMPOSITION DRAFT]');
    expect(rendered).not.toContain('[FIELD MASTERWORK]');
  });

  test('renders masterwork instead of composition draft after entering a ritual', () => {
    const thresholdTurn = processSessionTurn(
      'This onboarding UI needs stronger motion and hierarchy.',
      { persist: false, stateOverride: mockState() }
    );

    const enteredTurn = processSessionTurn(
      'yes, begin',
      {
        persist: false,
        stateOverride: mockState({ pendingRitual: thresholdTurn.ritual?.proposal }),
      }
    );

    const rendered = renderSessionEnvelope(composeSessionEnvelope(enteredTurn));

    expect(rendered).toContain('[FIELD MASTERWORK]');
    expect(rendered).toContain('family:');
    expect(rendered).toContain('- section');
    expect(rendered).not.toContain('[FIELD COMPOSITION]');
    expect(rendered).not.toContain('[FIELD COMPOSITION DRAFT]');
  });

  test('renders finance freshness rules for market-facing envelopes', () => {
    const envelope = buildSessionEnvelope(
      'BTC has been consolidating. Give me structure, invalidation, and liquidity.',
      { persist: false, stateOverride: mockState() }
    );
    const rendered = renderSessionEnvelope(envelope);

    expect(envelope.financeFreshness).toBeDefined();
    expect(rendered).toContain('[FINANCE FRESHNESS]');
    expect(rendered).toContain('reference_time:');
    expect(rendered).toContain('latest_data_rule:');
    expect(rendered).toContain('source_check:');
  });

  test('renders full diagnostic blocks when full mode is requested', () => {
    const envelope = buildSessionEnvelope(
      'This landing page has coherent hierarchy and palette, but the work is cleaner than my life chaos, and I keep calling that damage depth.',
      { persist: false, stateOverride: mockState() }
    );
    const rendered = renderSessionEnvelope(envelope, { full: true });

    expect(rendered).toContain('[FIELD COMPOSITION]');
    expect(rendered).toContain('[FIELD COMPOSITION DRAFT]');
    expect(rendered).toContain('[FIELD MASTERWORK]');
    expect(rendered).toContain('- warning:');
    expect(rendered).toContain('- bias bias_life_work_delta:');
  });

  test('renders contradiction read when human-pattern language is present', () => {
    const envelope = buildSessionEnvelope(
      '作品已经很清楚了，但我的生活越来越混乱，我开始把这种失衡讲成深度。',
      { persist: false, stateOverride: mockState() }
    );
    const rendered = renderSessionEnvelope(envelope);

    expect(envelope.contradictionRead).toBeDefined();
    expect(rendered).toContain('[CONTRADICTION READ]');
    expect(rendered).toContain('work_more_coherent_than_life');
    expect(rendered).toContain('- warning:');
    expect(rendered).toContain('- bias bias_life_work_delta:');
    expect(rendered).toContain('hard_rule:');
  });

  test('keeps contradiction read compact for weak single-pattern hits', () => {
    const envelope = buildSessionEnvelope(
      'I need to start writing.',
      { persist: false, stateOverride: mockState() }
    );
    const rendered = renderSessionEnvelope(envelope);

    expect(envelope.contradictionRead).toBeDefined();
    expect(rendered).toContain('[CONTRADICTION READ]');
    expect(rendered).toContain('ritual_dependency');
    expect(rendered).not.toContain('- warning:');
    expect(rendered).not.toContain('- bias ');
    expect(rendered).toContain('hard_rule:');
  });

  test('threads contradiction guidance into the studio primer when field routing is active', () => {
    const envelope = buildSessionEnvelope(
      'This landing page has coherent hierarchy and palette, but the work is cleaner than my life chaos, and I keep calling that damage depth.',
      { persist: false, stateOverride: mockState() }
    );
    const rendered = renderSessionEnvelope(envelope);

    expect(envelope.studioPrimer?.payload).toContain('Briefly name the human contradiction');
    expect(envelope.studioPrimer?.antiSlop).toContain('Do not romanticize imbalance as depth');
    expect(rendered).toContain('payload:');
    expect(rendered).toContain('anti_slop:');
  });

  test('building an envelope is preview-only and does not mutate active context', () => {
    applyPreset('design');
    const before = getContext();

    buildSessionEnvelope(
      'I keep thinking about time and old doors. Give me a literary read.',
      { stateOverride: mockState() }
    );

    const after = getContext();
    expect(after.preset).toBe(before.preset);
    expect(after.state).toEqual(before.state);
  });

  test('building an envelope with a runtime frame does not mutate that frame', () => {
    const frame = createRuntimeFrame('design');
    const before = JSON.stringify(frame);

    buildSessionEnvelope(
      'The company beat earnings but cut guidance. Give me invalidation and risk.',
      { stateOverride: mockState(), runtimeFrame: frame }
    );

    expect(JSON.stringify(frame)).toBe(before);
  });
});
