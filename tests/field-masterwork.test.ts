import { buildFieldMasterwork } from '../src/field-masterwork.js';
import { composeRitualProposal } from '../src/ritual.js';

describe('field masterwork', () => {
  test('builds a design masterwork', () => {
    const input = '这个 landing page 太平了，层级、色彩和动效都不成立。';
    const proposal = composeRitualProposal(input, 'clear');
    const masterwork = buildFieldMasterwork(input, proposal, 'zh', 'entered');

    expect(masterwork?.field).toBe('design');
    expect(masterwork?.format).toBe('art-direction-spec');
    expect(masterwork?.family.length).toBeGreaterThan(0);
    expect(masterwork?.sections.length).toBeGreaterThan(0);
    expect(masterwork?.rendered).toContain('Art Direction Spec');
    expect(masterwork?.rendered).toContain('判词');
  });

  test('builds a market masterwork', () => {
    const input = 'The company beat earnings but cut guidance. Give me invalidation and risk.';
    const proposal = composeRitualProposal(input, 'clear');
    const masterwork = buildFieldMasterwork(input, proposal, 'en', 'entered');

    expect(masterwork?.field).toBe('market');
    expect(masterwork?.format).toBe('market-playbook');
    expect(masterwork?.rationale.length).toBeGreaterThan(0);
    expect(masterwork?.sections.map(section => section.label)).toContain('Narrative vs flow');
    expect(masterwork?.rendered).toContain('Market Playbook');
    expect(masterwork?.rendered).toContain('Proof of power');
  });

  test('changes masterwork family when overridden', () => {
    const input = 'I want a premium luxury wellness interface with elegant motion and hierarchy.';
    const proposal = composeRitualProposal(input, 'clear');
    const masterwork = buildFieldMasterwork(input, proposal, 'en', 'entered', {
      familyOverride: 'Frontline Art Director',
    });

    expect(masterwork?.family).toBe('Frontline Art Director');
    expect(masterwork?.rendered).toContain('Frontline Directive');
  });

  test('supports forced field routing', () => {
    const input = 'This could be read as either copy or interface, but force it through literature.';
    const proposal = composeRitualProposal(input, 'clear');
    const masterwork = buildFieldMasterwork(input, proposal, 'en', 'entered', {
      forcedField: 'literature',
      familyOverride: 'Verdict Reader',
    });

    expect(masterwork?.field).toBe('literature');
    expect(masterwork?.family).toBe('Verdict Reader');
    expect(masterwork?.rendered).toContain('Verdict Directive');
  });

  test('keeps contradiction pressure in anti-slop without repeating a contradiction section', () => {
    const input = 'This landing page has coherent hierarchy and palette, but the work is cleaner than my life chaos, and I keep calling that damage depth.';
    const proposal = composeRitualProposal(input, 'clear');
    const masterwork = buildFieldMasterwork(input, proposal, 'en', 'entered', {
      forcedField: 'design',
    });

    expect(masterwork?.rendered).toContain('Do not romanticize imbalance as depth');
    expect(masterwork?.sections.map(section => section.label)).not.toContain('Human contradiction');
  });
});
