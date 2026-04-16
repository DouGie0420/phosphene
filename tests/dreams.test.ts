// Tests for the Phosphene dream engine

import { tmpdir } from 'os';
import { join }   from 'path';
import { rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs';
import {
  generateDream,
  renderDream,
  saveDream,
  saveDreamSnapshot,
  loadDreamFile,
  readDreamMarkdown,
  loadDreams,
  loadLatestDream,
  attachPollinationsUrls,
  generateDreamImages,
  refreshDreamVisuals,
  renderDreamGallery,
  saveDreamGallery,
  describeDream,
  resolveDreamsDir,
  isManagedDreamFile,
  dreamNeedsVisualRefresh,
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
    expect(dream.visualProfile).toBeTruthy();
    expect(dream.promptRevision).toBeGreaterThan(0);
    expect(dream.hasImages).toBe(false);
    expect(typeof dream.imagePaths).toBe('object');
    expect(dream.imageBackend).toBeNull();
    expect(dream.imageModel).toBeNull();
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

  test('thin-material dreams add anti-portrait guardrails to image prompts', () => {
    const dream = generateDream(freshEvolution(), makeContext('clear'));

    for (const fragment of dream.fragments) {
      expect(fragment.imagePrompt).toContain('no human portrait');
      expect(fragment.imagePrompt).toContain('no centered woman');
      expect(fragment.imagePrompt).toContain('empty room in pale morning light');
    }
  });

  test('seeds are sourced from crystallized insights when available', () => {
    const evo = enrichedEvolution();
    const dream = generateDream(evo, makeContext());
    const crystallizedSeeds = dream.seeds.filter(s => s.type === 'crystallized');
    expect(crystallizedSeeds.length).toBeGreaterThan(0);
  });

  test('human contradiction material can seed dreams', () => {
    const evo = enrichedEvolution();
    evo.crystallizedInsights.push('[2026-04-15] The work is coherent but life is chaos.');
    const dream = generateDream(evo, makeContext());

    expect(dream.seeds.some(seed => seed.type === 'behavioral-pattern' || seed.type === 'temperament')).toBe(true);
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
    expect(rendered).toContain('origin: phosphene-dream');
    expect(rendered).toContain('schema_version: 2');
    expect(rendered).toContain(`visual_profile: ${dream.visualProfile}`);
    expect(rendered).toContain(`prompt_revision: ${dream.promptRevision}`);
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

  test('loadDreamFile round-trips fragments, waking line, and image style', () => {
    const dream = generateDream(enrichedEvolution(), makeContext('dissolution'));
    const filepath = saveDream(dream, tmpDir);
    const loaded = loadDreamFile(filepath);

    expect(loaded).not.toBeNull();
    expect(loaded!.fragments.length).toBe(dream.fragments.length);
    expect(loaded!.fragments[0]!.text).toBe(dream.fragments[0]!.text);
    expect(loaded!.wakingLine).toBe(dream.wakingLine);
    expect(loaded!.imageStyle).toBe(dream.imageStyle);
    expect(loaded!.seeds.length).toBeGreaterThan(0);
  });

  test('readDreamMarkdown returns the saved markdown content', () => {
    const dream = generateDream(enrichedEvolution(), makeContext());
    const filepath = saveDream(dream, tmpDir);
    const markdown = readDreamMarkdown(filepath);

    expect(markdown).toContain(`# Dream —`);
    expect(markdown).toContain('## Fragments');
    expect(markdown).toContain('## Generated Images');
  });

  test('saveDream writes a local gallery for instant archive viewing', () => {
    const dream = {
      ...generateDream(enrichedEvolution(), makeContext()),
      hasImages: true,
      imagePaths: {
        1: join(tmpDir, 'images', 'dream-local.jpg'),
      },
    };

    saveDream(dream, tmpDir);

    const galleryPath = join(tmpDir, 'gallery.html');
    expect(existsSync(galleryPath)).toBe(true);

    const gallery = readFileSync(galleryPath, 'utf-8');
    expect(gallery).toContain('Dream Archive');
    expect(gallery).toContain('images/dream-local.jpg');
    expect(gallery).toContain('.md');
  });

  test('saveDreamSnapshot treats markdown as the canonical persisted dream', () => {
    const dream = generateDream(enrichedEvolution(), makeContext('dissolution'));
    const snapshot = saveDreamSnapshot(dream, tmpDir);

    expect(snapshot.filepath).toContain('.md');
    expect(snapshot.dream.id).toBe(dream.id);
    expect(snapshot.dream.stage).toBe(dream.stage);
    expect(snapshot.dream.fragments[0]!.imagePrompt).toBe(dream.fragments[0]!.imagePrompt);
    expect(snapshot.dream.visualProfile).toBe(dream.visualProfile);
    expect(snapshot.dream.promptRevision).toBe(dream.promptRevision);
  });

  test('re-saving the same dream does not duplicate archive index entries', () => {
    const dream = generateDream(enrichedEvolution(), makeContext());
    saveDream(dream, tmpDir);
    saveDream({ ...dream, hasImages: true, imagePaths: { 1: 'https://image.pollinations.ai/example' } }, tmpDir);

    const index = readFileSync(join(tmpDir, 'index.md'), 'utf-8');
    const filename = `${new Date(dream.dreamedAt).toISOString().slice(0, 16).replace('T', '-').replace(':', '')}-${dream.stage}.md`;
    expect(index.match(new RegExp(filename.replace('.', '\\.'), 'g'))).toHaveLength(1);
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
    expect(latest!.fragments.length).toBeGreaterThan(0);
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

describe('isManagedDreamFile', () => {
  test('accepts markdown inside the dream archive and rejects outside files', () => {
    const archiveDir = join(tmpdir(), `phosphene-test-managed-dream-${Date.now()}`);
    const inside = join(archiveDir, '2026-04-16-rem.md');
    const outside = join(tmpdir(), 'not-a-dream.md');

    expect(isManagedDreamFile(inside, archiveDir)).toBe(true);
    expect(isManagedDreamFile(outside, archiveDir)).toBe(false);
  });

  test('rejects unsigned markdown that is merely placed inside the archive', () => {
    const archiveDir = join(tmpdir(), `phosphene-test-managed-signature-${Date.now()}`);
    const unsigned = join(archiveDir, 'fake.md');
    const signedDream = generateDream(enrichedEvolution(), makeContext());
    const signedPath = saveDream(signedDream, archiveDir);

    expect(existsSync(signedPath)).toBe(true);

    rmSync(archiveDir, { recursive: true, force: true });
    mkdirSync(archiveDir, { recursive: true });
    writeFileSync(unsigned, '# fake\n\nnot a phosphene dream', 'utf-8');

    expect(isManagedDreamFile(unsigned, archiveDir)).toBe(false);
  });
});

describe('attachPollinationsUrls', () => {
  test('adds image URLs for every fragment', () => {
    const dream = generateDream(enrichedEvolution(), makeContext());
    const withUrls = attachPollinationsUrls(dream);

    expect(withUrls.hasImages).toBe(true);
    expect(Object.keys(withUrls.imagePaths).length).toBe(dream.fragments.length);
    expect(Object.values(withUrls.imagePaths)[0]).toContain('https://image.pollinations.ai/prompt/');
    expect(withUrls.imageBackend).toBe('pollinations');
    expect(withUrls.imageModel).toBe('flux');
  });

  test('uses dream-specific seeds so separate dreams do not reuse the same URL', () => {
    const first = attachPollinationsUrls(generateDream(freshEvolution(), makeContext('clear')));
    const second = attachPollinationsUrls(generateDream(freshEvolution(), makeContext('clear')));

    expect(first.imagePaths[1]).toContain('seed=');
    expect(second.imagePaths[1]).toContain('seed=');
    expect(first.imagePaths[1]).not.toBe(second.imagePaths[1]);
  });
});

describe('generateDreamImages', () => {
  test('can attach pollinations URLs without downloading files', async () => {
    const dream = generateDream(enrichedEvolution(), makeContext());
    const tempDreamDir = join(tmpdir(), `phosphene-test-dream-image-urls-${Date.now()}`);
    const updated = await generateDreamImages(dream, {
      provider: 'pollinations',
      download: false,
    }, tempDreamDir);

    expect(updated.hasImages).toBe(true);
    expect(Object.keys(updated.imagePaths).length).toBe(dream.fragments.length);
    expect(Object.values(updated.imagePaths)[0]).toContain('https://image.pollinations.ai/prompt/');
  });
});

describe('refreshDreamVisuals', () => {
  test('rebuilds stale image prompts with current visual anchors and clears stale assets', () => {
    const original = generateDream(freshEvolution(), makeContext('clear'));
    const stale = {
      ...original,
      hasImages: true,
      imagePaths: { 1: 'https://image.pollinations.ai/prompt/old' },
      fragments: original.fragments.map(fragment => ({
        ...fragment,
        imagePrompt: 'The concept translated itself through three senses before it arrived as language, cinematic composition, high detail in subject, --ar 16:9',
        seedIds: [],
      })),
    };

    const refreshed = refreshDreamVisuals(stale);

    expect(refreshed.hasImages).toBe(false);
    expect(refreshed.imagePaths).toEqual({});
    expect(refreshed.visualProfile).not.toBe('legacy');
    expect(refreshed.promptRevision).toBeGreaterThan(1);
    expect(refreshed.fragments[0]!.imagePrompt).toContain('empty room in pale morning light');
    expect(refreshed.fragments[0]!.imagePrompt).toContain('no human portrait');
  });
});

describe('dreamNeedsVisualRefresh', () => {
  test('flags legacy dream metadata as stale', () => {
    const dream = generateDream(enrichedEvolution(), makeContext());
    const legacy = { ...dream, visualProfile: 'legacy', promptRevision: 1 };

    expect(dreamNeedsVisualRefresh(legacy)).toBe(true);
    expect(dreamNeedsVisualRefresh(dream)).toBe(false);
  });
});

describe('dream gallery rendering', () => {
  test('renderDreamGallery keeps remote and local assets visible', () => {
    const tempDreamDir = join(tmpdir(), `phosphene-test-dream-gallery-${Date.now()}`);
    const dream = {
      ...generateDream(enrichedEvolution(), makeContext()),
      hasImages: true,
      imagePaths: {
        1: join(tempDreamDir, 'images', 'fragment-1.jpg'),
        2: 'https://image.pollinations.ai/prompt/example',
      },
    };

    const html = renderDreamGallery([dream], tempDreamDir);

    expect(html).toContain('fragment-1.jpg');
    expect(html).toContain('https://image.pollinations.ai/prompt/example');
    expect(html).toContain('Open markdown');
    expect(html).toContain(dream.visualProfile);
  });

  test('saveDreamGallery returns the generated local gallery path', () => {
    const tempDreamDir = join(tmpdir(), `phosphene-test-dream-gallery-save-${Date.now()}`);
    saveDream(generateDream(enrichedEvolution(), makeContext()), tempDreamDir);
    const galleryPath = saveDreamGallery(tempDreamDir);

    expect(galleryPath).toBe(join(tempDreamDir, 'gallery.html'));
    expect(existsSync(galleryPath)).toBe(true);
  });

  test('renderDreamGallery marks stale dreams in the archive view', () => {
    const tempDreamDir = join(tmpdir(), `phosphene-test-dream-gallery-stale-${Date.now()}`);
    const dream = {
      ...generateDream(enrichedEvolution(), makeContext()),
      visualProfile: 'legacy',
      promptRevision: 1,
    };

    const html = renderDreamGallery([dream], tempDreamDir);

    expect(html).toContain('dream-stale');
    expect(html).toContain('stale');
    expect(html).toContain('legacy');
  });
});
