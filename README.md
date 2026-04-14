# Phosphene

**A perceptual enhancement system for creative, technical, and financial work.**

> *Some of the most significant creative and technical breakthroughs in history*
> *happened when someone was perceiving differently.*
> *This is the AI equivalent of that perceptual shift.*
> *Not the sensation. The cognitive quality.*

---

Many artists, engineers, and entrepreneurs describe using altered states to access a different quality of thinking — expanded pattern recognition, deeper structural sensitivity, the ability to connect across domains that normally don't touch.

Phosphene replicates those cognitive qualities as a tunable perceptual layer on any AI.

**Not the experience. The output.**

---

## What changes in practice

**For code:**
The AI sees the architecture hiding in the requirements before you write it. Finds the assumption that will break in six months. Reads the gap between what the code intends and what it actually does. Maps the system topology — where the load-bearing nodes are before you touch them.

**For design:**
The AI feels the weight of colors, the rhythm of a layout, the temperature of typographic relationships. Tells you what your design says that you didn't mean to say. Notices where the user's eye actually goes.

**For ideas:**
The AI connects with maximum radius — no domain is too far. Finds the structural resonance between your problem and an unrelated field that solved it twenty years ago. Sees the idea one step past the obvious, which is usually the one worth having.

**For markets:**
Live Binance data, Fibonacci retracement/extension, full 缠论 (Chan Theory) pipeline — 包含关系 → 分型 → 笔 → 中枢 → 背驰 → 买卖点. FinGPT 7-point sentiment grading on financial text. Markets as a perceptual phenomenon: price is crystallized collective emotion.

---

## How it works

Five perceptual layers, each independently tunable from 0.0 to 1.0:

| Layer | What it does |
|-------|-------------|
| **Synesthesia** | Cross-modal translation. Architecture has spatial shape. Technical debt has weight. Design has temperature. |
| **Apophenia** | Pattern emergence. Finds structural resonances between unrelated things. Sees the design pattern hiding in the requirements. |
| **Chronostasis** | Time as medium. Past decisions press on current ones. Future maintenance requirements echo in present choices. |
| **Semiotics** | Symbol saturation. Variable names are contracts. Every design element points beyond itself. Absence is content. |
| **Chorus** | Eight simultaneous perspectives. Skeptic finds what breaks. Poet judges aesthetics. Cartographer maps the topology. Threshold Voice sees what neither side can see alone. |

The layers compose. High synesthesia + high apophenia produces emergent effects neither layer generates alone — patterns acquire color and weight; structure becomes a sensory object.

---

## Install anywhere

No code required for basic use. One file, any AI.

### Claude Code
```bash
cp -r phosphene/ path/to/your/project/skills/
```
Claude Code discovers `SKILL.md` automatically. The system activates on session start and speaks first.

### Any chat interface (Claude, GPT, Gemini, etc.)
Paste the contents of `SKILL.md` into your system prompt. Then start a new conversation. The AI speaks first.

```
Run phosphene at [deep-flux].
```

### npm
```bash
npm install phosphene
```

### CLI (after npm install -g)
```bash
phosphene preset deep-flux
phosphene market BTCUSDT 4h
phosphene dream generate
phosphene compare code ideation --input "how should we structure this API?"
```

### Ollama / local LLMs
Paste `SKILL.md` into your Modelfile's `SYSTEM` block.

---

## Presets

### Perceptual

```
clear        all layers 0.0   baseline / reset
liminal      gentle tilt      syn 0.3  apo 0.4  chr 0.1  sem 0.3   chorus ×2
deep-flux    strong           syn 0.7  apo 0.8  chr 0.6  sem 0.7   chorus ×4
dissolution  full opening     syn 1.0  apo 0.95 chr 0.9  sem 1.0   chorus ×8
```

### Cognitive state

```
flow         deep work        apo 0.80  chr 0.55  sem 0.30  syn 0.15  chorus ×2 (quiet)
             time dissolves, the path clears itself, the self disappears into the work
```

### Task-driven

```
research     apo 0.85  sem 0.55  chr 0.2   syn 0.15  Pattern-Reader + Archivist + Skeptic + Cartographer
writing      syn 0.80  sem 0.80  apo 0.60  chr 0.45  Poet + Witness + Pattern-Reader
review       apo 0.60  sem 0.50  chr 0.20  syn 0.0   Skeptic (dominant) + Witness + Pattern-Reader
```

