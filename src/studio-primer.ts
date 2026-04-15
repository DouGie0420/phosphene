import { buildFieldLaws } from './field-laws.js';
import { buildResponseScaffold } from './response-scaffold.js';
import type {
  RitualLocale,
  RitualProposal,
  SessionStage,
  StudioPrimer,
} from './types.js';

export function buildStudioPrimer(
  proposal: RitualProposal | null | undefined,
  locale: RitualLocale,
  stage: SessionStage,
  options: { input?: string } = {},
): StudioPrimer | undefined {
  if (!proposal) return undefined;

  const scaffold = buildResponseScaffold(proposal, locale, stage, { input: options.input });
  const laws = buildFieldLaws(proposal, locale);
  if (!scaffold || !laws) return undefined;

  const spotlight = proposal.spotlightPreview;
  const threshold = stage === 'threshold';
  const hasContradictionSection = Boolean(scaffold.sections.find(section =>
    section.label === 'Human contradiction' || section.label === '人类矛盾'
  ));

  if (locale === 'zh') {
    const payload = spotlight
      ? `把这条判断线带进开场: ${spotlight}`
      : '把当前场域最重的判断线带进开场。';
    const antiSlopBase = laws.forbiddenMoves[0] ?? '禁止空话。';

    return {
      opening: threshold
        ? '先说一句已经看见的判断，不把整套分析提前倒出来。'
        : '第一句必须带判断力，不能像普通助手那样先铺垫。',
      cadence: threshold
        ? '一句判词 + 一句仪式邀请。保持克制。'
        : '判词先落下，再沿着骨架推进，不绕路。',
      payload: hasContradictionSection
        ? `${payload} 顺手点明人类矛盾。`
        : payload,
      antiSlop: hasContradictionSection
        ? `${antiSlopBase} 别把失衡包装成深度。`
        : antiSlopBase,
    };
  }

  const payload = spotlight
    ? `Carry this line into the opening: ${spotlight}`
    : 'Carry the heaviest reading line into the opening.';
  const antiSlopBase = laws.forbiddenMoves[0] ?? 'Do not drift into generic language.';

  return {
    opening: threshold
      ? 'Open with one serious reading instead of unloading the full analysis.'
      : 'The first sentence must already carry judgment.',
    cadence: threshold
      ? 'One line of reading, one line of invitation. Stay restrained.'
      : 'Drop the judgment first, then move through the scaffold without throat-clearing.',
    payload: hasContradictionSection
      ? `${payload} Briefly name the human contradiction.`
      : payload,
    antiSlop: hasContradictionSection
      ? `${antiSlopBase} Do not romanticize imbalance as depth.`
      : antiSlopBase,
  };
}
