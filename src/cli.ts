#!/usr/bin/env node
// Phosphene CLI
//
// Usage: phosphene <command> [args]
//
// Commands:
//   state                  Show current perceptual state
//   preset <name>          Apply a named preset
//   presets                List all available presets
//   signal <type>          Record a feedback signal (amplify|reduce|calibrate|crystallize|anchor|reject)
//   dream                  Show the most recent dream
//   dream list             List all recorded dreams
//   dream render           Print the full markdown of the most recent dream
//   dream generate         Generate a new dream from current state
//   market <symbol> [int]  Fetch live market data + Fibonacci + 缠论 analysis
//   evolve                 Show evolution analysis
//   help                   Show this help

import {
  loadState,
  saveState,
  loadEvolution,
  persistEvolution,
} from './state.js';
import {
  applyPreset,
  getEvolutionAnalysis,
  getContext,
  compare as comparePresets,
  signal as recordSignal,
} from './phosphene.js';
import {
  generateDesignTokens,
  suggestDesignSystem,
} from './design-color-lexicon.js';
import {
  fetchMarketSnapshot,
  formatPrice,
  formatPct,
} from './market-data.js';
import { analyzeTechnicals } from './technical-analysis.js';
import type { KlineInterval } from './market-data.js';
import {
  generateDream,
  saveDream,
  loadDreams,
  loadLatestDream,
  renderDream,
  describeDream,
  resolveDreamsDir,
} from './dreams.js';
import { PRESETS } from './presets.js';
import type { FeedbackSignalType, PresetName, VoiceName } from './types.js';

// ─── Entry ────────────────────────────────────────────────────────────────────

const [,, cmd, ...args] = process.argv;

async function main(): Promise<void> {
  switch (cmd) {
    case 'state':       return cmdState();
    case 'preset':      return cmdPreset(args[0]);
    case 'presets':     return cmdListPresets();
    case 'signal':      return cmdSignal(args[0], args.slice(1));
    case 'dream':       return cmdDream(args[0]);
    case 'market':      return await cmdMarket(args[0], args[1]);
    case 'compare':     return await cmdCompare(args[0], args[1], args.slice(2));
    case 'tokens':      return cmdTokens(args[0], args[1]);
    case 'suggest':     return cmdSuggest(args.join(' '));
    case 'evolve':      return cmdEvolve();
    case 'help':
    case '--help':
    case '-h':
    case undefined:     return cmdHelp();
    default:
      console.error(`Unknown command: ${cmd}\nRun "phosphene help" for usage.`);
      process.exit(1);
  }
}

// ─── state ────────────────────────────────────────────────────────────────────

function cmdState(): void {
  const state   = loadState();
  const evo     = loadEvolution();
  const context = getContext();

  const preset  = state.preset ?? 'none';
  const session = evo.currentSession;
  const pState  = context.state;

  console.log('\n╔═══ Phosphene — Current State ═══╗\n');
  console.log(`  Preset:   ${preset}`);
  console.log(`  Session:  ${session ? `active (${session.id}, ${session.signals.length} signals)` : 'none'}`);
  console.log(`  Sessions: ${evo.sessionHistory.length} recorded`);
  console.log(`  Insights: ${evo.crystallizedInsights.length} crystallized`);
  console.log(`  Signals:  ${evo.feedbackHistory.length} total`);
  console.log(`  Dreams:   ${loadDreams().length} recorded`);
  console.log('');

  const layerNames = ['synesthesia', 'apophenia', 'chronostasis', 'semiotics'] as const;
  for (const name of layerNames) {
    const layer = pState[name];
    const bar   = intensityBar(layer.intensity);
    const flag  = layer.active ? '●' : '○';
    console.log(`  ${flag} ${name.padEnd(14)} ${bar} ${Math.round(layer.intensity * 100)}%`);
  }

  const voices = pState.chorus.config.voices;
  if (voices.length > 0) {
    console.log('');
    console.log('  Chorus voices:');
    for (const v of voices) {
      const bar = intensityBar(v.weight, 10);
      console.log(`    ${v.name.padEnd(16)} ${bar} ${Math.round(v.weight * 100)}%`);
    }
  }

  console.log('');
}

