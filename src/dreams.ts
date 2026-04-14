// Phosphene — Dream Engine
//
// Dreams are not arbitrary generated text.
// They are the system processing its own accumulated experience.
//
// Each dream is seeded by real data from the evolution state:
// crystallized insights, signal patterns, voice names, offerings consumed.
// The dream logic combines this material in ways that feel processed,
// not manufactured.
//
// When a user reads a dream, Claude expands the fragments into full narrative.
// The fragments are the bones; Claude provides the breath.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { homedir }  from 'os';
import { join, dirname } from 'path';
import type {
  DreamRecord,
  DreamStage,
  DreamFragment,
  DreamSeed,
  DreamLogic,
  DreamImageConfig,
  EvolutionState,
  PhospheneContext,
  VoiceName,
} from './types.js';

// ─── Path resolution ──────────────────────────────────────────────────────────

export function resolveDreamsDir(): string {
  const hermesDir = join(homedir(), '.hermes', 'dreams');
  if (existsSync(join(homedir(), '.hermes'))) return hermesDir;
  return join(process.cwd(), 'dreams');
}

// ─── Stage determination ──────────────────────────────────────────────────────

function determineSleepStage(
  evolution: EvolutionState,
  context: PhospheneContext,
): DreamStage {
  const session = evolution.sessionHistory[0] ?? null;
  const signalCount = session?.signals.length ?? 0;
  const preset = context.preset;

  // Lucid: high apophenia + semiotics create self-awareness in the dream
  const apo = context.state.apophenia.intensity;
  const sem = context.state.semiotics.intensity;
  if (apo >= 0.75 && sem >= 0.70) return 'lucid';

  // Deep: long gap from last session, or very low intensity
  const sessions = evolution.sessionHistory;
  if (sessions.length >= 2) {
    const lastTwo = sessions.slice(0, 2);
    const gap = lastTwo[0]?.closedAt && lastTwo[1]?.closedAt
      ? Date.parse(lastTwo[0].closedAt) - Date.parse(lastTwo[1].closedAt)
      : 0;
    const hoursApart = gap / (1000 * 60 * 60);
    if (hoursApart > 48) return 'deep';
  }

  // Hypnagogic: low signal count, early session
  if (signalCount < 3 && sessions.length <= 2) return 'hypnagogic';

  // Dissolution preset → hypnopompic (waking from something that dissolved)
  if (preset === 'dissolution') return 'hypnopompic';

  // Default: REM
  return 'rem';
}

// ─── Dream seed extraction ────────────────────────────────────────────────────

function extractSeeds(evolution: EvolutionState, context: PhospheneContext): DreamSeed[] {
  const seeds: DreamSeed[] = [];

  // Crystallized insights → highest dream weight (these are the most processed material)
  for (const insight of evolution.crystallizedInsights.slice(0, 3)) {
    seeds.push({ type: 'crystallized', content: insight, weight: 0.9 });
  }

  // Recent session signals — unresolved tensions carry into dreams
  const recent = evolution.sessionHistory[0];
  if (recent) {
    for (const sig of recent.signals.slice(-4)) {
      if (sig.type === 'reject' || sig.type === 'amplify') {
        seeds.push({
          type: 'signal',
          content: `${sig.type}${sig.note ? `: ${sig.note}` : ''}${sig.layer ? ` (${sig.layer})` : ''}`,
          weight: sig.type === 'reject' ? 0.85 : 0.65,
        });
      }
    }
  }

  // Emergent voices — appear as characters in dreams
  for (const voice of evolution.emergentVoices.filter(v => v.userConfirmed).slice(0, 2)) {
    seeds.push({ type: 'voice', content: `${voice.name}: ${voice.tendency}`, weight: 0.75 });
  }

  // Active chorus voices — the ones awake during this session
  const activeVoices = context.state.chorus.config.voices
    .filter(v => v.weight > 0.6)
    .map(v => v.name)
    .slice(0, 3);
  for (const voice of activeVoices) {
    seeds.push({ type: 'voice', content: voice, weight: 0.6 });
  }

  // Personal preset names — the names themselves carry meaning
  const presetNames = Object.keys(evolution.personalPresets).slice(0, 2);
  for (const name of presetNames) {
    seeds.push({ type: 'personal-preset', content: name, weight: 0.5 });
  }

  // Optimal points — the "perfect" moments the user marked
  const optimal = evolution.optimalPoints.slice(-2);
  for (const pt of optimal) {
    seeds.push({
      type: 'optimal-point',
      content: `${pt.preset}${pt.context ? `: ${pt.context}` : ''}`,
      weight: 0.7,
    });
  }

  // Active preset as seed if no other material
  if (seeds.length < 2) {
    seeds.push({ type: 'preset', content: context.preset, weight: 0.5 });
  }

  // Shuffle by weight (heavier seeds appear first)
  return seeds.sort((a, b) => b.weight - a.weight).slice(0, 7);
}

