import type { Goal, GoalBoardData } from './types';

/**
 * 加载目标数据（从 src/data/goals.json）
 */
export async function loadGoals(): Promise<GoalBoardData> {
  const { default: data } = await import('../data/goals.json');
  const rawGoals: Goal[] = (data.goals || []).map((g: any) => ({
    ...g,
    // 运行时确保 category 和 status 是合法值
    category: g.category === 'long' ? 'long' : 'short',
    status: ['completed', 'paused'].includes(g.status) ? g.status : 'active',
  }));
  const goals: Goal[] = rawGoals;

  return {
    short: goals.filter((g) => g.category === 'short'),
    long: goals.filter((g) => g.category === 'long'),
  };
}