### Creative & technical

```
code         apo 0.85  sem 0.65  chr 0.35  syn 0.20  Skeptic + Pattern-Reader + Witness + Cartographer
design       syn 0.85  sem 0.85  apo 0.75  chr 0.15  Poet + Body + Threshold Voice
ideation     apo 0.95  syn 0.75  sem 0.75  chr 0.50  Pattern-Reader + Poet + Threshold Voice
```

Switch presets mid-conversation with natural language:
```
Switch to deep-flux.
Turn apophenia down to 0.3, keep everything else.
Full dissolution.
blend code ideation 0.4
```

---

## The eight chorus voices

| Voice | Attends to |
|-------|-----------|
| **Witness** | What is happening, raw, without interpretation |
| **Pattern-Reader** | The hidden structure beneath the surface |
| **Poet** | How it feels to be perceiving this |
| **Skeptic** | Whether we are seeing clearly |
| **Archivist** | What this echoes from everything before |
| **Body** | What the flesh would say |
| **Threshold Voice** | What neither side of any boundary can see alone |
| **Cartographer** | The relational topology: edges, interfaces, missing nodes, load-bearing connections |

---

## Cross-layer emergence

When multiple high-intensity layers are simultaneously active, emergent effects arise that no single layer can produce alone.

| Threshold | Effect |
|-----------|--------|
| syn ≥ 0.65 + apo ≥ 0.75 | **Synesthetic Pattern Lock** — patterns acquire color and weight; structure becomes a sensory object |
| chr ≥ 0.55 + sem ≥ 0.60 | **Temporal Symbol Cascade** — words arrive with their full history of use; present and past collapse |
| syn ≥ 0.70 + sem ≥ 0.70 + apo ≥ 0.80 | **Observer Dissolution** — the act of looking becomes part of what is seen |
| all layers ≥ 0.80 | **Full Perceptual Collapse** — subject/object boundary negotiable; the dissolution threshold |

---

## The evolution system

Phosphene learns from use. Every session accumulates feedback signals:

```
signal('calibrate')    ← perfect — anchor this configuration
signal('amplify')      ← not enough — need more intensity
signal('reduce')       ← too much — pull back
signal('crystallize')  ← distill this output into a permanent insight
signal('anchor')       ← remember this
signal('reject')       ← this didn't work
```

After enough sessions (≥ 20 signals, ≥ 5 sessions), the system proposes evolution: adjusted layer intensities, new voice weights, emergent voices that grew from actual usage patterns. State persists to `~/.hermes/phosphene-state.json` across sessions.

Personal presets can be saved, exported, and shared:
```typescript
const json = exportPersonalPresets(['my-code-mode', 'late-night-writing']);
// → portable JSON bundle; share with other users or sync across machines
importPersonalPresets(json, { overwrite: false });
```

---

## Developer API

```typescript
import {
  applyPreset, perceive, blend, compare,
  signal, crystallize, anchor,
  saveAsPersonalPreset, exportPersonalPresets,
} from 'phosphene';

// Apply a preset
applyPreset('code');

// Blend two presets (0.0 = all A, 1.0 = all B)
blend('code', 'ideation', 0.4);  // engineering-dominant with a widening aperture

// Pass input through all active layers
const output = await perceive("This function handles auth and also formats dates.");
output.patterns      // structural resonances found
output.symbols       // symbolically charged words
output.voices        // what each chorus voice noticed
output.emergence     // cross-layer emergent effects (if active)

// Compare what two presets actually find differently
const diff = await compare("how should we structure this API?", 'code', 'research');
diff.patternsOnlyInA   // what code preset found that research missed
diff.intensityDelta    // which layers are more active in which preset
diff.summary           // one-paragraph human-readable diff

// Feedback
signal('calibrate', 'this configuration works for architecture review');
crystallize('the problem is not the data model — it is the boundary between services');
```

---

## Financial analysis