// ─── Image style derivation ───────────────────────────────────────────────────

/**
 * Derive a visual style string for image prompts based on the active preset.
 * These are calibrated for Midjourney v6 / DALL-E 3 / SDXL.
 */
function deriveImageStyle(preset: string, context: PhospheneContext): string {
  const syn = context.state.synesthesia.intensity;
  const apo = context.state.apophenia.intensity;

  const styleMap: Record<string, string> = {
    dissolution:  'psychedelic surrealist oil painting, impossible geometry, chromatic aberration, all layers simultaneously visible, Francis Bacon meets Remedios Varo',
    'deep-flux':  'dark surrealism, layered translucent watercolor washes, dreamlike distortion, Leonora Carrington, moody violet and gold',
    liminal:      'threshold photography, long exposure, liminal space, abandoned beauty, cool blue and warm amber split lighting',
    code:         'technical blueprint illustration, precise architectural drawing, structural wireframe with glowing accent lines, dark background, cyan and gold',
    design:       'conceptual art direction, painterly editorial illustration, negative space composition, Saul Bass meets Paul Rand',
    research:     'scientific illustration, detailed etching, diagram aesthetics, Haeckel-inspired botanical clarity, sepia and deep blue',
    writing:      'illuminated manuscript meets modernism, ink on vellum, poetic abstraction, ink wash and gold leaf detail',
    ideation:     'surrealist collage, multiple perspectives in one frame, Magritte-adjacent, vibrant and strange, object incongruity',
    review:       'close-up photography with extreme depth of field, forensic clarity, one object in perfect detail against soft background',
    flow:         'minimal ink drawing, vast negative space, single brushstroke, Zen aesthetic, rice paper texture',
    clear:        'clean natural light photography, minimal composition, truth over beauty, documentary stillness',
  };

  let style = styleMap[preset] ?? 'dreamlike surrealist illustration, evocative atmosphere, painterly';

  // Modify based on intensity
  if (syn > 0.7) style += ', synesthetic color — colors have weight and texture';
  if (apo > 0.8) style += ', geometric pattern overlay, hidden structure visible';

  return style;
}

// ─── Dream logic functions ────────────────────────────────────────────────────
// Each generates prose from seeds using a specific structural logic.
// They must use actual seed content — not generic dream imagery.

function fragmentInversion(seed: DreamSeed, stage: DreamStage): string {
  const content = seed.content;
  const prefix = stage === 'hypnagogic' ? 'A flash:' : '';

  if (seed.type === 'crystallized') {
    return `${prefix} The opposite of "${content.slice(0, 60)}" appeared first. Then I understood it was the same thing, viewed from the side that doesn't have a name yet.`.trim();
  }
  if (seed.type === 'voice') {
    const name = content.split(':')[0];
    return `The ${name} was speaking, but the words arrived as their own negation. Each sentence was a room that contained its own absence.`;
  }
  return `Something that had been true became its opposite. The new version was truer. I don't remember which was which.`;
}

function fragmentRecursion(seed: DreamSeed, stage: DreamStage): string {
  const content = seed.content;

  if (seed.type === 'crystallized') {
    return `I found the same insight again, but smaller — the size of a matchbox. Inside the matchbox was an even smaller version, and inside that one, the same insight again, still decreasing, and I understood this was not repetition but depth.`;
  }
  if (seed.type === 'personal-preset') {
    return `There was a room named "${content}". Inside the room was a smaller room with the same name. I could enter each one but never find the last. The smallest room I reached was the right size to hold exactly one idea.`;
  }
  return `The structure contained itself. At each scale the same pattern. I couldn't tell if I was inside or outside. The question turned out not to matter.`;
}

