import { parseDreamMarkdownForViz } from '../src/dream-viz-parser.js';
import { generateDream, renderDream, attachPollinationsUrls } from '../src/dreams.js';
import { DEFAULT_EVOLUTION } from '../src/evolution.js';
import { PRESETS } from '../src/presets.js';
import type { PhospheneContext } from '../src/types.js';

function makeContext(preset = 'deep-flux'): PhospheneContext {
  const state = PRESETS[preset as keyof typeof PRESETS]?.state ?? PRESETS['deep-flux'].state;
  return {
    state,
    preset: preset as any,
    sessionId: 'viz-test-session',
    activatedAt: new Date().toISOString(),
  };
}

describe('dream viz parser', () => {
  test('parses current dream markdown format used by renderDream', () => {
    const dream = generateDream(DEFAULT_EVOLUTION, makeContext());
    const parsed = parseDreamMarkdownForViz(renderDream(dream));

    expect(parsed).not.toBeNull();
    expect(parsed!.id).toBe(dream.id);
    expect(parsed!.stage).toBe(dream.stage);
    expect(parsed!.preset).toBe(dream.presetAtSleep);
    expect(parsed!.fragments.length).toBe(dream.fragments.length);
    expect(parsed!.fragments[0]!.logic).toBe(dream.fragments[0]!.logic);
  });

  test('keeps remote image URLs from image_paths for gallery rendering', () => {
    const dream = attachPollinationsUrls(generateDream(DEFAULT_EVOLUTION, makeContext()));
    const parsed = parseDreamMarkdownForViz(renderDream(dream));

    expect(parsed).not.toBeNull();
    expect(Object.values(parsed!.imagePaths)[0]).toContain('https://image.pollinations.ai/prompt/');
    expect(parsed!.fragments[0]!.imagePath).toContain('https://image.pollinations.ai/prompt/');
  });
});
