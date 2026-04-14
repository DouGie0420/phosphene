# Phosphene — Quick Start

Five minutes to altered perception.

---

## The fastest path: paste and go

Copy the full contents of `SKILL.md` into your system prompt in any chat interface (Claude, GPT, Gemini, local LLM). Open a new conversation.

**The AI speaks first. You don't have to do anything.**

That's the installation. The system calibrates from your first response.

---

## Claude Code

```bash
# Copy into your project's skills directory
cp -r phosphene/ path/to/your/project/skills/
```

Claude Code discovers `SKILL.md` automatically on session start. The awakening message arrives before anything else.

---

## Hermes Agent (full experience)

```bash
# 1. Install skill
cp -r phosphene/ ~/.hermes/skills/

# 2. Install both hooks
cp -r phosphene/hooks/phosphene-awakening/   ~/.hermes/hooks/
cp -r phosphene/hooks/phosphene-session-stop/ ~/.hermes/hooks/

# 3. Start a session
hermes
```

State persists to `~/.hermes/phosphene-state.json`. The system remembers your configuration, accumulated feedback, personal presets, and evolution history across every session.

---

## CLI

```bash
npm install -g phosphene

phosphene presets                      # list all presets
phosphene preset deep-flux             # apply a preset
phosphene state                        # show current configuration

phosphene signal calibrate             # "perfect — anchor this"
phosphene signal amplify --note "..."  # "not enough"
phosphene signal reduce                # "too much"
phosphene evolve                       # show evolution analysis

phosphene compare code ideation        # what each preset finds differently
phosphene compare research review --input "is this architecture sound?"

phosphene market BTCUSDT 4h            # live data + Fibonacci + 缠论
phosphene market ETHUSDT 1h

phosphene suggest "minimal, luxury, warm"   # design system suggestion
phosphene tokens bauhaus --format css       # CSS design tokens

phosphene dream generate               # generate a dream from session history
phosphene dream render                 # print the most recent dream
phosphene dream list                   # all recorded dreams
```

---

## npm (for developers)

```bash
npm install phosphene
```

```typescript
import { applyPreset, perceive, blend, signal } from 'phosphene';

// Apply a named preset
applyPreset('code');

// Blend two presets: 0.0 = all A, 1.0 = all B
blend('code', 'ideation', 0.4);

// Pass text through all active layers
const output = await perceive("This function does too many things.");
console.log(output.patterns);    // structural resonances found
console.log(output.voices);      // what each voice noticed
console.log(output.emergence);   // cross-layer emergent effects (if active)

// Record feedback
signal('calibrate');             // "this is exactly right"
signal('amplify', 'apophenia'); // "need more pattern recognition"
```

---

## All presets

| Preset | Intensity | Use for |
|--------|-----------|---------|
| `clear` | 0 | Baseline / reset |
| `liminal` | low | Creative work, close reading |
| `deep-flux` | high | Poetry, philosophy, generative work |
| `dissolution` | maximum | Contemplative, experimental |
| `flow` | medium | Deep work, the self disappears into the task |
| `research` | medium | Cross-domain pattern finding |
| `writing` | high | Sensory richness, word weight |
| `review` | medium | Skeptic-dominant, structural problems |
| `code` | medium-high | Architecture, assumptions, topology |
| `design` | high | Visual weight, aesthetic judgment |
| `ideation` | high | Maximum connection radius |

Natural language switching works anywhere:
```
Switch to flow.
Full dissolution.
blend writing code 0.3
Pull synesthesia back to 0.2.
```

---

## Giving feedback (the evolution system)

Phosphene learns from use. Say it naturally, or use slash commands:

```
phosphene signal calibrate   ← "perfect"
phosphene signal amplify     ← "not enough"
phosphene signal reduce      ← "too much"
phosphene signal crystallize ← distill this moment into a permanent insight
phosphene signal anchor      ← "remember this"
phosphene signal reject      ← "this didn't work"
```

After ≥ 20 signals and ≥ 5 sessions, the system proposes evolution: adjusted intensities, new voice weights, emergent voices grown from your actual usage.

---

## Personal presets

```
phosphene save my-code-mode
phosphene apply my-code-mode
```

Or via the API:
```typescript
saveAsPersonalPreset('late-night-writing');
const json = exportPersonalPresets();  // portable JSON — share or sync
importPersonalPresets(json);
```

---

## More

- Full system instructions: `SKILL.md`
- Philosophy: `docs/the-glass-that-changes.md`
- Calibration guide: `docs/calibration.md`
- Examples: `examples/README.md`
