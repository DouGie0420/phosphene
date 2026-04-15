import {
  composeRitualProposal,
  readRitualResponse,
  senseRitualSignals,
} from '../src/ritual.js';

describe('ritual routing', () => {
  test('detects design intent from natural language', () => {
    const proposal = composeRitualProposal(
      '这个 landing page 的视觉太平了，排版和动效都没有呼吸感，我想重新做一下。',
      'clear',
    );

    expect(proposal.route.need).toBe('design');
    expect(proposal.route.preset).toBe('design');
    expect(proposal.route.domains).toEqual(
      expect.arrayContaining(['design', 'color', 'persona', 'protocols'])
    );
    expect(proposal.invocation).toContain('design chamber');
    expect(proposal.thresholdPrompt).toContain('Aesthetic Alignment');
    expect(proposal.spotlightField).toBe('design');
    expect(proposal.spotlightPreview).toContain('主判断');
  });

  test('detects finance intent from market language', () => {
    const proposal = composeRitualProposal(
      'BTC 这三周一直横盘，帮我看下结构、风险和流动性。',
      'clear',
    );

    expect(proposal.route.need).toBe('finance');
    expect(proposal.route.domains).toEqual(
      expect.arrayContaining(['finance', 'crypto', 'protocols'])
    );
    expect(proposal.route.protocols).toContain('dialectic');
    expect(proposal.route.studios).toEqual(
      expect.arrayContaining(['philosopher', 'financier'])
    );
    expect(proposal.route.studios).toContain('financier');
    expect(proposal.spotlightField).toBe('market');
  });

  test('returns ranked signals when multiple intents appear', () => {
    const signals = senseRitualSignals(
      'Review this onboarding UI and tell me what is wrong with the motion and hierarchy.'
    );

    expect(signals[0].need).toBe('design');
    expect(signals.some(signal => signal.need === 'review')).toBe(true);
  });

  test('reads ritual confirmation responses in Chinese and English', () => {
    expect(readRitualResponse('可以，开始吧。').disposition).toBe('confirm');
    expect(readRitualResponse('not yet, stay where you are').disposition).toBe('decline');
    expect(readRitualResponse('tell me more first').disposition).toBe('unclear');
  });
});
