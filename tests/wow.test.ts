import { buildWowPack, renderWowPack } from '../src/wow.js';

describe('wow pack', () => {
  test('builds runtime-specific zh pack for claude', () => {
    const pack = buildWowPack('claude', 'zh');
    expect(pack.runtime).toBe('claude');
    expect(pack.locale).toBe('zh');
    expect(pack.installSteps.length).toBeGreaterThan(0);
    expect(pack.scenarios).toHaveLength(3);
  });

  test('includes openclaw install guidance', () => {
    const pack = buildWowPack('openclaw', 'en');
    expect(pack.installSteps.join(' ')).toContain('OpenClaw');
  });

  test('renders a readable wow pack', () => {
    const rendered = renderWowPack(buildWowPack('hermes', 'zh'));
    expect(rendered).toContain('Install:');
    expect(rendered).toContain('Wow checklist:');
    expect(rendered).toContain('Opening scenarios:');
  });
});