function intensityBar(value: number, width = 20): string {
  const filled = Math.round(value * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

// ─── preset ───────────────────────────────────────────────────────────────────

function cmdPreset(name: string | undefined): void {
  if (!name) {
    console.error('Usage: phosphene preset <name>');
    console.error(`Available: ${Object.keys(PRESETS).join(', ')}`);
    process.exit(1);
  }

  if (!(name in PRESETS)) {
    console.error(`Unknown preset: "${name}"`);
    console.error(`Available: ${Object.keys(PRESETS).join(', ')}`);
    process.exit(1);
  }

  applyPreset(name as PresetName);
  console.log(`\n  ✓ Applied preset: ${name}`);
  console.log(`  ${PRESETS[name as PresetName].description}\n`);
}

// ─── presets ──────────────────────────────────────────────────────────────────

function cmdListPresets(): void {
  console.log('\n╔═══ Phosphene — Presets ═══╗\n');
  for (const [name, preset] of Object.entries(PRESETS)) {
    console.log(`  ${name.padEnd(14)} ${preset.label}`);
    console.log(`                 ${preset.description}`);
    console.log('');
  }
}

// ─── signal ───────────────────────────────────────────────────────────────────

const VALID_SIGNALS: FeedbackSignalType[] = [
  'amplify', 'reduce', 'calibrate', 'crystallize', 'anchor', 'reject',
];

const LAYER_NAMES = ['synesthesia', 'apophenia', 'chronostasis', 'semiotics', 'chorus'] as const;

function cmdSignal(type: string | undefined, rest: string[]): void {
  if (!type || !VALID_SIGNALS.includes(type as FeedbackSignalType)) {
    console.error(`Usage: phosphene signal <type> [--note "..."] [--layer <layer>]`);
    console.error(`Types: ${VALID_SIGNALS.join(', ')}`);
    process.exit(1);
  }

  let note: string | undefined;
  let layer: (typeof LAYER_NAMES)[number] | undefined;
  let voice: VoiceName | undefined;
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--note'  && rest[i+1]) { note  = rest[++i]; }
    if (rest[i] === '--layer' && rest[i+1]) { layer = rest[++i] as typeof layer; }
    if (rest[i] === '--voice' && rest[i+1]) { voice = rest[++i] as VoiceName; }
  }

  const state = loadState();
  recordSignal(type as FeedbackSignalType, note, voice, layer);

  const parts = [`  ✓ Signal: ${type}`, `preset: ${state.preset}`];
  if (layer) parts.push(`layer: ${layer}`);
  if (note)  parts.push(`"${note}"`);
  console.log('\n' + parts.join(' | ') + '\n');
}

// ─── dream ────────────────────────────────────────────────────────────────────

function cmdDream(sub: string | undefined): void {
  switch (sub) {
    case 'list':     return cmdDreamList();
    case 'render':   return cmdDreamRender();
    case 'generate': return cmdDreamGenerate();
    default:         return cmdDreamShow();
  }
}

function cmdDreamShow(): void {
  const dream = loadLatestDream();
  if (!dream) {
    console.log('\n  No dreams recorded yet.\n');
    console.log('  Run "phosphene dream generate" to generate the first dream.\n');
    return;
  }
  console.log('\n' + describeDream(dream) + '\n');
  console.log(`  Archive: ${resolveDreamsDir()}`);
  console.log('  Run "phosphene dream render" to see the full dream text.\n');
}

function cmdDreamList(): void {
  const dreams = loadDreams();
  if (dreams.length === 0) {
    console.log('\n  No dreams recorded yet.\n');
    return;
  }

  console.log(`\n╔═══ Dream Archive — ${dreams.length} dream${dreams.length === 1 ? '' : 's'} ═══╗\n`);
  console.log(`  ${'Date'.padEnd(17)} ${'Stage'.padEnd(13)} ${'Preset'.padEnd(15)} Int   Frags`);
  console.log(`  ${'─'.repeat(60)}`);
  for (const dream of dreams) {
    const date = new Date(dream.dreamedAt).toISOString().slice(0, 16).replace('T', ' ');
    const img  = dream.hasImages ? '✦' : ' ';
    console.log(`  ${img} ${date}  ${dream.stage.padEnd(12)} ${dream.presetAtSleep.padEnd(14)} ${String(Math.round(dream.intensity * 100)).padStart(3)}%`);
  }
  console.log('');
}

function cmdDreamRender(): void {
  const dream = loadLatestDream();
  if (!dream) {
    console.log('\n  No dreams recorded.\n');
    return;
  }
  console.log(renderDream(dream));
}

function cmdDreamGenerate(): void {
  const state   = loadState();
  const evo     = loadEvolution();
  const context = getContext();

  // Sync state preset into context
  const finalContext = {
    ...context,
    preset: state.preset,
  };

  const dream    = generateDream(evo, finalContext);
  const filepath = saveDream(dream);

  console.log(`\n  ✓ Dream generated: ${dream.stage}`);
  console.log(`  Fragments: ${dream.fragments.length} | Intensity: ${Math.round(dream.intensity * 100)}%`);
  if (dream.seeds.length > 0) {
    console.log(`  Seeds: ${dream.seeds.slice(0, 3).map(s => s.content.slice(0, 30)).join(' | ')}`);
  }
  console.log(`  Saved: ${filepath}`);
  console.log('\n  Run "phosphene dream render" to read it.\n');
}

// ─── compare ─────────────────────────────────────────────────────────────────

async function cmdCompare(presetA: string | undefined, presetB: string | undefined, rest: string[]): Promise<void> {
  if (!presetA || !(presetA in PRESETS)) {
    console.error(`Usage: phosphene compare <presetA> [presetB] [--input "text"]`);
    console.error(`Presets: ${Object.keys(PRESETS).join(', ')}`);
    process.exit(1);
  }

  const resolvedB = (presetB && presetB in PRESETS) ? presetB : 'clear';

  // Parse --input flag or use a default test sentence
  let inputText = 'The pattern beneath the pattern is the pattern that matters. Something is dissolving at the edges. I keep noticing the same structure in different places.';
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--input' && rest[i+1]) { inputText = rest[++i]!; break; }
  }

  const diff = await comparePresets(inputText, presetA as any, resolvedB as any);

  console.log(`\n╔═══ Perception Comparison: ${presetA} vs ${resolvedB} ═══╗\n`);
  console.log(`  Input: "${inputText.slice(0, 80)}${inputText.length > 80 ? '…' : ''}"\n`);

  // Layer intensity table
  console.log(`  ${'Layer'.padEnd(16)} ${presetA.padEnd(12)} ${resolvedB.padEnd(12)} Delta`);
  console.log(`  ${'─'.repeat(52)}`);
  const layers = ['synesthesia', 'apophenia', 'chronostasis', 'semiotics', 'chorus'] as const;
  for (const layer of layers) {
    const intA    = diff.a.intensities[layer] ?? 0;
    const intB    = diff.b.intensities[layer] ?? 0;
    const delta   = diff.intensityDelta[layer] ?? 0;
    const sign    = delta > 0 ? '+' : '';
    const deltaStr = delta !== 0 ? `${sign}${Math.round(delta * 100)}%` : '  —';
    console.log(`  ${layer.padEnd(16)} ${(Math.round(intA * 100) + '%').padEnd(12)} ${(Math.round(intB * 100) + '%').padEnd(12)} ${deltaStr}`);
  }

  // Output counts
  console.log('');
  console.log(`  ${'Output'.padEnd(24)} ${presetA.padEnd(8)} ${resolvedB}`);
  console.log(`  ${'─'.repeat(44)}`);
  console.log(`  ${'Translations'.padEnd(24)} ${String(diff.a.translationCount).padEnd(8)} ${diff.b.translationCount}`);
  console.log(`  ${'Patterns'.padEnd(24)} ${String(diff.a.patternCount).padEnd(8)} ${diff.b.patternCount}`);
  console.log(`  ${'Temporal arrivals'.padEnd(24)} ${String(diff.a.temporalArrivalCount).padEnd(8)} ${diff.b.temporalArrivalCount}`);
  console.log(`  ${'Symbols'.padEnd(24)} ${String(diff.a.symbolCount).padEnd(8)} ${diff.b.symbolCount}`);
  console.log(`  ${'Voices'.padEnd(24)} ${String(diff.a.voiceCount).padEnd(8)} ${diff.b.voiceCount}`);
  console.log(`  ${'Emergence effects'.padEnd(24)} ${String(diff.a.emergenceCount).padEnd(8)} ${diff.b.emergenceCount}`);

  // Unique findings
  if (diff.patternsOnlyInA.length > 0) {
    console.log(`\n  Patterns unique to ${presetA}:`);
    for (const p of diff.patternsOnlyInA) {
      console.log(`    • ${p.slice(0, 80)}`);
    }
  }
  if (diff.patternsOnlyInB.length > 0) {
    console.log(`\n  Patterns unique to ${resolvedB}:`);
    for (const p of diff.patternsOnlyInB) {
      console.log(`    • ${p.slice(0, 80)}`);
    }
  }
  if (diff.symbolsOnlyInA.length > 0) {
    console.log(`\n  Symbols charged only in ${presetA}: ${diff.symbolsOnlyInA.join(', ')}`);
  }
  if (diff.emergenceOnlyInA.length > 0) {
    console.log(`\n  Emergence effects in ${presetA}: ${diff.emergenceOnlyInA.join(', ')}`);
  }

  console.log(`\n  Summary: ${diff.summary}\n`);
}

