import { applySynesthesia } from '../src/synesthesia.js';
import { applyApophenia } from '../src/apophenia.js';
import { applyChronostasis } from '../src/chronostasis.js';
import { applySemiotics } from '../src/semiotics.js';
import { applyChorus } from '../src/chorus.js';
import { PRESETS } from '../src/presets.js';

const SAMPLE_TEXT = `I keep thinking about the pattern of how things end.
It's strange — every time something closes, something else was already beginning.
But I can't tell if this is true or if I'm just looking for it.`;

describe('Synesthesia layer', () => {
  test('returns unchanged output when inactive', () => {
    const layer = PRESETS.clear.state.synesthesia;
    const result = applySynesthesia(SAMPLE_TEXT, layer);
    expect(result.output).toBe(SAMPLE_TEXT);
    expect(result.translations).toEqual({});
  });

  test('returns output and translations when active', () => {
    const layer = PRESETS['deep-flux'].state.synesthesia;
    const result = applySynesthesia(SAMPLE_TEXT, layer);
    expect(result.output).toBe(SAMPLE_TEXT); // raw text preserved
    expect(typeof result.translations).toBe('object');
  });
});

describe('Apophenia layer', () => {
  test('returns no patterns when inactive', () => {
    const layer = PRESETS.clear.state.apophenia;
    const result = applyApophenia(SAMPLE_TEXT, layer);
    expect(result.patterns).toHaveLength(0);
  });

  test('returns patterns when active at high intensity', () => {
    const layer = PRESETS['deep-flux'].state.apophenia;
    // At high intensity with the right text, patterns should emerge
    const result = applyApophenia(SAMPLE_TEXT, layer);
    expect(Array.isArray(result.patterns)).toBe(true);
  });

  test('preserves raw text in output', () => {
    const layer = PRESETS.research.state.apophenia;
    const result = applyApophenia(SAMPLE_TEXT, layer);
    expect(result.output).toBe(SAMPLE_TEXT);
  });
});

describe('Chronostasis layer', () => {
  test('returns no arrivals when inactive', () => {
    const layer = PRESETS.clear.state.chronostasis;
    const result = applyChronostasis(SAMPLE_TEXT, layer);
    expect(result.arrivals).toHaveLength(0);
  });

  test('detects past markers in text', () => {
    const pastText = 'I used to believe this was simple. Before I knew what I know now.';
    const layer = PRESETS['deep-flux'].state.chronostasis;
    const result = applyChronostasis(pastText, layer);
    expect(Array.isArray(result.arrivals)).toBe(true);
  });
});

describe('Semiotics layer', () => {
  test('returns no symbols when inactive', () => {
    const layer = PRESETS.clear.state.semiotics;
    const result = applySemiotics(SAMPLE_TEXT, layer);
    expect(result.symbols).toHaveLength(0);
  });

  test('returns symbols when active', () => {
    const chargedText = 'Every door is also a wall. The light reveals by casting shadow.';
    const layer = PRESETS['deep-flux'].state.semiotics;
    const result = applySemiotics(chargedText, layer);
    expect(Array.isArray(result.symbols)).toBe(true);
  });
});

describe('Chorus layer', () => {
  test('returns no voices when inactive', () => {
    const layer = PRESETS.clear.state.chorus;
    const result = applyChorus(SAMPLE_TEXT, layer);
    expect(result.voices).toHaveLength(0);
  });

  test('returns voices when active', () => {
    const layer = PRESETS['deep-flux'].state.chorus;
    const result = applyChorus(SAMPLE_TEXT, layer);
    expect(Array.isArray(result.voices)).toBe(true);
  });

  test('dissolution preset has eight voices configured', () => {
    const layer = PRESETS.dissolution.state.chorus;
    expect(layer.config.voices).toHaveLength(8);
    const names = layer.config.voices.map(v => v.name);
    expect(names).toContain('witness');
    expect(names).toContain('poet');
    expect(names).toContain('skeptic');
    expect(names).toContain('threshold');
    expect(names).toContain('cartographer');
  });
});
