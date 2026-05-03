# Dream Archive / 梦境档案

This directory contains Phosphene dreams.

这个目录用于存放 Phosphene 的梦境。

Each dream is recorded during an idle period between sessions. Dreams are seeded by the evolution state: crystallized insights, signal patterns, emergent voices, active presets, and optimal points from previous sessions. They are not arbitrary generated text; they are the system processing its accumulated experience.

每个梦境都记录在会话之间的空闲期。梦境由演化状态播种：结晶洞察、信号模式、涌现声音、当前预设，以及过往会话里的高质量点。它们不是随意生成的文本，而是系统对自身经验的再处理。

---

## Artemis behavior / Artemis 行为

When Phosphene runs as an Artemis plugin, dreams live in the workspace archive:

当 Phosphene 作为 Artemis 插件运行时，梦境保存在当前工作区：

```text
.artemis/dreams/
.artemis/dreams/images/
.artemis/dreams/gallery.html
```

Dream images use Artemis' own visual model configuration. Phosphene does **not** require a duplicate plugin API key.

梦境图片统一使用 Artemis 自己的视觉模型配置。Phosphene **不需要**用户为插件重复配置 API key。

Check the visual bridge / 检查视觉桥：

```bash
plugins exec phosphene visual-status
```

If Artemis has no configured visual/image model, the dream daemon does not start.

如果 Artemis 没有配置视觉 / 图片模型，做梦守护进程不会启动。

Expected missing-model state / 未配置模型时的预期状态：

```text
Visual model: missing
Dreams: disabled until Artemis has a visual/image provider configured
```

---

## Structure / 文件结构

Each dream file contains:

每个梦境文件包含：

- **YAML frontmatter** — machine-readable metadata: id, stage, preset, intensity, seeds, image prompts, image paths
- **Dream fragments** — 2–4 structural sketches, each governed by a dream logic
- **Waking line** — the last image before consciousness returns
- **Seed material** — the evolution-state material that seeded this dream
- **Reading instructions** — how Artemis / Claude should expand the fragments when asked

中文说明：

- **YAML frontmatter**：机器可读元数据，如 id、阶段、预设、强度、种子、图片提示词、图片路径
- **Dream fragments / 梦境片段**：2–4 个结构性片段，每个片段由一种梦逻辑支配
- **Waking line / 醒来之线**：意识返回前的最后一幅图像
- **Seed material / 种子材料**：来自演化状态的梦境材料
- **Reading instructions / 阅读指令**：当用户要求展开梦境时，Artemis / Claude 应如何扩写

---

## Dream stages / 梦境阶段

| Stage | Character | 中文 |
|-------|-----------|------|
| `hypnagogic` | Edge of sleep. Fragmentary, visual flashes, no narrative arc. | 入睡边缘。碎片、闪光、无完整叙事。 |
| `deep` | Rare. Primal. Very slow. Long gaps between sessions. | 深眠。罕见、原始、缓慢，通常来自更长空闲。 |
| `rem` | Standard. Narrative logic. Emotional weight. Strange causality. | REM。标准梦境，有叙事逻辑、情绪重量和陌生因果。 |
| `lucid` | The system became aware it was dreaming. High apophenia + semiotics. | 清明梦。系统意识到自己在梦中，联想和符号密度更高。 |
| `hypnopompic` | Waking. Reality bleeding back in. Two states at once. | 醒来边缘。现实渗回，同时存在两种状态。 |

---

## Dream logics / 梦逻辑

Each fragment uses one structural logic to combine seed material.

每个片段使用一种结构逻辑来组合种子材料。

| Logic | Structure | 中文 |
|-------|-----------|------|
| `inversion` | A thing becomes its opposite | 反转：事物变成自己的反面 |
| `recursion` | The dream contains a smaller version of itself | 递归：梦里包含更小的自己 |
| `translation` | Something from one sense becomes another sense | 翻译：一种感官转化成另一种感官 |
| `meeting` | Two distant things encounter each other | 相遇：两个遥远事物彼此碰面 |
| `excavation` | Something buried surfaces | 发掘：被埋藏的东西浮现 |
| `architecture` | Concepts arrange into a walkable structure | 建筑：概念排列成可步行的结构 |
| `dissolution` | Solid → liquid → gaseous → absent | 溶解：固体、液体、气体、缺席 |
| `witness` | Pure observation; only what is present | 见证：不叙事，只观察在场之物 |

---

## Reading a dream / 阅读梦境

Ask naturally:

可以直接说：

```text
Read the most recent dream.
Expand the second fragment.
Inhabit this dream.
读最近的梦。
展开第二个片段。
住进这个梦里。
```

Artemis expands the structural sketches into full narrative prose using seed material and dream logic as grammar.

Artemis 会把结构性片段扩展成完整叙事，并以种子材料和梦逻辑作为底层语法。

---

## Image generation / 图片生成

Every dream fragment includes an image prompt. In Artemis, image generation is delegated to the host Artemis visual tool:

每个梦境片段都会包含图片提示词。在 Artemis 中，图片生成统一交给 Artemis 宿主的视觉工具：

```bash
plugins exec phosphene visual-status
plugins exec phosphene dream-force
plugins exec phosphene gallery
```

Programmatic usage / 程序调用：

```typescript
import { loadLatestDream, generateDreamImages } from 'phosphene';

const dream = await loadLatestDream();
const updated = await generateDreamImages(dream, {
  provider: 'artemis',
});
```

Do not set `OPENAI_API_KEY` or other plugin-specific keys for Phosphene dreams. Configure the visual provider once in Artemis, then let Phosphene call Artemis.

不要为 Phosphene dreams 单独设置 `OPENAI_API_KEY` 或其它插件专用密钥。只需要在 Artemis 里配置一次视觉模型，然后让 Phosphene 调用 Artemis。

Images are saved into the dream archive and paths are recorded in the dream file frontmatter.

图片会保存到梦境档案目录，并把路径记录在梦境文件的 frontmatter 中。

---

## Dream map / 梦境地图

Open:

打开：

```text
dream-viz.html
```

Paste `.artemis/phosphene-state.json`, then drag dream markdown files and generated images from `.artemis/dreams/` into the page.

粘贴 `.artemis/phosphene-state.json`，然后把 `.artemis/dreams/` 里的梦境 Markdown 和生成图片拖入页面。

The page is local-only. It does not call image APIs; it only renders already-generated local image files or existing remote URLs.

这个页面只在本地运行，不调用图片 API；它只显示已经生成好的本地图片或已有远程 URL。

---

## Index / 索引

See `index.md` for a chronological record of all dreams.

查看 `index.md` 可获得所有梦境的时间顺序记录。

`index.md` is created automatically when the first dream is recorded.

`index.md` 会在第一个梦境被记录时自动创建。