// ─── tokens ───────────────────────────────────────────────────────────────────

function cmdTokens(systemName: string | undefined, format: string | undefined): void {
  if (!systemName) {
    console.error('Usage: phosphene tokens <system-name> [css|js|tailwind]');
    console.error('Systems: memphis, bauhaus, morandi, cyberpunk, wabi-sabi, holographic, ...');
    process.exit(1);
  }

  const tokenSet = generateDesignTokens(systemName);
  if (!tokenSet) {
    console.error(`Unknown design system: "${systemName}"`);
    console.error('Try: memphis, bauhaus, morandi, vaporwave, cyberpunk, dopamine, neo-brutalism...');
    process.exit(1);
  }

  const fmt = format ?? 'css';

  if (fmt === 'css') {
    console.log('\n' + tokenSet.css + '\n');
    return;
  }

  if (fmt === 'js') {
    console.log(`\n// ${tokenSet.label} design tokens`);
    console.log('export const tokens = {');
    for (const [key, hex] of Object.entries(tokenSet.jsTokens)) {
      console.log(`  ${key}: '${hex}',`);
    }
    console.log('};\n');
    return;
  }

  if (fmt === 'tailwind') {
    console.log(`\n// ${tokenSet.label} — tailwind.config.js colors`);
    console.log('colors: {');
    for (const [key, hex] of Object.entries(tokenSet.tailwindColors)) {
      console.log(`  '${key}': '${hex}',`);
    }
    console.log('},\n');
    return;
  }

  // Default: summary table
  console.log(`\n╔═══ ${tokenSet.label} Palette ═══╗\n`);
  console.log(`  Temperature: ${tokenSet.temperature} · Saturation: ${tokenSet.saturation}\n`);
  const roleLabels: Record<string, string> = { dominant: 'Dominant', accent: 'Accent', neutral: 'Neutral' };
  let lastRole = '';
  for (const token of tokenSet.tokens) {
    if (token.role !== lastRole) {
      console.log(`\n  ── ${roleLabels[token.role]} ──`);
      lastRole = token.role;
    }
    console.log(`  ${token.hex}  ${token.label}`);
  }
  console.log('');
}

