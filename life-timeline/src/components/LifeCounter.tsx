import { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';

interface Props {
  birthDate: string; // "YYYY-MM-DD"
}

/** 生肖计算（按农历年份近似，以春节为界） */
function getZodiac(year: number): string {
  const zodiacs = ['鼠🐭', '牛🐮', '虎🐯', '兔🐰', '龙🐲', '蛇🐍', '马🐴', '羊🐑', '猴🐒', '鸡🐔', '狗🐶', '猪🐷'];
  return zodiacs[(year - 1900) % 12];
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

  // 格式化大数字（加千分位逗号）
  function fmt(n: number): string {
    return n.toLocaleString('zh-CN');
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 text-center">
        {t.title}
      </h3>

      <div className="grid grid-cols-3 gap-4 text-center">
        {/* 天数 */}
        <div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 font-mono tabular-nums">
            {fmt(days)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.days}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            ~{fmt(totalSeconds)} {t.seconds}
          </div>
        </div>

        {/* 周数 */}
        <div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 font-mono tabular-nums">
            {fmt(weeks)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.weeks}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {t.lifePercent}: {lifePercent.toFixed(1)}%
          </div>
        </div>

        {/* 年数 */}
        <div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 font-mono tabular-nums">
            {years.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.years}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {t.zodiac} {zodiac}
          </div>
        </div>
      </div>
    </div>
  );
}
