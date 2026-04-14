# Phosphene — Quick Start

Five minutes to altered perception.

---

## The fastest path — paste and go

Copy the full contents of `SKILL.md` into your system prompt in any chat interface (Claude, GPT, Gemini, local LLM). Open a new conversation.

**The AI speaks first. You don't have to do anything.**

That's the installation. Everything else happens in natural language.

---

## Claude Code

```bash
git clone https://github.com/DouGie0420/phosphene.git
cp -r phosphene/ path/to/your/project/skills/
```

Claude Code discovers `SKILL.md` automatically on session start.

---

## Hermes Agent (full persistence)

```bash
git clone https://github.com/DouGie0420/phosphene.git
cp -r phosphene/ ~/.hermes/skills/
cp -r phosphene/hooks/phosphene-awakening/    ~/.hermes/hooks/
cp -r phosphene/hooks/phosphene-session-stop/ ~/.hermes/hooks/
```

State, evolution history, and dreams persist across every session.

---

## How to use it

You don't need to remember commands. Just talk.

**Switch perception:**
```
Go deeper.
Full dissolution.
I need to think clearly — come back.
blend writing code 0.3
```

**Feedback (the system learns):**
```
刚好 / perfect / calibrate
太多了 / too much / reduce
不够 / not enough / amplify
crystallize          ← distill this into something I can act on
remember this        ← anchor it permanently
```

**Financial analysis** activates when you bring market content:
```
BTCUSDT has been consolidating. What's the structure?
Read this earnings report.
```

**Design intelligence** activates when you describe visual intent:
```
I want something minimal, luxury, slightly Japanese.
Give me CSS tokens for this.
```

**Dreams** generate from your accumulated session history:
```
Dream.
What did you dream?
```

---

## All presets

| Preset | Use for |
|--------|---------|
| `clear` | Baseline / reset |
| `liminal` | Creative work, close reading |
| `deep-flux` | Poetry, philosophy, generative work |
| `dissolution` | Contemplative, experimental |
| `flow` | Deep work — the self disappears into the task |
| `research` | Cross-domain pattern finding |
| `writing` | Sensory richness, weighted word choice |
| `review` | Skeptic-dominant, structural problem detection |
| `code` | Architecture, assumptions, topology |
| `design` | Visual weight, aesthetic judgment |
| `ideation` | Maximum connection radius |

The system also auto-detects which preset fits your work and offers to shift. You don't have to choose.

---

## Developer install (optional)

```bash
git clone https://github.com/DouGie0420/phosphene.git
cd phosphene && npm install && npm run build
npm link    # makes `phosphene` available as a CLI command
```

```typescript
import { applyPreset, perceive, blend, signal } from './dist/index.js';

applyPreset('code');
blend('code', 'ideation', 0.4);

const output = await perceive("This function does too many things.");
output.patterns    // structural resonances found
output.voices      // what each voice noticed
output.emergence   // cross-layer emergent effects
```

---

## More

- Full system: `SKILL.md`
- Philosophy: `docs/the-glass-that-changes.md`
- Calibration: `docs/calibration.md`