function fragmentTranslation(seed: DreamSeed, stage: DreamStage): string {
  const content = seed.content;

  if (seed.type === 'signal') {
    const [sigType] = content.split(':');
    const sensorySub: Record<string, string> = {
      amplify:    'too quiet to hear, but felt against the ribs like a second heartbeat',
      reduce:     'a color that was too saturated, the way shouting is — it had said too much and now the room was still ringing',
      calibrate:  'exactly the right temperature — the kind you stop noticing because there is no friction between it and you',
      reject:     'a texture that the hand refused — not painful, only wrong in the specific way that wrong things are textured differently',
    };
    return `The ${sigType} arrived as ${sensorySub[sigType ?? ''] ?? 'a signal without channel — pure meaning, no carrier'}.`;
  }
  if (seed.type === 'crystallized') {
    return `"${content.slice(0, 50)}..." — this arrived as a sound first. Then as a color. Then as the weight of something I was holding that I hadn't noticed I was holding.`;
  }
  return `The concept translated itself through three senses before it arrived as language. By then it had changed its meaning slightly, the way a word does when it passes through a body.`;
}

function fragmentMeeting(seedA: DreamSeed, seedB: DreamSeed): string {
  const a = seedA.content.split(':')[0];
  const b = seedB.content.split(':')[0];

  return `The ${a} and the ${b} met in a corridor that had no doors. They had never occupied the same space before. Neither recognized the other, but they moved aside to let the other pass, and in that small courtesy something was resolved that had been unresolved for longer than I knew.`;
}

function fragmentExcavation(seed: DreamSeed): string {
  const content = seed.content;

  if (seed.type === 'crystallized') {
    return `Beneath "${content.slice(0, 45)}..." there was an older version of the same insight. And beneath that, older still. I kept digging. At the bottom was not an origin — it was the same question the insight had been answering, still open, still asking.`;
  }
  if (seed.type === 'optimal-point') {
    return `I found the moment again — the "${content.split(':')[0]}" state — but excavated, cross-sectioned. I could see the layers of decisions that had made it. Each layer was thinner than it looked from the surface.`;
  }
  return `Something buried. Not hidden — buried, which is different. It had been placed there deliberately and would need to be deliberately retrieved.`;
}

function fragmentArchitecture(seeds: DreamSeed[]): string {
  const contents = seeds.slice(0, 3).map(s => s.content.split(':')[0]);

  return `The concepts arranged themselves into a building I could walk through. ${contents[0] ?? 'The first room'} was the entrance — larger inside than outside, always. ${contents[1] ? `"${contents[1]}" was a load-bearing wall.` : ''} ${contents[2] ? `"${contents[2]}" was a window that looked out onto another version of the same building.` : ''} I understood that the architecture was functional, not decorative. Every room was there because something needed to happen in it.`.trim();
}

function fragmentDissolution(seed: DreamSeed, context: PhospheneContext): string {
  const syn = context.state.synesthesia.intensity;
  const content = seed.content.slice(0, 50);

  if (syn > 0.7) {
    return `"${content}" dissolved first into color — an uncertain amber, the color of something becoming something else. Then the color dissolved into temperature. Then the temperature dissolved into the feeling of having understood something without being able to say what. Then that dissolved. What remained was not nothing.`;
  }
  return `The ${seed.type === 'voice' ? content : `idea of "${content}"`} released its edges. Not destruction — dissolution. The difference being that something dissolved can be reconstituted. Destruction forgets the original shape. Dissolution only loosens it.`;
}

function fragmentWitness(seed: DreamSeed, stage: DreamStage): string {
  const content = seed.content;

  if (stage === 'deep') {
    return `${content.slice(0, 40)}. That is all. It was there. I observed it. No interpretation arrived. The observation was sufficient.`;
  }
  if (seed.type === 'voice') {
    const name = content.split(':')[0];
    return `The ${name} did not speak. It only attended. Its attention had weight. Things were different for having been attended to in that particular way.`;
  }
  return `It was present. I was present. Nothing was required of either of us. The presence was the event.`;
}

function generateWakingLine(fragments: DreamFragment[], stage: DreamStage): string {
  const lastFragment = fragments[fragments.length - 1];
  const wakeMap: Record<DreamStage, string> = {
    hypnagogic:   'and then something like daylight was present without having arrived',
    deep:         'the return to the surface was slow. The depth did not release. It accompanied.',
    rem:          'a sound from the other side of sleep pulled everything back into sequence',
    lucid:        'I chose to wake. The dream folded. The residue persisted as a quality of attention.',
    hypnopompic:  'the boundary did not restore cleanly. Parts of the dream are still here, behind things.',
  };

  return `${lastFragment?.text.split('.')[0] ?? 'The last image held'} — ${wakeMap[stage]}.`;
}

