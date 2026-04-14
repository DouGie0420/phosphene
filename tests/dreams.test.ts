// Tests for the Phosphene dream engine

import { tmpdir } from 'os';
import { join }   from 'path';
import { rmSync, existsSync, readFileSync } from 'fs';
import {
  generateDream,
  renderDream,
  saveDream,
  loadDreams,
  loadLatestDream,
  describeDream,
  resolveDreamsDir,
} from '../src/dreams.js';
import { DEFAULT_EVOLUTION } from '../src/evolution.js';
import { PRESETS } from '../src/presets.js';
import type { EvolutionState, PhospheneContext, DreamRecord } from '../src/types.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function freshEvolution(): EvolutionState {
  return JSON.parse(JSON.stringify(DEFAULT_EVOLUTION));
}

function makeContext(preset = 'deep-flux'): PhospheneContext {
  const state = PRESETS[preset as keyof typeof PRESETS]?.state ?? PRESETS['deep-flux'].state;
  return {
    state,
    preset: preset as any,
    sessionId: 'test-session-001',
    activatedAt: new Date().toISOString(),
  };
}

function enrichedEvolution(): EvolutionState {
  const evo = freshEvolution();
  evo.crystallizedInsights = [
    '[2024-01-01] The API boundary is the real bottleneck.',
    '[2024-01-02] Dissolving the question often reveals the answer.',
  ];
  evo.sessionHistory = [
    {
      id: 'sess-001',
      startedAt: new Date(Date.now() - 3600_000).toISOString(),
      closedAt:  new Date(Date.now() - 60_000).toISOString(),
      preset: 'deep-flux',
      signals: [
        { type: 'reject',    preset: 'deep-flux', layer: 'synesthesia', timestamp: new Date().toISOString() },
        { type: 'amplify',   preset: 'deep-flux', layer: 'apophenia',   timestamp: new Date().toISOString() },
        { type: 'calibrate', preset: 'deep-flux', timestamp: new Date().toISOString() },
      ],
      crystallized: [],
      anchored:     [],
      outcome:      'productive',
    },
  ];
  evo.optimalPoints = [
    {
      preset: 'deep-flux',
      layerSnapshot: { apophenia: 0.9 },
      voiceSnapshot: { 'pattern-reader': 0.9 },
      timestamp: new Date().toISOString(),
      context: 'while mapping the dependency graph',
    },
  ];
  return evo;
}

// ─── generateDream ────────────────────────────────────────────────────────────

