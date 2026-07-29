import type { Goal, GoalBoardData } from './types';

/**
 * 加载目标数据（从 src/data/goals.json）
 */
export async function loadGoals(): Promise<GoalBoardData> {
  const { default: data } = await import('../data/goals.json');
  const goals: Goal[] = data.goals || [];

  return {
    short: goals.filter((g) => g.category === 'short'),
    long: goals.filter((g) => g.category === 'long'),
  };
}