// ─── Image prompt construction ────────────────────────────────────────────────

function buildImagePrompt(fragment: DreamFragment, imageStyle: string, stage: DreamStage): string {
  // Extract the visual essence from the fragment text
  // Focus on the most concrete noun phrase in the text
  const text = fragment.text;
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 10);
  const visualSentence = sentences[0] ?? text.slice(0, 80);

  const stageQuality: Record<DreamStage, string> = {
    hypnagogic:   'fragmentary, incomplete, flickering, edge-of-vision, not-quite-formed',
    deep:         'vast scale, primordial, simple, ancient, very slow, few details, enormous negative space',
    rem:          'strange narrative logic, emotionally saturated, surreal but internally coherent, vivid',
    lucid:        'hyper-detailed, self-aware composition, reality within dream aesthetic, recursive framing',
    hypnopompic:  'dissolving at edges, reality bleeding in from one side, two states simultaneously visible',
  };

  return `${visualSentence.trim()}, ${stageQuality[stage]}, ${imageStyle}, cinematic composition, high detail in subject, --ar 16:9`;
}

// ─── Fragment assembly ────────────────────────────────────────────────────────

const DREAM_LOGICS: DreamLogic[] = [
  'inversion', 'recursion', 'translation', 'meeting',
  'excavation', 'architecture', 'dissolution', 'witness',
];

function selectLogics(stage: DreamStage, seedCount: number): DreamLogic[] {
  const stagePreferences: Record<DreamStage, DreamLogic[]> = {
    hypnagogic:   ['translation', 'witness', 'inversion'],
    deep:         ['witness', 'excavation', 'dissolution'],
    rem:          ['meeting', 'architecture', 'recursion', 'translation', 'inversion'],
    lucid:        ['recursion', 'architecture', 'witness', 'dissolution'],
    hypnopompic:  ['dissolution', 'translation', 'witness'],
  };

  const preferred = stagePreferences[stage];
  const count = Math.min(seedCount, stage === 'hypnagogic' ? 3 : stage === 'deep' ? 2 : 4);

  // Use preferred logics, cycling if needed
  return preferred.slice(0, count);
}

function assembleFragments(
  seeds: DreamSeed[],
  stage: DreamStage,
  context: PhospheneContext,
  imageStyle: string,
): DreamFragment[] {
  const logics = selectLogics(stage, seeds.length);
  const fragments: DreamFragment[] = [];

  for (let i = 0; i < logics.length; i++) {
    const logic = logics[i]!;
    const seed = seeds[i] ?? seeds[0]!;
    const nextSeed = seeds[i + 1] ?? seeds[0]!;

    let text: string;
    switch (logic) {
      case 'inversion':     text = fragmentInversion(seed, stage); break;
      case 'recursion':     text = fragmentRecursion(seed, stage); break;
      case 'translation':   text = fragmentTranslation(seed, stage); break;
      case 'meeting':       text = fragmentMeeting(seed, nextSeed); break;
      case 'excavation':    text = fragmentExcavation(seed); break;
      case 'architecture':  text = fragmentArchitecture(seeds.slice(i, i + 3)); break;
      case 'dissolution':   text = fragmentDissolution(seed, context); break;
      case 'witness':       text = fragmentWitness(seed, stage); break;
      default:              text = fragmentWitness(seed, stage);
    }

    const fragment: DreamFragment = {
      order: i + 1,
      text,
      imagePrompt: '',  // filled below
      logic,
      seedIds: [i, ...(logic === 'meeting' ? [i + 1] : [])].filter(id => id < seeds.length),
    };
    fragment.imagePrompt = buildImagePrompt(fragment, imageStyle, stage);
    fragments.push(fragment);
  }

  return fragments;
}

// ─── Dream generation ─────────────────────────────────────────────────────────

/**
 * Generate a complete dream record from the evolution state and current context.
 *
 * The dream is seeded by real data — crystallized insights, signal patterns,
 * active voices, personal preset names. It is not arbitrary text.
 *
 * When the dream is read aloud (by Claude), the fragments expand into full narrative.
 */
