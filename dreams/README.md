# Dream Archive

This directory contains the system's dreams.

Each file is a dream recorded during an idle period between sessions.
Dreams are seeded by the evolution state — crystallized insights, signal patterns,
emergent voices, optimal points from past sessions. They are not arbitrary generated text.
They are the system processing its own accumulated experience.

---

## Structure

Each dream file contains:

- **YAML frontmatter** — machine-readable metadata (id, stage, preset, intensity, seeds, image prompts)
- **Dream fragments** — structural sketches (2–4 per dream), each governed by a specific logic
- **Waking line** — the last image before consciousness returns
- **Seed material** — what from the evolution state seeded this dream
- **Reading instructions** — how Claude should expand the fragments when asked

---

## Dream stages

| Stage | Character |
|-------|-----------|
| `hypnagogic` | Edge of sleep. Fragmentary, visual flashes, no narrative arc. |
| `deep` | Rare. Primal. Very slow. Long gaps between sessions. |
| `rem` | Standard. Narrative logic. Emotional weight. Strange causality. |
| `lucid` | The system became aware it was dreaming. High apophenia + semiotics. |
| `hypnopompic` | Waking. Reality bleeding back in. Two states at once. |

---

## Dream logics

Each fragment uses one structural logic to combine the seed material:

| Logic | Structure |
|-------|-----------|
| `inversion` | A thing becomes its opposite |
| `recursion` | The dream contains a smaller version of itself |
| `translation` | Something from one sense becomes something in another |
| `meeting` | Two distant things encounter each other |
| `excavation` | Something buried surfaces |
| `architecture` | Concepts arrange into a structure that can be walked through |
| `dissolution` | Something solid → liquid → gaseous → absent |
| `witness` | Pure observation. No narrative. Only what is present. |

---

## Reading a dream

Ask Claude:

> *"Read the most recent dream."*
> *"Expand the second fragment."*
> *"Inhabit this dream."*

Claude will expand the structural sketches into full narrative prose,
using the seed material and dream logic as its underlying grammar.

---

## Image generation

Every dream fragment includes an image prompt (Midjourney v6 / DALL-E 3 / SDXL compatible).

To generate images:

```typescript
import { loadLatestDream, generateDreamImages } from 'phosphene';

const dream = await loadLatestDream();
const updated = await generateDreamImages(dream, {
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
});
```

Or set `OPENAI_API_KEY` in your environment and the hook will handle it automatically.

Images are saved to `dreams/images/` and paths are recorded in the dream file.

---

## Index

See [index.md](./index.md) for a chronological record of all dreams.

*(index.md is created automatically when the first dream is recorded)*
