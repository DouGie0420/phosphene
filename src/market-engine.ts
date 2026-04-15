import {
  formatPct,
  formatPrice,
} from './market-data.js';
import {
  detectFinancialPatterns,
  extractCoreQuestion,
} from './financial-lexicon.js';
import type { FinancialLexiconMatch } from './financial-lexicon.js';
import type { MarketSnapshot } from './market-data.js';
import type { TechnicalAnalysisResult } from './technical-analysis.js';

export interface MarketReading {
  discipline: 'market';
  locale: 'en' | 'zh';
  thesis: string;
  signalStack: string[];
  narrativeVsFlow: string;
  structure: string;
  riskStack: string[];
  invalidation: string;
  nextQuestions: string[];
  disclaimer: string;
}

function detectLocale(text: string): 'en' | 'zh' {
  return /[\u4e00-\u9fff]/.test(text) ? 'zh' : 'en';
}

function summarizeSentiment(match: FinancialLexiconMatch, locale: 'en' | 'zh'): string {
  if (!match.sentimentGrade) {
    return locale === 'zh'
      ? '情绪面没有明确单边，但这本身说明市场还在寻找定价框架。'
      : 'Sentiment is not decisively one-sided yet, which means the market is still searching for its pricing frame.';
  }

  return locale === 'zh'
    ? `情绪分级落在 ${match.sentimentGrade}，说明语言层已经带有方向性。`
    : `The sentiment grade lands at ${match.sentimentGrade}, so the language layer is already directional.`;
}

function narrativeVsFlowFromMatch(match: FinancialLexiconMatch, locale: 'en' | 'zh'): string {
  const labels = match.signals.map(signal => signal.label.toLowerCase());
  const beat = labels.some(label => label.includes('beat'));
  const miss = labels.some(label => label.includes('miss'));
  const raise = labels.some(label => label.includes('raise'));
  const cut = labels.some(label => label.includes('cut'));

  if (locale === 'zh') {
    if (beat && cut) return '标题层偏多，但前瞻层偏空。最危险的情形不是坏消息，而是“好 headline + 坏 guide”。';
    if (miss && raise) return '静态结果偏弱，但未来指引在修复。市场通常会比新闻标题更在乎这个转向。';
    if (match.narratives.length > 0) {
      return `叙事主轴是 ${match.narratives[0]!.label}，但真正要盯的是它何时失去 hidden structure 的支撑。`;
    }
    return '语言叙事和真实资金流未必同步，先分清谁在讲故事，谁在真正定价。';
  }

  if (beat && cut) return 'Headline positive, forward guide negative. The danger is not bad news but good headlines masking weaker forward structure.';
  if (miss && raise) return 'The static result is weaker, but the forward guide is repairing. Markets often care more about that turn than the headline does.';
  if (match.narratives.length > 0) {
    return `The dominant narrative is ${match.narratives[0]!.label}, but the key question is when it loses support from the hidden structure underneath it.`;
  }
  return 'Narrative and flow are rarely identical. First separate who is telling the story from who is actually pricing the asset.';
}

function buildTextThesis(match: FinancialLexiconMatch, locale: 'en' | 'zh'): string {
  const core = extractCoreQuestion(match);

  if (locale === 'zh') {
    if (match.signals.length > 0) {
      return `现在最值得盯的，不是表面新闻，而是这个核心问题: ${core}`;
    }
    if (match.narratives.length > 0) {
      return `这段市场语言已经落入 ${match.narratives[0]!.label} 叙事，真正的 edge 在于识别它什么时候开始失真。`;
    }
    return '当前没有单一强信号，说明你面对的不是结论题，而是一个需要等市场自己暴露偏好的局面。';
  }

  if (match.signals.length > 0) {
    return `The real thing to watch is not the headline but the underlying question it opens: ${core}`;
  }
  if (match.narratives.length > 0) {
    return `This language is already inside the ${match.narratives[0]!.label} narrative. The edge is in spotting when the story starts to misprice reality.`;
  }
  return 'There is no single dominant signal yet, which means this is not a conclusion problem but a waiting-for-revelation problem.';
}