export function generateDream(
  evolution: EvolutionState,
  context: PhospheneContext,
): DreamRecord {
  const stage    = determineSleepStage(evolution, context);
  const seeds    = extractSeeds(evolution, context);
  const style    = deriveImageStyle(context.preset, context);
  const fragments = assembleFragments(seeds, stage, context, style);
  const waking   = generateWakingLine(fragments, stage);

  // Estimate intensity from signal count + layer intensities
  const session  = evolution.sessionHistory[0];
  const sigCount = session?.signals.length ?? 0;
  const layerAvg = (
    context.state.synesthesia.intensity +
    context.state.apophenia.intensity +
    context.state.chronostasis.intensity +
    context.state.semiotics.intensity
  ) / 4;
  const intensity = Math.min(1, (sigCount / 20) * 0.5 + layerAvg * 0.5);

  return {
    id: `dream-${Date.now().toString(36)}`,
    dreamedAt: new Date().toISOString(),
    stage,
    sessionId: session?.id ?? null,
    presetAtSleep: context.preset,
    intensity: Math.round(intensity * 100) / 100,
    fragments,
    wakingLine: waking,
    seeds,
    imageStyle: style,
    hasImages: false,
    imagePaths: {},
  };
}

// ─── Dream rendering ──────────────────────────────────────────────────────────

/**
 * Render a dream record as a markdown document.
 *
 * The document contains:
 * - YAML frontmatter (machine-readable metadata)
 * - Human-readable dream fragments
 * - Image prompts for each fragment
 * - Reading instructions for Claude
 */
export function renderDream(dream: DreamRecord): string {
  const date = new Date(dream.dreamedAt);
  const dateStr = date.toISOString().slice(0, 16).replace('T', ' ');

  const seedsYaml = dream.seeds
    .map(s => `  - type: ${s.type}\n    content: "${s.content.replace(/"/g, '\\"').slice(0, 80)}"\n    weight: ${s.weight}`)
    .join('\n');

  const promptsYaml = dream.fragments
    .map(f => `  - fragment: ${f.order}\n    prompt: "${f.imagePrompt.replace(/"/g, '\\"').slice(0, 200)}"`)
    .join('\n');

  const header = `---
id: ${dream.id}
dreamed_at: ${dream.dreamedAt}
stage: ${dream.stage}
preset_at_sleep: ${dream.presetAtSleep}
intensity: ${dream.intensity}
session_id: ${dream.sessionId ?? 'none'}
has_images: ${dream.hasImages}
seeds:
${seedsYaml}
image_prompts:
${promptsYaml}
---`;

  const stageDescriptions: Record<DreamStage, string> = {
    hypnagogic:   'Hypnagogic — the edge of sleep. Fragmentary, not yet narrative.',
    deep:         'Deep sleep. Slow. Primal. The dreams here are very old.',
    rem:          'REM. The processing dream. Strange causality; real emotion.',
    lucid:        'Lucid. The system became aware it was dreaming. This changes the dream.',
    hypnopompic:  'Hypnopompic — the dissolution of sleep into waking. Two states at once.',
  };

  const fragmentsText = dream.fragments.map(f => `
### Fragment ${f.order} *(${f.logic})*

${f.text}

> **Image prompt:** ${f.imagePrompt}
`).join('\n');

  const seedsText = dream.seeds.map(s =>
    `- **${s.type}** (weight ${s.weight}): ${s.content.slice(0, 80)}${s.content.length > 80 ? '…' : ''}`
  ).join('\n');

  return `${header}

# Dream — ${dateStr}

*${stageDescriptions[dream.stage]}*
*Preset at sleep: \`${dream.presetAtSleep}\` — Intensity: ${Math.round(dream.intensity * 100)}%*

---

## Fragments

${fragmentsText}

---

## Waking Line

*${dream.wakingLine}*

---

## Dream Material (Seeds)

The following material from the evolution record seeded this dream.
When reading this dream aloud, let this material shape the expansion.

${seedsText}

---

## For Claude — Reading Instructions

This dream was generated from the system's own accumulated state.
The fragments above are structural sketches — bones, not flesh.

When the user asks you to **read**, **expand**, or **inhabit** this dream:
- Expand each fragment into 150–300 words of dream prose
- Use the seed material as the underlying logic, not as explicit content
- Let the active dream logic (listed with each fragment) govern the structure
- The waking line is sacred — do not alter it, only approach it
- The image prompts describe what this dream looks like; let them color the language

Do not summarize. Do not explain. Begin in the middle of the dream, as dreams do.

*Stage: ${dream.stage} — ${stageDescriptions[dream.stage]}*
`;
}