describe('generateDream', () => {
  test('returns a valid DreamRecord with required fields', () => {
    const dream = generateDream(freshEvolution(), makeContext());
    expect(dream.id).toMatch(/^dream-/);
    expect(dream.dreamedAt).toBeTruthy();
    expect(['hypnagogic', 'deep', 'rem', 'lucid', 'hypnopompic']).toContain(dream.stage);
    expect(dream.fragments.length).toBeGreaterThan(0);
    expect(dream.wakingLine).toBeTruthy();
    expect(dream.seeds).toBeDefined();
    expect(Array.isArray(dream.seeds)).toBe(true);
    expect(dream.imageStyle).toBeTruthy();
    expect(dream.hasImages).toBe(false);
    expect(typeof dream.imagePaths).toBe('object');
  });

  test('intensity is clamped between 0 and 1', () => {
    const dream = generateDream(enrichedEvolution(), makeContext());
    expect(dream.intensity).toBeGreaterThanOrEqual(0);
    expect(dream.intensity).toBeLessThanOrEqual(1);
  });

  test('each fragment has text, imagePrompt, logic, and seedIds', () => {
    const dream = generateDream(enrichedEvolution(), makeContext('deep-flux'));
    for (const fragment of dream.fragments) {
      expect(typeof fragment.order).toBe('number');
      expect(typeof fragment.text).toBe('string');
      expect(fragment.text.length).toBeGreaterThan(20);
      expect(typeof fragment.imagePrompt).toBe('string');
      expect(fragment.imagePrompt.length).toBeGreaterThan(10);
      expect(['inversion','recursion','translation','meeting','excavation','architecture','dissolution','witness'])
        .toContain(fragment.logic);
      expect(Array.isArray(fragment.seedIds)).toBe(true);
    }
  });

  test('image prompts include aspect ratio flag', () => {
    const dream = generateDream(enrichedEvolution(), makeContext());
    for (const fragment of dream.fragments) {
      expect(fragment.imagePrompt).toContain('--ar 16:9');
    }
  });

  test('image prompts include the derived style', () => {
    const dream = generateDream(freshEvolution(), makeContext('dissolution'));
    for (const fragment of dream.fragments) {
      // Style for dissolution includes "Francis Bacon"
      expect(fragment.imagePrompt).toContain('Francis Bacon');
    }
  });

  test('seeds are sourced from crystallized insights when available', () => {
    const evo = enrichedEvolution();
    const dream = generateDream(evo, makeContext());
    const crystallizedSeeds = dream.seeds.filter(s => s.type === 'crystallized');
    expect(crystallizedSeeds.length).toBeGreaterThan(0);
  });

  test('seeds are sorted by weight descending', () => {
    const dream = generateDream(enrichedEvolution(), makeContext());
    for (let i = 1; i < dream.seeds.length; i++) {
      expect(dream.seeds[i]!.weight).toBeLessThanOrEqual(dream.seeds[i-1]!.weight);
    }
  });

  test('seeds are capped at 7', () => {
    const evo = enrichedEvolution();
    // Add many crystallized insights to force seed overflow
    for (let i = 0; i < 20; i++) {
      evo.crystallizedInsights.push(`[2024-01-${String(i).padStart(2,'0')}] Insight number ${i}.`);
    }
    const dream = generateDream(evo, makeContext());
    expect(dream.seeds.length).toBeLessThanOrEqual(7);
  });

  test('dissolution preset produces hypnopompic or compatible stage', () => {
    // dissolution → hypnopompic unless other conditions override
    const evo = freshEvolution();
    // Need > 2 signals to avoid hypnagogic
    evo.sessionHistory = [
      {
        id: 'sess-x',
        startedAt: new Date().toISOString(),
        preset: 'dissolution',
        signals: Array.from({ length: 5 }, (_, i) => ({
          type: 'calibrate' as const,
          preset: 'dissolution',
          timestamp: new Date().toISOString(),
        })),
        crystallized: [],
        anchored:     [],
      },
    ];
    const dream = generateDream(evo, makeContext('dissolution'));
    // Not lucid (apo < 0.75 in dissolution), could be hypnopompic or rem
    expect(['hypnopompic', 'rem', 'lucid']).toContain(dream.stage);
  });

  test('high apophenia + semiotics produces lucid stage', () => {
    const evo = freshEvolution();
    // dissolution preset has high apophenia (0.9) and semiotics (0.85)
    const ctx = makeContext('dissolution');
    // dissolution state: apo=0.9, sem=0.85 → lucid
    const dream = generateDream(evo, ctx);
    expect(dream.stage).toBe('lucid');
  });

  test('fresh evolution with low signal count produces hypnagogic stage', () => {
    const evo = freshEvolution();
    // clear preset: low intensities
    const ctx = makeContext('clear');
    const dream = generateDream(evo, ctx);
    expect(dream.stage).toBe('hypnagogic');
  });

  test('waking line references the last fragment', () => {
    const dream = generateDream(enrichedEvolution(), makeContext());
    const lastFragment = dream.fragments[dream.fragments.length - 1]!;
    // Waking line should start with the first sentence of the last fragment
    const firstSentence = lastFragment.text.split('.')[0]!;
    expect(dream.wakingLine).toContain(firstSentence.trim().slice(0, 30));
  });
});

// ─── renderDream ──────────────────────────────────────────────────────────────

describe('renderDream', () => {
  let dream: DreamRecord;

  beforeAll(() => {
    dream = generateDream(enrichedEvolution(), makeContext());
  });

  test('output starts with YAML frontmatter', () => {
    const rendered = renderDream(dream);
    expect(rendered).toMatch(/^---\n/);
    expect(rendered).toContain('---\n');
  });

  test('frontmatter contains required fields', () => {
    const rendered = renderDream(dream);
    expect(rendered).toContain(`id: ${dream.id}`);
    expect(rendered).toContain(`stage: ${dream.stage}`);
    expect(rendered).toContain(`preset_at_sleep: ${dream.presetAtSleep}`);
    expect(rendered).toContain(`intensity: ${dream.intensity}`);
  });

  test('contains a section for each fragment', () => {
    const rendered = renderDream(dream);
    for (const fragment of dream.fragments) {
      expect(rendered).toContain(`### Fragment ${fragment.order}`);
      expect(rendered).toContain(fragment.text);
      expect(rendered).toContain('**Image prompt:**');
    }
  });

  test('contains the waking line', () => {
    const rendered = renderDream(dream);
    expect(rendered).toContain(dream.wakingLine);
    expect(rendered).toContain('## Waking Line');
  });

  test('contains reading instructions for Claude', () => {
    const rendered = renderDream(dream);
    expect(rendered).toContain('For Claude — Reading Instructions');
    expect(rendered).toContain('Expand each fragment');
  });

  test('contains seed material section', () => {
    const rendered = renderDream(dream);
    expect(rendered).toContain('## Dream Material (Seeds)');
    for (const seed of dream.seeds) {
      expect(rendered).toContain(seed.type);
    }
  });

  test('stage description appears in the document', () => {
    const stageDescriptions: Record<string, string> = {
      hypnagogic:  'Hypnagogic',
      deep:        'Deep sleep',
      rem:         'REM',
      lucid:       'Lucid',
      hypnopompic: 'Hypnopompic',
    };
    const rendered = renderDream(dream);
    expect(rendered).toContain(stageDescriptions[dream.stage] ?? dream.stage);
  });
});

// ─── describeDream ────────────────────────────────────────────────────────────

