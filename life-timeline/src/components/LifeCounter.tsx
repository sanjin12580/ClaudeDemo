import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useI18n } from '../lib/i18n';

interface Props {
  birthDate: string; // "YYYY-MM-DD"
  /** card: 原卡片样式；inline: 首页 hero 内的紧凑文本 */
  variant?: 'card' | 'inline';
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

export default function LifeCounter({ birthDate, variant = 'card' }: Props) {
  const { lifeCounter: t } = useI18n();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const birth = new Date(birthDate);
  // 校验出生日期有效性，避免渲染 NaN
  const isValid = !isNaN(birth.getTime());
  if (!isValid) {
    return (
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body p-6 text-center text-gray-400 dark:text-gray-500">
          <p className="text-sm">出生日期未配置或格式无效</p>
        </div>
      </div>
    );
  }

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

  if (variant === 'inline') {
    return (
      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
        {fmt(days)} {t.days} · {fmt(weeks)} {t.weeks} · {years.toFixed(1)} {t.years}
      </span>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="card bg-base-100 border border-base-300 shadow-sm"
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
        <div className="mt-5 space-y-1.5">
          {/* 进度条本体 */}
          <div className="w-full h-8 bg-base-300 rounded-full shadow-inner relative">
            <motion.div
              className="h-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-full overflow-hidden relative flex items-center justify-end min-w-0"
              initial={{ width: 0 }}
              animate={{ width: `${lifePercent}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            >
              {/* 进度条光泽 */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full" />
              {/* 年龄/80 标签 */}
              {lifePercent >= 15 && (
                <span className="relative text-white text-xs font-bold font-mono tabular-nums pr-2 whitespace-nowrap">
                  {years.toFixed(1)} / {expectedYears} 岁
                </span>
              )}
            </motion.div>

            {/* 1/e 分割线 + 悬停提示 */}
            <div
              className="group absolute top-0 bottom-0 z-10"
              style={{ left: `${(1 / Math.E) * 100}%` }}
            >
              {/* 可悬停的触发区域 */}
              <div className="absolute -top-1 -bottom-1 -translate-x-1/2 w-3 cursor-default" />
              {/* 竖线 */}
              <div className="absolute top-0 bottom-0 -translate-x-1/2 w-0.5 bg-amber-500 dark:bg-amber-400" />
              {/* 悬停显示的 1/e 标签 */}
              <span className="absolute -top-5 -translate-x-1/2 text-[10px] font-mono text-amber-600 dark:text-amber-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                1/e
              </span>
              {/* 始终显示的对应年龄 */}
              <span className="absolute -bottom-4 -translate-x-1/2 text-[10px] text-amber-500/50 dark:text-amber-400/50 whitespace-nowrap">
                {(expectedYears / Math.E).toFixed(1)} 岁
              </span>
            </div>

            {/* 当进度条太短时，年龄标签显示在进度条外侧 */}
            {lifePercent < 15 && (
              <span className="absolute top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 font-mono ml-2"
                style={{ left: `${lifePercent}%` }}>
                {years.toFixed(1)} / {expectedYears} 岁
              </span>
            )}
          </div>

          {/* 百分比标签 — 跟随进度条右端 */}
          <div className="relative w-full h-5">
            <motion.div
              className="absolute -translate-x-1/2 text-xs font-bold text-green-600 dark:text-green-400 font-mono tabular-nums whitespace-nowrap"
              initial={{ left: 0 }}
              animate={{ left: `${lifePercent}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            >
              {lifePercent.toFixed(1)}%
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