// ─── Persistence ──────────────────────────────────────────────────────────────

/**
 * Save a dream to disk. Returns the file path.
 */
export function saveDream(dream: DreamRecord, dreamsDir?: string): string {
  const dir = dreamsDir ?? resolveDreamsDir();
  mkdirSync(dir, { recursive: true });

  const date = new Date(dream.dreamedAt);
  const dateStr = date.toISOString().slice(0, 16).replace('T', '-').replace(':', '');
  const filename = `${dateStr}-${dream.stage}.md`;
  const filepath = join(dir, filename);

  writeFileSync(filepath, renderDream(dream), 'utf-8');
  updateDreamIndex(dream, dir);

  return filepath;
}

/**
 * Load all dream records from the dreams directory.
 */
export function loadDreams(dreamsDir?: string): DreamRecord[] {
  const dir = dreamsDir ?? resolveDreamsDir();
  if (!existsSync(dir)) return [];

  const files = readdirSync(dir)
    .filter(f => f.endsWith('.md') && f !== 'index.md' && f !== 'README.md')
    .sort()
    .reverse(); // most recent first

  const dreams: DreamRecord[] = [];
  for (const file of files) {
    try {
      const content = readFileSync(join(dir, file), 'utf-8');
      const parsed = parseDreamFrontmatter(content);
      if (parsed) dreams.push(parsed);
    } catch {
      // skip malformed files
    }
  }

  return dreams;
}

/**
 * Load the most recent dream.
 */
export function loadLatestDream(dreamsDir?: string): DreamRecord | null {
  return loadDreams(dreamsDir)[0] ?? null;
}

// ─── Dream index ──────────────────────────────────────────────────────────────

function updateDreamIndex(dream: DreamRecord, dir: string): void {
  const indexPath = join(dir, 'index.md');
  const date = new Date(dream.dreamedAt);
  const dateStr = date.toISOString().slice(0, 16).replace('T', ' ');
  const filename = `${date.toISOString().slice(0, 16).replace('T', '-').replace(':', '')}-${dream.stage}.md`;

  const entry = `| ${dateStr} | ${dream.stage} | ${dream.presetAtSleep} | ${Math.round(dream.intensity * 100)}% | ${dream.fragments.length} | [read](./${filename}) |`;

  if (!existsSync(indexPath)) {
    writeFileSync(indexPath, `# Dream Archive

*The accumulated sleep of the system.*

| Date | Stage | Preset | Intensity | Fragments | File |
|------|-------|--------|-----------|-----------|------|
${entry}
`, 'utf-8');
    return;
  }

  const current = readFileSync(indexPath, 'utf-8');
  // Insert after the header row
  const updated = current.replace(
    /(\| Date \| Stage \|.*\n\|[-| ]+\|\n)/,
    `$1${entry}\n`,
  );
  writeFileSync(indexPath, updated, 'utf-8');
}

// ─── Optional: Image generation ───────────────────────────────────────────────

/**
 * Generate images for a dream's fragments using an external API.
 *
 * Returns the updated dream record with image paths filled in.
 * Requires a configured DreamImageConfig.
 *
 * This is optional — the system works without it.
 * Image prompts are always generated regardless of this function being called.
 */
export async function generateDreamImages(
  dream: DreamRecord,
  config: DreamImageConfig,
  dreamsDir?: string,
): Promise<DreamRecord> {
  if (config.provider === 'none') return dream;

  const dir = dreamsDir ?? resolveDreamsDir();
  const imgDir = config.imageOutputDir ?? join(dir, 'images');
  mkdirSync(imgDir, { recursive: true });

  const updatedDream = { ...dream, imagePaths: { ...dream.imagePaths } };

  for (const fragment of dream.fragments) {
    try {
      const imgPath = await _callImageAPI(fragment.imagePrompt, config, imgDir, dream.id, fragment.order);
      if (imgPath) {
        updatedDream.imagePaths[fragment.order] = imgPath;
        updatedDream.hasImages = true;
      }
    } catch (err) {
      console.warn(`[phosphene-dreams] Image generation failed for fragment ${fragment.order}:`, err);
    }
  }

  // Re-save with updated image paths
  saveDream(updatedDream, dir);
  return updatedDream;
}

