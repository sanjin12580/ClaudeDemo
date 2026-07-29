import type { Profile } from '../lib/types';
import { useI18n } from '../lib/i18n';

interface Props {
  profile: Profile;
}

/** 计算年龄 */
function calcAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/** 格式化日期 */
function formatDate(dateStr: string): string {
  const parts = dateStr.split('-');
  return `${parts[0]} 年 ${parseInt(parts[1])} 月 ${parseInt(parts[2])} 日`;
}

export default function ProfileCard({ profile }: Props) {
  const { about: t } = useI18n();
  const age = calcAge(profile.birthDate);

  return (
    <div className="space-y-6">
      {/* 基础信息区 */}
      <div className="flex flex-col sm:flex-row items-start gap-6 p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        {/* 头像 */}
        <div className="shrink-0">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-green-100 dark:border-green-900"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-3xl">
              👤
            </div>
          )}
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{profile.tagline}</p>

          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
            <span title={t.birthday}>
              🎂 {formatDate(profile.birthDate)} · {age}{t.yearsOld}
            </span>
          </div>

          {/* 技能标签 */}
          {profile.skills.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              <span className="text-sm text-gray-400 dark:text-gray-500">🏷️</span>
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300
                             px-2.5 py-0.5 rounded-full border border-green-200 dark:border-green-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 目标卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30">
          <h3 className="font-semibold text-amber-700 dark:text-amber-400 mb-2">
            🎯 {t.shortGoalTitle}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {profile.shortGoal || t.notSet}
          </p>
        </div>

        <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30">
          <h3 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">
            🏔️ {t.longGoalTitle}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {profile.longGoal || t.notSet}
          </p>
        </div>
      </div>
    </div>
  );
}
