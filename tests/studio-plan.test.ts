import { buildStudioExecutionPlan } from '../src/studio-plan.js';
import { composeRitualProposal } from '../src/ritual.js';

describe('studio plan', () => {
  test('builds a concrete design execution plan from a sensed proposal', () => {
    const input = 'This landing page needs stronger hierarchy, motion, and color tension.';
    const proposal = composeRitualProposal(input, 'clear');
    const plan = buildStudioExecutionPlan(proposal, 'en');

    expect(plan).toBeDefined();
    expect(plan?.mode).toBe('single');
    expect(plan?.roles[0]?.title).toBe('Art Director');
    expect(plan?.steps[0]?.output).toContain('aesthetic verdict');
    expect(plan?.handoffRule).toContain('concrete artifact');
  });

  test('builds a paired Chinese plan for market analysis with synthesis step', () => {
    const input = '这家公司财报超预期，但指引下修。我需要 narrative、失效条件和风险判断。';
    const proposal = composeRitualProposal(input, 'clear');
    const plan = buildStudioExecutionPlan(proposal, 'zh');

    expect(plan).toBeDefined();
    expect(plan?.mode).toBe('paired');
    expect(plan?.roles.map(role => role.title)).toEqual(
      expect.arrayContaining(['哲思编辑', '市场策略师'])
    );
    expect(plan?.steps.some(step => step.output === '最终合成稿')).toBe(true);
    expect(plan?.arbitrationRule).toContain('可验证');
  });

  test('returns undefined when there is no routed studio', () => {
    expect(buildStudioExecutionPlan(undefined, 'en')).toBeUndefined();
  });
});