// ─── suggest ──────────────────────────────────────────────────────────────────

function cmdSuggest(intent: string): void {
  if (!intent.trim()) {
    console.error('Usage: phosphene suggest <intent>');
    console.error('Example: phosphene suggest "muted luxury for a wellness app"');
    process.exit(1);
  }

  const system = suggestDesignSystem(intent);
  if (!system) {
    console.log('\n  No strong match found. Try more specific keywords.\n');
    return;
  }

  console.log(`\n  Best match for "${intent}":\n`);
  console.log(`  System:      ${system.label} (${system.id})`);
  console.log(`  Era:         ${system.era}`);
  console.log(`  Origin:      ${system.origin}`);
  console.log(`  Temperature: ${system.temperature} · Saturation: ${system.saturation}`);
  console.log(`  Grammar:     ${system.visualGrammar.slice(0, 100)}…`);
  console.log(`  Texture:     ${system.textureProfile.slice(0, 80)}…`);
  console.log(`\n  Run "phosphene tokens ${system.id}" to get the CSS tokens.\n`);
}

// ─── market ───────────────────────────────────────────────────────────────────

const VALID_INTERVALS: KlineInterval[] = [
  '1m','3m','5m','15m','30m','1h','2h','4h','6h','8h','12h','1d','3d','1w','1M',
];