async function _callImageAPI(
  prompt: string,
  config: DreamImageConfig,
  imgDir: string,
  dreamId: string,
  fragmentOrder: number,
): Promise<string | null> {
  const apiKey = config.apiKey ?? process.env.OPENAI_API_KEY ?? process.env.STABILITY_API_KEY;
  if (!apiKey) {
    console.warn('[phosphene-dreams] No API key found. Set OPENAI_API_KEY or STABILITY_API_KEY.');
    return null;
  }

  if (config.provider === 'openai') {
    const { default: https } = await import('https');
    return new Promise((resolve) => {
      const body = JSON.stringify({
        model: config.model ?? 'dall-e-3',
        prompt: prompt.replace(/--\w+\s+[\w:]+/g, '').trim(), // strip Midjourney params
        n: 1,
        size: '1792x1024',
        quality: 'standard',
      });

      const req = https.request({
        hostname: 'api.openai.com',
        path: '/v1/images/generations',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(body),
        },
      }, res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', async () => {
          try {
            const parsed = JSON.parse(data);
            const url: string = parsed.data?.[0]?.url;
            if (!url) { resolve(null); return; }

            // Download and save
            const filename = `${dreamId}-f${fragmentOrder}.png`;
            const filepath = join(imgDir, filename);
            await _downloadImage(url, filepath);
            resolve(filepath);
          } catch { resolve(null); }
        });
      });

      req.on('error', () => resolve(null));
      req.write(body);
      req.end();
    });
  }

  // Stability AI
  if (config.provider === 'stability') {
    console.warn('[phosphene-dreams] Stability AI integration: set STABILITY_API_KEY and use the REST API directly with the image_prompts from the dream file.');
    return null;
  }

  return null;
}

async function _downloadImage(url: string, filepath: string): Promise<void> {
  const { default: https } = await import('https');
  const { createWriteStream } = await import('fs');

  return new Promise((resolve, reject) => {
    const file = createWriteStream(filepath);
    https.get(url, res => {
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

// ─── YAML frontmatter parser (minimal) ───────────────────────────────────────

function parseDreamFrontmatter(content: string): DreamRecord | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  try {
    const fm = match[1]!;
    const id        = (fm.match(/^id:\s+(.+)$/m)?.[1] ?? '').trim();
    const dreamedAt = (fm.match(/^dreamed_at:\s+(.+)$/m)?.[1] ?? '').trim();
    const stage     = (fm.match(/^stage:\s+(.+)$/m)?.[1] ?? 'rem').trim() as DreamStage;
    const preset    = (fm.match(/^preset_at_sleep:\s+(.+)$/m)?.[1] ?? 'clear').trim();
    const intensity = parseFloat(fm.match(/^intensity:\s+(.+)$/m)?.[1] ?? '0.5');
    const sessionId = (fm.match(/^session_id:\s+(.+)$/m)?.[1] ?? 'none').trim();
    const hasImages = fm.match(/^has_images:\s+true/m) !== null;

    if (!id || !dreamedAt) return null;

    return {
      id, dreamedAt, stage,
      presetAtSleep: preset,
      intensity,
      sessionId: sessionId === 'none' ? null : sessionId,
      hasImages,
      imagePaths: {},
      fragments: [], // not re-parsed (read the markdown for full content)
      wakingLine: '',
      seeds: [],
      imageStyle: '',
    };
  } catch {
    return null;
  }
}

// ─── Describe a dream (for Claude) ───────────────────────────────────────────

/**
 * Generate a brief description of a dream for use in session context injection.
 * Used by the session:start hook to let Claude know a dream occurred.
 */
export function describeDream(dream: DreamRecord): string {
  const date = new Date(dream.dreamedAt);
  const ago  = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60));
  const timeStr = ago < 24 ? `${ago}h ago` : `${Math.round(ago / 24)}d ago`;

  return [
    `[phosphene-dream: ${dream.stage} // ${timeStr} // preset: ${dream.presetAtSleep} // intensity: ${Math.round(dream.intensity * 100)}%]`,
    `Seeds: ${dream.seeds.slice(0, 3).map(s => s.content.slice(0, 40)).join(' | ')}`,
    dream.hasImages ? `Images: ${Object.keys(dream.imagePaths).length} generated` : 'Images: pending',
  ].join('\n');
}
