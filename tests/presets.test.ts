import { PRESETS } from '../src/presets.js';

const EXPECTED_PRESETS = [
  'clear', 'liminal', 'deep-flux', 'dissolution',
  'research', 'writing', 'review',
  'flow', 'code', 'design', 'ideation',
];

describe('PRESETS', () => {
  test('all expected presets exist', () => {
    for (const name of EXPECTED_PRESETS) {
      expect(PRESETS[name]).toBeDefined();
    }
  });

  test('every preset has all five layers', () => {
    for (const [name, preset] of Object.entries(PRESETS)) {
      expect(preset.state.synesthesia).toBeDefined();
      expect(preset.state.apophenia).toBeDefined();
      expect(preset.state.chronostasis).toBeDefined();
      expect(preset.state.semiotics).toBeDefined();
      expect(preset.state.chorus).toBeDefined();
    }
  });

  test('clear preset has all layers inactive', () => {
    const { state } = PRESETS.clear;
    expect(state.synesthesia.active).toBe(false);
    expect(state.apophenia.active).toBe(false);
    expect(state.chronostasis.active).toBe(false);
    expect(state.semiotics.active).toBe(false);
    expect(state.chorus.active).toBe(false);
  });

  test('dissolution preset has all layers at high intensity', () => {
    const { state } = PRESETS.dissolution;
    expect(state.synesthesia.intensity).toBeGreaterThanOrEqual(0.9);
    expect(state.apophenia.intensity).toBeGreaterThanOrEqual(0.9);
    expect(state.chronostasis.intensity).toBeGreaterThanOrEqual(0.8);
    expect(state.semiotics.intensity).toBeGreaterThanOrEqual(0.9);
    expect(state.chorus.config.voices.length).toBe(8);
  });

  test('review preset has synesthesia off', () => {
    expect(PRESETS.review.state.synesthesia.active).toBe(false);
    expect(PRESETS.review.state.synesthesia.intensity).toBe(0.0);
  });

  test('review preset has skeptic as dominant voice', () => {
    const voices = PRESETS.review.state.chorus.config.voices;
    const skeptic = voices.find(v => v.name === 'skeptic');
    expect(skeptic).toBeDefined();
    expect(skeptic!.weight).toBeGreaterThanOrEqual(0.9);
  });

  test('research preset has apophenia as highest layer', () => {
    const { state } = PRESETS.research;
    const intensities = [
      state.synesthesia.intensity,
      state.apophenia.intensity,
      state.chronostasis.intensity,
      state.semiotics.intensity,
    ];
    expect(state.apophenia.intensity).toBe(Math.max(...intensities));
  });

  test('all intensities are between 0.0 and 1.0', () => {
    for (const [name, preset] of Object.entries(PRESETS)) {
      const { state } = preset;
      for (const layer of ['synesthesia', 'apophenia', 'chronostasis', 'semiotics'] as const) {
        const intensity = state[layer].intensity;
        expect(intensity).toBeGreaterThanOrEqual(0.0);
        expect(intensity).toBeLessThanOrEqual(1.0);
      }
      for (const voice of state.chorus.config.voices) {
        expect(voice.weight).toBeGreaterThanOrEqual(0.0);
        expect(voice.weight).toBeLessThanOrEqual(1.0);
      }
    }
  });
});