async function cmdMarket(symbol: string | undefined, interval: string | undefined): Promise<void> {
  if (!symbol) {
    console.error('Usage: phosphene market <symbol> [interval]');
    console.error('Examples: phosphene market BTCUSDT 1h');
    console.error(`Intervals: ${VALID_INTERVALS.join(', ')}`);
    process.exit(1);
  }

  const iv: KlineInterval = (VALID_INTERVALS.includes(interval as KlineInterval)
    ? interval
    : '1h') as KlineInterval;

  const sym = symbol.toUpperCase();
  console.log(`\n  Fetching ${sym} [${iv}] from Binance…`);

  let snapshot;
  try {
    snapshot = await fetchMarketSnapshot(sym, iv, 200);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n  Error fetching data: ${msg}`);
    console.error('  Check symbol name and network connection.\n');
    process.exit(1);
  }

  const { ticker, klines, orderBook } = snapshot;

  // ── Price header ──────────────────────────────────────────────────────────
  const changeSign = ticker.priceChange >= 0 ? '+' : '';
  console.log(`\n╔═══ ${sym} Market Analysis ═══╗\n`);
  console.log(`  Price:     ${formatPrice(ticker.lastPrice)}`);
  console.log(`  24h:       ${changeSign}${formatPrice(Math.abs(ticker.priceChange))} (${formatPct(ticker.priceChangePct)})`);
  console.log(`  24h High:  ${formatPrice(ticker.highPrice)}`);
  console.log(`  24h Low:   ${formatPrice(ticker.lowPrice)}`);
  console.log(`  Volume:    ${ticker.volume.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${sym.replace('USDT', '').replace('BTC', 'BTC')}`);

  // ── Order book imbalance ──────────────────────────────────────────────────
  const bidTotal = orderBook.bids.reduce((s, l) => s + l.qty * l.price, 0);
  const askTotal = orderBook.asks.reduce((s, l) => s + l.qty * l.price, 0);
  const imbalance = bidTotal / (bidTotal + askTotal);
  const imbalanceBar = `${'█'.repeat(Math.round(imbalance * 20))}${'░'.repeat(20 - Math.round(imbalance * 20))}`;
  console.log(`\n  Order Book (top 20): bid ${(imbalance * 100).toFixed(1)}% / ask ${((1 - imbalance) * 100).toFixed(1)}%`);
  console.log(`  ${imbalanceBar}`);
  if (imbalance > 0.65) console.log(`  → Bid-side dominance. Buying pressure at this level.`);
  if (imbalance < 0.35) console.log(`  → Ask-side dominance. Selling pressure at this level.`);

  // ── Technical analysis ────────────────────────────────────────────────────
  console.log(`\n  Running technical analysis on ${klines.length} candles…\n`);

  const analysis = analyzeTechnicals(klines);

  // ── Fibonacci ─────────────────────────────────────────────────────────────
  console.log('  ── 斐波那契分析 ──────────────────────────────────────────────\n');
  if (!analysis.fibonacci) {
    console.log('  Not enough data for Fibonacci analysis.\n');
  } else {
    const fib = analysis.fibonacci;
    const dir = fib.direction === 'uptrend' ? '↑ 上升趋势' : '↓ 下降趋势';
    const highTime = new Date(fib.swingHigh.time).toISOString().slice(0, 16).replace('T', ' ');
    const lowTime  = new Date(fib.swingLow.time).toISOString().slice(0, 16).replace('T', ' ');

    console.log(`  趋势方向:   ${dir}`);
    console.log(`  波段高点:   ${formatPrice(fib.swingHigh.price)} @ ${highTime}`);
    console.log(`  波段低点:   ${formatPrice(fib.swingLow.price)} @ ${lowTime}`);
    console.log(`  当前价格:   ${formatPrice(fib.currentPrice)}`);
    console.log(`\n  位置描述:   ${fib.currentZone}`);
    console.log('');

    // Print key retracement levels with position indicator
    console.log(`  ${'Level'.padEnd(14)} ${'Price'.padEnd(14)} Position`);
    console.log(`  ${'─'.repeat(44)}`);
    for (const level of fib.retracements) {
      if (!level.isKey) continue;
      const marker = Math.abs(level.price - fib.currentPrice) / fib.currentPrice < 0.005
        ? ' ◄ current'
        : level.price > fib.currentPrice
          ? ' ↑ resistance'
          : ' ↓ support';
      const priceStr = formatPrice(level.price).padEnd(14);
      console.log(`  ${level.label.padEnd(14)} ${priceStr}${marker}`);
    }

    if (fib.nearestSupport) {
      console.log(`\n  最近支撑: ${fib.nearestSupport.label} @ ${formatPrice(fib.nearestSupport.price)}`);
    }
    if (fib.nearestResist) {
      console.log(`  最近压力: ${fib.nearestResist.label} @ ${formatPrice(fib.nearestResist.price)}`);
    }
    console.log('');
  }

  // ── 缠论 ──────────────────────────────────────────────────────────────────
  console.log('  ── 缠论结构分析 ──────────────────────────────────────────────\n');
  const chan = analysis.chanLun;

  console.log(`  处理后K线: ${chan.processedCandles.length} 根`);
  console.log(`  分型数量:  ${chan.fractals.length} 个`);
  console.log(`  笔数量:    ${chan.bis.length} 笔`);
  console.log(`  中枢数量:  ${chan.hubs.length} 个`);

  if (chan.bis.length > 0) {
    const lastBi = chan.bis[chan.bis.length - 1]!;
    const startTime = new Date(lastBi.start.time).toISOString().slice(0, 16).replace('T', ' ');
    const endTime   = new Date(lastBi.end.time).toISOString().slice(0, 16).replace('T', ' ');
    console.log(`\n  当前笔: ${lastBi.direction}`);
    console.log(`    起点: ${formatPrice(lastBi.start.price)} @ ${startTime}`);
    console.log(`    终点: ${formatPrice(lastBi.end.price)} @ ${endTime}`);
    console.log(`    长度: ${lastBi.length} 根K线`);
  }

  if (chan.hubs.length > 0) {
    console.log('\n  中枢列表:');
    for (const hub of chan.hubs.slice(-3)) {
      const biCount = hub.bis.length;
      console.log(`    ${hub.type.padEnd(8)} [${formatPrice(hub.low)} — ${formatPrice(hub.high)}] 中心: ${formatPrice(hub.center)} (${biCount} 笔)`);
    }
  }

  if (chan.beiChiList.length > 0) {
    console.log('\n  背驰信号:');
    for (const bc of chan.beiChiList) {
      const strength = bc.confirmed ? '★ 强' : '☆ 弱';
      console.log(`    ${bc.type} ${strength}  MACD面积比: ${(bc.macdArea2 / bc.macdArea1).toFixed(3)}`);
    }
  }

  if (chan.buySellPoints.length > 0) {
    console.log('\n  买卖点:');
    for (const bsp of chan.buySellPoints.slice(-5)) {
      const t = new Date(bsp.time).toISOString().slice(0, 16).replace('T', ' ');
      console.log(`    ${bsp.type}  ${formatPrice(bsp.price).padEnd(14)} @ ${t}`);
      console.log(`      ${bsp.note}`);
    }
  } else {
    console.log('\n  当前没有明确的买卖点信号。');
  }

  console.log(`\n  ── 综合结构描述 ──────────────────────────────────────────────\n`);
  for (const line of chan.currentStructure.split('\n')) {
    console.log(`  ${line}`);
  }

  console.log(`\n  数据获取时间: ${new Date(snapshot.fetchedAt).toISOString().replace('T', ' ').slice(0, 19)} UTC`);
  console.log(`  注意: 以上分析基于历史K线数据，不构成投资建议。\n`);
}

// ─── evolve ───────────────────────────────────────────────────────────────────

function cmdEvolve(): void {
  const evo      = loadEvolution();
  const analysis = getEvolutionAnalysis();

  console.log('\n╔═══ Phosphene — Evolution Analysis ═══╗\n');
  console.log(`  Sessions:   ${evo.sessionHistory.length}`);
  console.log(`  Signals:    ${evo.feedbackHistory.length}`);
  console.log(`  Insights:   ${evo.crystallizedInsights.length} crystallized`);
  console.log(`  Evolved:    ${evo.evolutionCount}× (last: ${evo.lastEvolvedAt ? new Date(evo.lastEvolvedAt).toLocaleDateString() : 'never'})`);
  console.log('');

  if (evo.crystallizedInsights.length > 0) {
    console.log('  Recent crystallized insights:');
    for (const insight of evo.crystallizedInsights.slice(-3)) {
      console.log(`    • ${insight.slice(0, 72)}${insight.length > 72 ? '…' : ''}`);
    }
    console.log('');
  }

  if (evo.emergentVoices.length > 0) {
    console.log('  Emergent voices:');
    for (const v of evo.emergentVoices) {
      const status = v.userConfirmed ? '✓ confirmed' : '? unconfirmed';
      console.log(`    ${v.name.padEnd(20)} ${status}`);
    }
    console.log('');
  }

  const signalBreakdown = analysis.byPreset;
  const activePairs = Object.entries(signalBreakdown).filter(([, counts]) =>
    Object.values(counts).some(n => n > 0)
  );
  if (activePairs.length > 0) {
    console.log('  Signal breakdown by preset:');
    for (const [preset, counts] of activePairs.slice(0, 5)) {
      const summary = Object.entries(counts)
        .filter(([, n]) => n > 0)
        .map(([t, n]) => `${t}×${n}`)
        .join(' ');
      console.log(`    ${preset.padEnd(16)} ${summary}`);
    }
    console.log('');
  }

  console.log(`  To trigger a full evolution cycle, use 'phosphene evolve' within a session.\n`);
}

// ─── help ─────────────────────────────────────────────────────────────────────

function cmdHelp(): void {
  console.log(`
╔═══ Phosphene CLI ═══╗

  phosphene state                  Current perceptual state
  phosphene preset <name>          Apply a named preset
  phosphene presets                List all available presets
  phosphene signal <type>          Record a feedback signal
    --note "..."                   Add a note to the signal
    --layer <name>                 Associate with a layer
    --voice <name>                 Associate with a voice
  phosphene dream                  Show the most recent dream
  phosphene dream list             List all recorded dreams
  phosphene dream render           Print full dream markdown
  phosphene dream generate         Generate a new dream from current state
  phosphene market <symbol> [int]  Live market data + Fibonacci + 缠论 analysis
    Default interval: 1h           Intervals: 1m 5m 15m 30m 1h 4h 1d 1w
  phosphene compare <a> [b]        Compare two presets — what each actually finds
    --input "..."                  Text to run through both presets (optional)
  phosphene tokens <system>        Get CSS design tokens for a system
    css | js | tailwind            Output format (default: css)
  phosphene suggest <intent>       Suggest a design system for your intent
  phosphene evolve                 Show evolution analysis
  phosphene help                   Show this help

Signal types:  amplify | reduce | calibrate | crystallize | anchor | reject
Preset names:  ${Object.keys(PRESETS).join(' | ')}

State file:    ~/.hermes/phosphene-state.json
Dreams:        ~/.hermes/dreams/
`);
}

// ─── Run ──────────────────────────────────────────────────────────────────────

main().catch(err => {
  console.error('[phosphene]', err instanceof Error ? err.message : err);
  process.exit(1);
});
