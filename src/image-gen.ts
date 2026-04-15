// Phosphene — Dream Image Generation
//
// Backend priority (lowest friction first):
//
//   1. pollinations  free · no API key · FLUX model · URL = image (default)
//   2. hf            free HuggingFace account token · FLUX.1-schnell
//   3. openai        DALL-E 3 · paid · OPENAI_API_KEY
//   4. stability     Stability AI · paid · STABILITY_API_KEY
//   5. local         Automatic1111 / ComfyUI REST · http://localhost:7860
//   6. none          disabled
//
// For Pollinations, imagePaths stores the URL directly — no download needed.
// The URL itself IS the generated image; browsers load it as <img src="...">.

import { createWriteStream, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { DreamImageConfig } from './types.js';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface GeneratedImage {
  /** URL (Pollinations / OpenAI temp URL) or local file path. */
  path: string;
  /** The backend that produced the image. */
  backend: DreamImageConfig['provider'];
  /** The full prompt that was used. */
  prompt: string;
  /** Width in pixels. */
  width: number;
  /** Height in pixels. */
  height: number;
}

// ─── Pollinations.ai ──────────────────────────────────────────────────────────
// https://image.pollinations.ai/prompt/{encoded}?params
// Free, no account, FLUX model by default. URL resolves to JPEG/PNG on GET.
// Deterministic: same prompt + seed → same image.

export function pollinationsUrl(
  prompt: string,
  style: string,
  config: DreamImageConfig = {},
  seed?: number,
): string {
  const full = style ? `${prompt}, ${style}` : prompt;
  const params: Record<string, string> = {
    width:   String(config.width  ?? 1024),
    height:  String(config.height ?? 768),
    model:   config.model ?? 'flux',
    nologo:  '1',
    enhance: 'false',
  };
  if (seed != null) params.seed = String(seed);
  const qs = new URLSearchParams(params).toString();
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?${qs}`;
}

async function generatePollinations(
  prompt: string,
  style: string,
  config: DreamImageConfig,
  outputPath?: string,
  seed?: number,
): Promise<GeneratedImage> {
  const url = pollinationsUrl(prompt, style, config, seed);
  if (config.download && outputPath) {
    await downloadUrl(url, outputPath);
    return {
      path:    outputPath,
      backend: 'pollinations',
      prompt:  style ? `${prompt}, ${style}` : prompt,
      width:   config.width  ?? 1024,
      height:  config.height ?? 768,
    };
  }
  return {
    path:    url,
    backend: 'pollinations',
    prompt:  style ? `${prompt}, ${style}` : prompt,
    width:   config.width  ?? 1024,
    height:  config.height ?? 768,
  };
}

// ─── HuggingFace Inference API ────────────────────────────────────────────────
// Free tier: ~30 req/day without token, ~1000/day with free account token.
// Returns raw image binary; we save to disk and return the local path.

async function generateHuggingFace(
  prompt: string,
  style: string,
  config: DreamImageConfig,
  outputPath: string,
): Promise<GeneratedImage> {
  const full    = style ? `${prompt}, ${style}` : prompt;
  const model   = config.model ?? 'black-forest-labs/FLUX.1-schnell';
  const apiKey  = config.apiKey ?? process.env.HF_TOKEN ?? process.env.HUGGINGFACE_TOKEN;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const { default: https } = await import('https');

  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      inputs: full,
      parameters: {
        width:  config.width  ?? 1024,
        height: config.height ?? 768,
      },
    });

    const url = new URL(`https://api-inference.huggingface.co/models/${model}`);
    const req = https.request({
      hostname: url.hostname,
      path:     url.pathname,
      method:   'POST',
      headers:  { ...headers, 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (!res.statusCode || res.statusCode >= 400) {
          return reject(new Error(`HuggingFace API ${res.statusCode}: ${buf.toString().slice(0, 200)}`));
        }
        try {
          mkdirSync(join(outputPath, '..'), { recursive: true });
          writeFileSync(outputPath, buf);
          resolve({
            path:    outputPath,
            backend: 'hf',
            prompt:  full,
            width:   config.width  ?? 1024,
            height:  config.height ?? 768,
          });
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── OpenAI DALL-E ────────────────────────────────────────────────────────────

async function generateOpenAI(
  prompt: string,
  style: string,
  config: DreamImageConfig,
  outputPath: string,
): Promise<GeneratedImage> {
  const apiKey = config.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  // Strip Midjourney-style params (--ar, --v, etc.) before sending to DALL-E
  const cleaned = (style ? `${prompt}, ${style}` : prompt).replace(/--\w+\s+[\w:\.]+/g, '').trim();

  const { default: https } = await import('https');

  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:   config.model ?? 'dall-e-3',
      prompt:  cleaned,
      n:       1,
      size:    '1792x1024',
      quality: 'standard',
    });

    const req = https.request({
      hostname: 'api.openai.com',
      path:     '/v1/images/generations',
      method:   'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', async () => {
        try {
          const parsed = JSON.parse(data);
          const url: string = parsed.data?.[0]?.url;
          if (!url) return reject(new Error('No image URL in OpenAI response'));
          await downloadUrl(url, outputPath);
          resolve({
            path:    outputPath,
            backend: 'openai',
            prompt:  cleaned,
            width:   1792,
            height:  1024,
          });
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Local (Automatic1111 / ComfyUI) ─────────────────────────────────────────

async function generateLocal(
  prompt: string,
  style: string,
  config: DreamImageConfig,
  outputPath: string,
): Promise<GeneratedImage> {
  const base  = (config.baseUrl ?? 'http://localhost:7860').replace(/\/$/, '');
  const full  = style ? `${prompt}, ${style}` : prompt;
  const w     = config.width  ?? 1024;
  const h     = config.height ?? 768;

  // Automatic1111 txt2img endpoint
  const res = await fetch(`${base}/sdapi/v1/txt2img`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt:          full,
      negative_prompt: 'blurry, low quality, watermark, text',
      width:           w,
      height:          h,
      steps:           20,
      cfg_scale:       7,
    }),
  });

  if (!res.ok) throw new Error(`Local API ${res.status}: ${await res.text()}`);

  const json: { images: string[] } = await res.json() as { images: string[] };
  const b64 = json.images?.[0];
  if (!b64) throw new Error('No image in local API response');

  const buf = Buffer.from(b64, 'base64');
  mkdirSync(join(outputPath, '..'), { recursive: true });
  writeFileSync(outputPath, buf);

  return { path: outputPath, backend: 'local', prompt: full, width: w, height: h };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Generate a single dream image.
 *
 * @param prompt     - The fragment-specific image prompt.
 * @param style      - The global style string for the dream (preset-derived).
 * @param config     - Backend configuration. Defaults to Pollinations (zero config).
 * @param outputPath - Where to save the image file (not used for Pollinations).
 * @param seed       - Optional deterministic seed (Pollinations only).
 */
export async function generateDreamImage(
  prompt: string,
  style: string,
  config: DreamImageConfig = { provider: 'pollinations' },
  outputPath?: string,
  seed?: number,
): Promise<GeneratedImage> {
  const backend = config.provider;

  if (backend === 'none') {
    throw new Error('Image generation is disabled (provider: "none")');
  }

  if (backend === 'pollinations') {
    return generatePollinations(prompt, style, config, outputPath, seed);
  }

  // All other backends need an output path
  const out = outputPath ?? join(process.cwd(), 'dreams', 'images', `dream-${Date.now()}.png`);
  mkdirSync(join(out, '..'), { recursive: true });

  if (backend === 'hf') {
    return generateHuggingFace(prompt, style, config, out);
  }
  if (backend === 'openai') {
    return generateOpenAI(prompt, style, config, out);
  }
  if (backend === 'local') {
    return generateLocal(prompt, style, config, out);
  }

  throw new Error(`Unknown image backend: ${backend}`);
}

/**
 * Build a Pollinations URL from just a preset/style string.
 * Useful for generating cover images in the dream visualization.
 */
export function coverImageUrl(
  insights: string[],
  imageStyle: string,
  config: DreamImageConfig = {},
  seed?: number,
): string {
  const core = insights.slice(0, 2).join('. ');
  return pollinationsUrl(core || 'abstract dream landscape', imageStyle, config, seed);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function downloadUrl(url: string, outputPath: string): Promise<void> {
  const { default: https } = await import('https');
  mkdirSync(join(outputPath, '..'), { recursive: true });

  return new Promise((resolve, reject) => {
    const file = createWriteStream(outputPath);
    https.get(url, res => {
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
    }).on('error', reject);
  });
}
