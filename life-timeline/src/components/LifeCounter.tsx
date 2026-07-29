import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useI18n } from '../lib/i18n';

interface Props {
  birthDate: string; // "YYYY-MM-DD"
}

/** 生肖计算（按农历年份近似，以春节为界） */
function getZodiac(year: number): string {
  const zodiacs = ['鼠🐭', '牛🐮', '虎🐯', '兔🐰', '龙🐲', '蛇🐍', '马🐴', '羊🐑', '猴🐒', '鸡🐔', '狗🐶', '猪🐷'];
  return zodiacs[(year - 1900) % 12];
}

/** 格式化大数字（加千分位逗号） */
function fmt(n: number): string {
  return n.toLocaleString('zh-CN');
}

export default function LifeCounter({ birthDate }: Props) {
  const { lifeCounter: t } = useI18n();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const birth = new Date(birthDate);
  const diffMs = now.getTime() - birth.getTime();
  const days = Math.floor(diffMs / 86400000);
  const weeks = Math.floor(days / 7);
  const years = days / 365.2425;
  const totalSeconds = Math.floor(diffMs / 1000);

  // 人生进度（假设预期寿命 80 岁）
  const expectedYears = 80;
  const lifePercent = Math.min(100, (years / expectedYears) * 100);

  // 出生年的生肖
  const zodiac = getZodiac(birth.getFullYear());

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm"
    >
      <div className="card-body p-6">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 text-center">
          {t.title}
        </h3>

        <div className="grid grid-cols-3 gap-4 text-center">
          {/* 天数 */}
          <div className="space-y-1">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 font-mono tabular-nums">
              {fmt(days)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t.days}</div>
            <div className="text-[10px] text-gray-300 dark:text-gray-600">
              ~{fmt(totalSeconds)} {t.seconds}
            </div>
          </div>

          {/* 周数 */}
          <div className="space-y-1">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 font-mono tabular-nums">
              {fmt(weeks)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t.weeks}</div>
            <div className="text-[10px] text-gray-300 dark:text-gray-600">
              {t.lifePercent}: {lifePercent.toFixed(1)}%
            </div>
          </div>

          {/* 年数 */}
          <div className="space-y-1">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 font-mono tabular-nums">
              {years.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t.years}</div>
            <div className="text-[10px] text-gray-300 dark:text-gray-600">
              {t.zodiac} {zodiac}
            </div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1.5">
            <span>0</span>
            <span>{t.lifePercent}</span>
            <span>{expectedYears} 岁</span>
          </div>
          <div className="w-full h-2 bg-gray-50 dark:bg-gray-950 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${lifePercent}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
