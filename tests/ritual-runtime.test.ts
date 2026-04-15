import { getContext, reset } from '../src/phosphene.js';
import { composeRitualProposal } from '../src/ritual.js';
import {
  buildRitualAtlasBrief,
  initiateRitual,
  renderRitualCommencement,
  renderRitualThreshold,
  resolvePendingRitual,
} from '../src/ritual-runtime.js';

describe('ritual runtime', () => {
  beforeEach(() => {
    reset();
  });

  test('initiates a threshold without mutating active preset', () => {
    const result = initiateRitual(
      '这个界面太平了，我需要重新判断层级、排版和动效。',
      { locale: 'zh', persist: false }
    );

    expect(result.stage).toBe('threshold');
    expect(result.proposal?.route.need).toBe('design');
    expect(result.message).toContain('阈值');
    expect(result.message).toContain('我已经先读到一条判断线');
    expect(getContext().preset).toBe('clear');
  });

  test('confirms pending ritual and enters target preset with atlas brief', () => {
    const proposal = composeRitualProposal(
      'Review this onboarding UI and fix the hierarchy and motion.',
      'clear',
    );

    const result = resolvePendingRitual('可以，开始吧。', {
      locale: 'zh',
      persist: false,
      pending: proposal,
    });

    expect(result.stage).toBe('entered');
    expect(result.context.preset).toBe('design');
    expect(result.message).toContain('正式进入');
    expect(result.message).toContain('判断线');
    expect(result.atlasBrief).toContain('Phosphene Atlas: design');
  });

  test('declines pending ritual without forcing a preset switch', () => {
    const proposal = composeRitualProposal(
      'I need ideas for a new product direction.',
      'clear',
    );

    const result = resolvePendingRitual('not yet, stay here', {
      persist: false,
      pending: proposal,
    });

    expect(result.stage).toBe('declined');
    expect(result.context.preset).toBe('clear');
  });

  test('builds domain briefs from routed atlas domains', () => {
    const proposal = composeRitualProposal(
      'I want better taste for this landing page typography and visual hierarchy.',
      'clear',
    );

    const brief = buildRitualAtlasBrief(proposal, { maxDomains: 2 });
    expect(brief).toContain('Phosphene Atlas: design');
    expect(brief).toContain('Phosphene Atlas: color');
  });

  test('renders english and chinese ritual language', () => {
    const proposal = composeRitualProposal(
      'This architecture feels brittle and I want a structural read before touching it.',
      'clear',
    );

    expect(renderRitualThreshold(proposal, 'en')).toContain('threshold');
    expect(renderRitualCommencement(proposal, 'zh')).toContain('阈值已经确认');
  });
});