function buildTextStructure(match: FinancialLexiconMatch, locale: 'en' | 'zh'): string {
  const phase = match.dominantPhase ?? (locale === 'zh' ? '未明阶段' : 'unclear phase');
  const dissemination = Math.round(match.disseminationScore * 100);

  return locale === 'zh'
    ? `市场阶段更像 ${phase}。传播度约 ${dissemination}%: 如果扩散过快，后手空间会被压缩；如果扩散不足，价格还没完成信息搬运。`
    : `The structural phase looks closer to ${phase}. Dissemination is about ${dissemination}%: if spread is already broad, upside from the same story compresses; if spread is thin, price may still be carrying the information.`;
}

function buildTextRiskStack(match: FinancialLexiconMatch, locale: 'en' | 'zh'): string[] {
  const risks: string[] = [];

  if (match.signals.some(signal => signal.signalQuality === 'low')) {
    risks.push(locale === 'zh'
      ? '信号质量偏低，说明噪音和叙事污染较重。'
      : 'At least one matched signal is low quality, so noise contamination is high.');
  }
  if (match.disseminationScore > 0.7) {
    risks.push(locale === 'zh'
      ? '传播已经很广，后知后觉资金可能正在成为流动性的提供方。'
      : 'Dissemination is already broad, which means late money may be turning into liquidity for earlier positioning.');
  }
  if (match.narratives.some(narrative => narrative.type === 'contagion' || narrative.type === 'regulatory')) {
    risks.push(locale === 'zh'
      ? '这里的尾部风险不能只看均值，监管与传染型叙事经常用跳空说话。'
      : 'Tail risk matters here. Regulatory and contagion narratives often speak through gaps rather than gradual repricing.');
  }
  if (risks.length === 0) {
    risks.push(locale === 'zh'
      ? '最大的风险是把叙事当成价格，把语言强度误认为资金强度。'
      : 'The main risk is mistaking narrative intensity for actual flow intensity.');
  }

  return risks;
}

function buildTextInvalidation(match: FinancialLexiconMatch, locale: 'en' | 'zh'): string {
  if (locale === 'zh') {
    if (match.signals.length > 0) {
      return `如果后续价格行为不再回应「${match.signals[0]!.label}」所暗示的方向，这个 thesis 就需要立刻降级。`;
    }
    return '如果后续没有价格确认，就不要把这段分析升级成仓位信念。';
  }

  if (match.signals.length > 0) {
    return `If price stops honoring the direction implied by ${match.signals[0]!.label}, downgrade the thesis immediately.`;
  }
  return 'Without price confirmation, this should remain an analytical frame, not a position belief.';
}

function buildTextQuestions(match: FinancialLexiconMatch, locale: 'en' | 'zh'): string[] {
  const questions = [extractCoreQuestion(match)];

  if (match.narratives.length > 0) {
    questions.push(locale === 'zh'
      ? `什么事件会终结 ${match.narratives[0]!.label} 这条叙事？`
      : `What event would actually terminate the ${match.narratives[0]!.label} narrative?`);
  }
  questions.push(locale === 'zh'
    ? '价格是否已经提前走完了这段语言想表达的东西？'
    : 'Has price already moved further than the language implies?');

  return questions.slice(0, 3);
}

