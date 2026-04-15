import { buildFieldFamily } from '../src/field-family.js';
import { composeRitualProposal } from '../src/ritual.js';

describe('field family', () => {
  test('selects quiet luxury for premium design language', () => {
    const input = 'I want a premium luxury wellness interface with elegant motion and hierarchy.';
    const proposal = composeRitualProposal(input, 'clear');
    const family = buildFieldFamily(input, proposal, 'en');

    expect(family?.field).toBe('design');
    expect(family?.family).toContain('Luxury');
  });

  test('selects risk officer for invalidation-led market language', () => {
    const input = 'BTC has been chopping. Give me risk, invalidation, and drawdown scenarios.';
    const proposal = composeRitualProposal(input, 'clear');
    const family = buildFieldFamily(input, proposal, 'en');

    expect(family?.field).toBe('market');
    expect(family?.family).toContain('Risk');
  });

  test('allows manual family override', () => {
    const input = 'I want a premium luxury wellness interface with elegant motion and hierarchy.';
    const proposal = composeRitualProposal(input, 'clear');
    const family = buildFieldFamily(input, proposal, 'en', { override: 'Frontline Art Director' });

    expect(family?.field).toBe('design');
    expect(family?.family).toBe('Frontline Art Director');
  });

  test('supports extreme market family selection', () => {
    const input = 'BTC war room mode. Give me the kill shot thesis, invalidation, and risk.';
    const proposal = composeRitualProposal(input, 'clear');
    const family = buildFieldFamily(input, proposal, 'en');

    expect(family?.field).toBe('market');
    expect(family?.family).toBe('War-Room Commander');
  });
});