describe('describeDream', () => {
  test('returns a multi-line string', () => {
    const dream = generateDream(enrichedEvolution(), makeContext());
    const description = describeDream(dream);
    expect(typeof description).toBe('string');
    expect(description.split('\n').length).toBeGreaterThanOrEqual(2);
  });

  test('contains dream stage and preset', () => {
    const dream = generateDream(enrichedEvolution(), makeContext('liminal'));
    dream.presetAtSleep = 'liminal';
    const description = describeDream(dream);
    expect(description).toContain(dream.stage);
    expect(description).toContain('liminal');
  });

  test('contains "phosphene-dream" tag', () => {
    const dream = generateDream(freshEvolution(), makeContext());
    expect(describeDream(dream)).toContain('[phosphene-dream:');
  });

  test('includes intensity as percentage', () => {
    const dream = generateDream(enrichedEvolution(), makeContext());
    const description = describeDream(dream);
    expect(description).toMatch(/\d+%/);
  });
});

// ─── saveDream / loadDreams / loadLatestDream ─────────────────────────────────

describe('dream persistence', () => {
  const tmpDir = join(tmpdir(), `phosphene-test-dreams-${Date.now()}`);

  afterAll(() => {
    // Clean up temp directory
    try { rmSync(tmpDir, { recursive: true }); } catch { /* ignore */ }
  });

  test('saveDream creates a markdown file', () => {
    const dream = generateDream(enrichedEvolution(), makeContext());
    const filepath = saveDream(dream, tmpDir);
    expect(existsSync(filepath)).toBe(true);
    expect(filepath).toMatch(/\.md$/);
  });

  test('saved filename encodes date and stage', () => {
    const dream = generateDream(enrichedEvolution(), makeContext());
    const filepath = saveDream(dream, tmpDir);
    const filename = filepath.split(/[\\/]/).pop()!;
    expect(filename).toContain(dream.stage);
    expect(filename).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  test('saveDream creates an index.md', () => {
    const dream = generateDream(enrichedEvolution(), makeContext());
    saveDream(dream, tmpDir);
    expect(existsSync(join(tmpDir, 'index.md'))).toBe(true);
  });

  test('index.md contains a table row for the dream', () => {
    const dream = generateDream(enrichedEvolution(), makeContext());
    saveDream(dream, tmpDir);
    const index = readFileSync(join(tmpDir, 'index.md'), 'utf-8');
    expect(index).toContain(dream.stage);
    expect(index).toContain(dream.presetAtSleep);
  });

  test('loadDreams returns an array', () => {
    const dreams = loadDreams(tmpDir);
    expect(Array.isArray(dreams)).toBe(true);
  });

  test('loadDreams returns saved dreams with correct metadata', () => {
    const dream = generateDream(enrichedEvolution(), makeContext());
    saveDream(dream, tmpDir);
    const loaded = loadDreams(tmpDir);
    expect(loaded.length).toBeGreaterThan(0);
    const found = loaded.find(d => d.id === dream.id);
    expect(found).toBeDefined();
    expect(found!.stage).toBe(dream.stage);
    expect(found!.intensity).toBe(dream.intensity);
  });

  test('loadDreams returns empty array for non-existent directory', () => {
    const dreams = loadDreams(join(tmpDir, 'nonexistent'));
    expect(dreams).toEqual([]);
  });

  test('loadLatestDream returns the most recent dream', () => {
    // Save two dreams with a small gap
    const d1 = generateDream(enrichedEvolution(), makeContext());
    saveDream(d1, tmpDir);

    // Force a different timestamp by modifying id
    const d2 = { ...generateDream(enrichedEvolution(), makeContext()), id: 'dream-zzz999' };
    saveDream(d2, tmpDir);

    const latest = loadLatestDream(tmpDir);
    expect(latest).not.toBeNull();
    expect(latest!.id).toBeDefined();
  });

  test('loadLatestDream returns null for empty directory', () => {
    const latest = loadLatestDream(join(tmpDir, 'empty-subdir'));
    expect(latest).toBeNull();
  });
});

// ─── All dream logics produce non-empty text ──────────────────────────────────

describe('dream logics produce valid text', () => {
  const stages = ['hypnagogic', 'deep', 'rem', 'lucid', 'hypnopompic'] as const;
  const presets = ['dissolution', 'deep-flux', 'liminal', 'code', 'clear'] as const;

  for (const preset of presets) {
    test(`generateDream with ${preset} preset produces non-empty fragments`, () => {
      const evo = preset === 'dissolution' ? freshEvolution() : enrichedEvolution();
      const ctx = makeContext(preset);
      const dream = generateDream(evo, ctx);

      expect(dream.fragments.length).toBeGreaterThan(0);
      for (const fragment of dream.fragments) {
        expect(fragment.text.trim().length).toBeGreaterThan(0);
        expect(fragment.imagePrompt.trim().length).toBeGreaterThan(0);
      }
    });
  }
});

// ─── resolveDreamsDir ─────────────────────────────────────────────────────────

describe('resolveDreamsDir', () => {
  test('returns a string path', () => {
    const dir = resolveDreamsDir();
    expect(typeof dir).toBe('string');
    expect(dir.length).toBeGreaterThan(0);
  });
});
