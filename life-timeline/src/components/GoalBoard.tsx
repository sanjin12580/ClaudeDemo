import { motion } from 'motion/react';
import type { GoalBoardData, Goal } from '../lib/types';
import { useI18n } from '../lib/i18n';

interface Props {
  data: GoalBoardData;
}

function GoalCard({ goal, index }: { goal: Goal; index: number }) {
  const t = useI18n().goalBoard;

  const statusBadge = () => {
    switch (goal.status) {
      case 'completed': return { cls: 'badge-success', label: t.completed };
      case 'paused': return { cls: 'badge-ghost', label: t.paused };
      default: return { cls: 'badge-info', label: t.active };
    }
  };

  const badge = statusBadge();
  const isCompleted = goal.status === 'completed';
  const isPaused = goal.status === 'paused';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
    >
      <div className="flex items-center gap-3 py-2">
        {/* 进度条 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-medium truncate ${isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
              {goal.title}
            </span>
            <div className="flex items-center gap-2 ml-2 shrink-0">
              <span className={`badge badge-xs ${badge.cls}`}>{badge.label}</span>
              <span className={`text-xs font-mono tabular-nums font-bold ${isCompleted ? 'text-green-500' : isPaused ? 'text-gray-400' : 'text-green-600 dark:text-green-400'}`}>
                {goal.progress}%
              </span>
            </div>
          </div>

          <div className={`w-full h-2 rounded-full overflow-hidden ${isPaused ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'}`}>
            <motion.div
              className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : isPaused ? 'bg-gray-400 dark:bg-gray-500' : 'bg-gradient-to-r from-green-400 to-green-600'}`}
              initial={{ width: 0 }}
              animate={{ width: `${goal.progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 + index * 0.08 }}
            />
          </div>

          {/* 描述（如有） */}
          {goal.description && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
              {goal.description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function GoalBoard({ data }: Props) {
  const t = useI18n().goalBoard;
  // 首页只展示「进行中」的目标，暂停/已完成的折叠不占版面
  const activeShort = data.short.filter((g) => g.status === 'active');
  const activeLong = data.long.filter((g) => g.status === 'active');
  const totalGoals = activeShort.length + activeLong.length;

  if (totalGoals === 0) {
    return (
      <div className="card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
        <div className="card-body p-6 text-center text-gray-400 dark:text-gray-500">
          <p className="text-sm">{t.empty}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm"
    >
      <div className="card-body p-6 space-y-5">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center">
          {t.heading}
        </h3>

        {/* 短期目标 */}
        {activeShort.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              {t.shortTitle}
            </h4>
            <div className="space-y-1">
              {activeShort.map((goal, i) => (
                <GoalCard key={goal.id} goal={goal} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* 长期目标 */}
        {activeLong.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
              {t.longTitle}
            </h4>
            <div className="space-y-1">
              {activeLong.map((goal, i) => (
                <GoalCard key={goal.id} goal={goal} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