export function readMarketText(text: string): MarketReading {
  const locale = detectLocale(text);
  const match = detectFinancialPatterns(text);
  const cryptoContext = /\b(btc|eth|sol|crypto|liquidity|breakout|support|resistance|lower highs|higher lows)\b/i.test(text);
  const signalStack = [
    summarizeSentiment(match, locale),
    ...(match.signals.slice(0, 3).map(signal => `${signal.label}: ${signal.coreQuestion}`)),
  ];

  if (cryptoContext) {
    signalStack.push(locale === 'zh'
      ? '加密结构语境明确，优先把流动性、接受区与杠杆踩踏风险分开看。'
      : 'Crypto-structure context is explicit, so separate liquidity, acceptance, and leverage-risk questions.');
  }

  return {
    discipline: 'market',
    locale,
    thesis: buildTextThesis(match, locale),
    signalStack,
    narrativeVsFlow: narrativeVsFlowFromMatch(match, locale),
    structure: buildTextStructure(match, locale),
    riskStack: buildTextRiskStack(match, locale),
    invalidation: buildTextInvalidation(match, locale),
    nextQuestions: buildTextQuestions(match, locale),
    disclaimer: locale === 'zh'
      ? '这是结构性阅读，不是投资建议。真正确认 thesis 的永远是价格与流动性。'
      : 'This is structural reading, not investment advice. Price and liquidity always get the final vote.',
  };
}

function flowRead(
  snapshot: MarketSnapshot,
  analysis: TechnicalAnalysisResult,
  locale: 'en' | 'zh',
): string {
  const bidTotal = snapshot.orderBook.bids.reduce((sum, level) => sum + level.price * level.qty, 0);
  const askTotal = snapshot.orderBook.asks.reduce((sum, level) => sum + level.price * level.qty, 0);
  const imbalance = bidTotal / Math.max(bidTotal + askTotal, 1);
  const upDay = snapshot.ticker.priceChangePct >= 0;

  if (locale === 'zh') {
    if (upDay && imbalance < 0.45) return '日内价格偏强，但盘口上方供给更厚，说明上涨还在被动承压。';
    if (!upDay && imbalance > 0.55) return '价格偏弱，但买盘开始在近处接货，说明下跌里已经出现响应式承接。';
    if (imbalance > 0.6) return '价格和盘口同向偏多，短线主动权更多在买方。';
    if (imbalance < 0.4) return '价格和盘口同向偏空，短线主动权更多在卖方。';
    return `价格方向与盘口基本一致，当前更像结构整理而不是情绪失控。${analysis.chanLun.currentStructure.split('\n')[0] ?? ''}`;
  }

  if (upDay && imbalance < 0.45) return 'Price is green on the day, but offer-side supply is still heavier overhead. Strength is being absorbed.';
  if (!upDay && imbalance > 0.55) return 'Price is weak, yet nearby bids are responding. Buyers are beginning to absorb the drop.';
  if (imbalance > 0.6) return 'Price and order-book pressure are aligned to the upside. Buyers have more local control.';
  if (imbalance < 0.4) return 'Price and order-book pressure are aligned to the downside. Sellers have more local control.';
  return `Price and local flow are broadly aligned. This looks more like structural consolidation than emotional disorder. ${analysis.chanLun.currentStructure.split('\n')[0] ?? ''}`;
}