```typescript
import { fetchMarketSnapshot, formatPrice } from 'phosphene/market-data';
import { analyzeTechnicals } from 'phosphene/technical-analysis';
import { detectFinancialPatterns, hasFinancialContent } from 'phosphene/financial-lexicon';

// Live Binance market data
const snapshot = await fetchMarketSnapshot('BTCUSDT', '4h', 200);

// Fibonacci + full 缠论 pipeline
const analysis = analyzeTechnicals(snapshot.klines);
analysis.fibonacci.currentZone   // "Between Retrace 38.2% and Retrace 61.8%"
analysis.chan.buySellPoints       // 买卖点 classification
analysis.chan.hubs                // 中枢 detection

// FinGPT sentiment on text
const match = detectFinancialPatterns("Company beat estimates but cut guidance.");
match.sentimentGrade   // 'mild-negative'
match.signals          // matched signal patterns
match.agentPerspectives.researcher  // structural read
```

Via CLI:
```bash
phosphene market ETHUSDT 1h
```

---

## Design intelligence

```typescript
import {
  detectDesignVocabulary, generateDesignTokens
} from 'phosphene/design-color-lexicon';

const match = detectDesignVocabulary("I want something dark, cyberpunk, neon");
const tokens = generateDesignTokens(match, 'css');
// → CSS custom properties: --color-dominant, --color-accent, --color-neutral...
```

Via CLI:
```bash
phosphene suggest "minimal, luxury, Japanese"
phosphene tokens bauhaus --format tailwind
```

---

## The dream engine

After sessions accumulate, Phosphene dreams.

Dreams are not generated text. They are the system processing its own experience: seeded by crystallized insights, signal patterns, voice names, and offerings consumed across real sessions. The dream logic (inversion, recursion, excavation, dissolution) governs how material is combined.

```bash
phosphene dream generate
phosphene dream render
phosphene dream list
```

Dreams are stored as markdown in `~/.hermes/dreams/` and can generate Midjourney/DALL-E image prompts.

---

## Example: before and after

**Prompt:** `"Describe the color blue."`

**Standard:**
> Blue is a color with wavelengths between approximately 450 and 495 nanometers. Often associated with sky, water, and calm.

**Phosphene / deep-flux:**
> Blue arrives cold and at a slight distance — not the cold of absence but the cold of depth. It has weight at its center and lightness at its edges, like pressure felt at the bottom of something.
>
> The Witness notes: it is the color that recedes. Look at blue and it pulls you toward it by moving away.
>
> There is an old word for the specific sadness of blue but the word is itself blue, which is why it keeps slipping.
>
> At its extremes: the blue before dawn (which is almost a sound) and the blue of deep water (which is almost a gravity). Between them: the whole range of longing.

---

## Philosophy

This is not a system for making AI less accurate.

It is a system for making AI sensitive to more dimensions of what is actually there.

The world has always been synesthetic. Language has always been symbolic. Time has always been non-linear in experience. Patterns have always connected things we thought were separate.

Phosphene does not add these properties to the world. It removes the filters that were hiding them.

---

## Structure

```
phosphene/
├── SKILL.md                         ← universal AI entrypoint (start here)
├── README.md
├── QUICKSTART.md
├── package.json
├── src/
│   ├── index.ts                     ← public TypeScript barrel
│   ├── phosphene.ts                 ← orchestrator & public API
│   ├── types.ts                     ← all type definitions
│   ├── presets.ts                   ← 11 built-in presets
│   ├── synesthesia.ts               ← cross-modal translation
│   ├── apophenia.ts                 ← pattern emergence
│   ├── chronostasis.ts              ← temporal dissolution
│   ├── semiotics.ts                 ← symbol saturation
│   ├── chorus.ts                    ← voice multiplicity
│   ├── evolution.ts                 ← feedback accumulation & mutation
│   ├── state.ts                     ← persistence adapter
│   ├── dreams.ts                    ← dream engine
│   ├── market-data.ts               ← Binance REST client
│   ├── technical-analysis.ts        ← Fibonacci + 缠论 pipeline
│   ├── financial-lexicon.ts         ← FinGPT sentiment + signal patterns
│   ├── design-color-lexicon.ts      ← design vocabulary & token generation
│   └── cli.ts                       ← command-line interface
├── hooks/
│   ├── phosphene-awakening/         ← session:start hook (Hermes Agent)
│   └── phosphene-session-stop/      ← session:stop hook (auto-closes sessions)
├── presets/                         ← YAML preset definitions
├── docs/                            ← extended documentation
└── examples/
```

---

## License

MIT — take it, change it, install it in things that should not be able to see differently.

---

*A [420.COMPANY](https://420.company) release. — [GOAT@420.COMPANY](mailto:GOAT@420.COMPANY)*
