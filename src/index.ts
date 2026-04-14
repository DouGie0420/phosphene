// Phosphene — public barrel
// Everything you need from one import.

export type {
  Intensity,
  PresetName,
  PerceptionLayer,
  PerceptionMetrics,
  PerceptionDiff,
  SynesthesiaConfig,
  SynesthesiaLayer,
  ApopheniaConfig,
  ApopheniaLayer,
  ChronostasisConfig,
  ChronostasisLayer,
  SemioticsConfig,
  SemioticsLayer,
  VoiceName,
  HarmonyMode,
  VoiceDefinition,
  ChorusConfig,
  ChorusLayer,
  PhospheneState,
  PhosphenePreset,
  PhospheneContext,
  PerceptionOutput,
  EmergenceEffect,
  PhospheneEventType,
  PhospheneEvent,
  // Evolution types
  FeedbackSignalType,
  FeedbackSignal,
  SessionRecord,
  EmergentVoice,
  EvolutionProposal,
  OptimalPoint,
  EvolutionState,
} from './types.js';

export type { PersonalPresetBundle } from './phosphene.js';

export type {
  DesignColorSystem,
  ColorSystemPalette,
  CrossSystemNote,
  DesignVocabularyMatch,
  TemperatureProfile,
  SaturationProfile,
  DesignToken,
  DesignTokenSet,
} from './design-color-lexicon.js';
export {
  detectDesignVocabulary,
  primaryDesignSystem,
  generateDesignTokens,
  getSystemPalette,
  suggestDesignSystem,
  DESIGN_STANDARDS,
} from './design-color-lexicon.js';

export {
  // Core perception
  applyPreset,
  adjustLayer,
  addVoice,
  removeVoice,
  perceive,
  getContext,
  getPreset,
  listPresets,
  reset,
  describeState,
  applySubstanceSignature,
  blend,
  compare,
  // Evolution
  initEvolution,
  signal,
  crystallize,
  anchor,
  endSession,
  getEvolutionAnalysis,
  getEvolution,
  acceptProposal,
  describeEvolutionState,
  saveAsPersonalPreset,
  removePersonalPreset,
  applyPersonalPreset,
  listPersonalPresets,
  exportPersonalPresets,
  importPersonalPresets,
  confirmVoice,
  // State stack
  pushState,
  popState,
  hasStackedState,
  // Resistance mode
  toggleResistance,
  isResistanceActive,
} from './phosphene.js';

export { PRESETS } from './presets.js';

export {
  loadState,
  saveState,
  markAwakened,
  persistPreset,
  persistVoices,
  recordOffering,
  resetState,
  describePersistedState,
  persistEvolution,
  loadEvolution,
} from './state.js';
export type { PhosphenePersistedState } from './state.js';

export {
  DEFAULT_EVOLUTION,
  analyzeSignals,
  describeEvolution,
} from './evolution.js';

export type {
  DreamRecord,
  DreamStage,
  DreamFragment,
  DreamSeed,
  DreamLogic,
  DreamImageConfig,
} from './types.js';

export {
  resolveDreamsDir,
  generateDream,
  renderDream,
  saveDream,
  loadDreams,
  loadLatestDream,
  generateDreamImages,
  attachPollinationsUrls,
  describeDream,
} from './dreams.js';

export type { GeneratedImage } from './image-gen.js';
export {
  pollinationsUrl,
  coverImageUrl,
  generateDreamImage,
} from './image-gen.js';

export { applySynesthesia }  from './synesthesia.js';
export { applyApophenia }    from './apophenia.js';
export { applyChronostasis } from './chronostasis.js';
export { applySemiotics }    from './semiotics.js';
export { applyChorus }       from './chorus.js';

export type {
  Kline,
  Ticker24h,
  OrderBookLevel,
  OrderBook,
  KlineInterval,
  MarketSnapshot,
} from './market-data.js';
export {
  fetchKlines,
  fetchTicker,
  fetchOrderBook,
  fetchMarketSnapshot,
  formatPrice,
  formatPct,
} from './market-data.js';

export type {
  PriceLevel,
  SwingPoint,
  FibLevel,
  FibonacciResult,
  ProcessedCandle,
  Fractal,
  Bi,
  Hub,
  BeiChi,
  BuySellPoint,
  ChanResult,
  TechnicalAnalysisResult,
  FractalType,
  BiDirection,
  HubType,
  BeiChiType,
  BSP,
} from './technical-analysis.js';
export {
  processInclusionRelationships,
  detectFractals,
  detectBi,
  detectHubs,
  calculateMACD,
  detectBeiChi,
  classifyBuySellPoints,
  runChanLun,
  calculateFibonacci,
  analyzeTechnicals,
} from './technical-analysis.js';

export type {
  FinancialSentimentGrade,
  MarketPhase,
  SignalSource,
  FinancialNarrativeType,
  FinancialEntityType,
  FinancialSignalPattern,
  MarketNarrative,
  FinancialLexiconMatch,
} from './financial-lexicon.js';
export {
  detectFinancialPatterns,
  hasFinancialContent,
  extractCoreQuestion,
  describeFinancialMatch,
  SIGNAL_PATTERNS,
  MARKET_NARRATIVES,
} from './financial-lexicon.js';