export function composeMarketReading(
  snapshot: MarketSnapshot,
  analysis: TechnicalAnalysisResult,
): MarketReading {
  const locale: 'zh' = 'zh';
  const fib = analysis.fibonacci;
  const chan = analysis.chanLun;
  const confirmedBeiChi = chan.beiChiList.filter(item => item.confirmed);
  const latestBsp = chan.buySellPoints.slice(-1)[0] ?? null;

  const signalStack = [
    `24h 变化: ${formatPct(snapshot.ticker.priceChangePct)} @ ${formatPrice(snapshot.ticker.lastPrice)}`,
    fib
      ? `Fibonacci: ${fib.currentZone}`
      : 'Fibonacci: 数据不足，暂不形成回撤结构。',
    `缠论: ${chan.currentStructure.split('\n')[0] ?? chan.currentStructure}`,
  ];

  if (latestBsp) {
    signalStack.push(`最近买卖点: ${latestBsp.type} @ ${formatPrice(latestBsp.price)}`);
  }
  if (confirmedBeiChi.length > 0) {
    signalStack.push(`确认背驰: ${confirmedBeiChi.map(item => item.type).join(' / ')}`);
  }

  const thesis = fib
    ? fib.direction === 'uptrend'
      ? `当前更像上升结构中的位置选择题，而不是纯粹方向题。关键在于价格是否继续接受于 ${fib.nearestSupport?.label ?? '最近支撑'} 之上。`
      : `当前更像下降结构中的反弹质量测试。关键不在反弹有没有，而在反弹能否站上 ${fib.nearestResist?.label ?? '最近压力'}。`
    : '当前结构还不足以给出高级别斐波那契路径，先把它当成局部博弈而不是中期趋势。';

  const riskStack = [
    fib?.nearestSupport
      ? `下方最近支撑在 ${fib.nearestSupport.label} @ ${formatPrice(fib.nearestSupport.price)}`
      : '缺少清晰支撑定位，说明波段结构还不够干净。',
    fib?.nearestResist
      ? `上方最近压力在 ${fib.nearestResist.label} @ ${formatPrice(fib.nearestResist.price)}`
      : '价格已处于延伸区，上方参照减少但回撤风险增大。',
    confirmedBeiChi.length > 0
      ? `存在确认背驰 (${confirmedBeiChi.map(item => item.type).join(' / ')})，趋势延续性要打折。`
      : '暂无确认背驰，说明趋势衰减证据还不充分。',
  ];

  return {
    discipline: 'market',
    locale,
    thesis,
    signalStack,
    narrativeVsFlow: flowRead(snapshot, analysis, locale),
    structure: chan.currentStructure,
    riskStack,
    invalidation: fib
      ? fib.direction === 'uptrend'
        ? `若价格有效跌破 ${fib.nearestSupport?.label ?? '最近支撑'}，当前偏多结构需要撤销。`
        : `若价格有效站回 ${fib.nearestResist?.label ?? '最近压力'} 之上，当前偏空结构需要撤销。`
      : '若后续走势继续无结构地来回穿越最近区间，本轮 thesis 需要降级为观望。',
    nextQuestions: [
      fib?.nearestResist
        ? `价格能否在 ${fib.nearestResist.label} 附近完成接受，而不是只打一根影线？`
        : '下一段价格推进会不会第一次给出明确的接受区？',
      latestBsp
        ? `最近的 ${latestBsp.type} 会被延续还是被反向吞没？`
        : '下一次分型与笔是否会给出新的买卖点？',
      '盘口失衡是持续性的，还是仅仅停留在局部深度里？',
    ],
    disclaimer: '以上为市场结构阅读，不构成任何投资建议。仓位决策必须独立管理风险。',
  };
}

export function renderMarketReading(reading: MarketReading): string {
  const header = reading.locale === 'zh' ? '【Phosphene Market Read】' : '[Phosphene Market Read]';
  const lines = [
    header,
    `${reading.locale === 'zh' ? '主判断' : 'Thesis'}: ${reading.thesis}`,
    `${reading.locale === 'zh' ? '信号栈' : 'Signal stack'}: ${reading.signalStack.join(' / ')}`,
    `${reading.locale === 'zh' ? '叙事与资金流' : 'Narrative vs flow'}: ${reading.narrativeVsFlow}`,
    `${reading.locale === 'zh' ? '结构' : 'Structure'}: ${reading.structure.replace(/\n/g, ' ')}`,
    `${reading.locale === 'zh' ? '风险栈' : 'Risk stack'}: ${reading.riskStack.join(' / ')}`,
    `${reading.locale === 'zh' ? '失效条件' : 'Invalidation'}: ${reading.invalidation}`,
    `${reading.locale === 'zh' ? '接下来该问' : 'Next questions'}: ${reading.nextQuestions.join(' / ')}`,
    `${reading.locale === 'zh' ? '说明' : 'Note'}: ${reading.disclaimer}`,
  ];

  return lines.join('\n');
}
