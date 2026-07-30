import type { Profile } from '../lib/types';
import { useI18n } from '../lib/i18n';
import { formatDate } from '../lib/base';

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

export default function ProfileCard({ profile }: Props) {
  const { about: t } = useI18n();
  const age = calcAge(profile.birthDate);

  return (
    <div className="space-y-6">
      {/* 基础信息区 */}
      <div className="card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
        <div className="card-body flex flex-col sm:flex-row items-start gap-6">
          {/* 头像 */}
          <div className="shrink-0">
            {profile.avatar ? (
              <div className="avatar">
                <div className="w-24 rounded-full ring ring-green-200 dark:ring-green-800 ring-offset-white dark:ring-offset-gray-900 ring-offset-2">
                  <img src={profile.avatar} alt={profile.name} />
                </div>
              </div>
            ) : (
              <div className="avatar placeholder">
                <div className="w-24 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 text-3xl ring ring-green-200 dark:ring-green-800 ring-offset-white dark:ring-offset-gray-900 ring-offset-2">
                  <span>👤</span>
                </div>
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
              <div className="flex gap-1.5 mt-3 flex-wrap items-center">
                <span className="text-sm text-gray-400 dark:text-gray-500">🏷️</span>
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="badge badge-sm border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 目标卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl shadow-sm">
          <div className="card-body p-5">
            <h3 className="font-semibold text-amber-600 dark:text-amber-400 mb-2">
              🎯 {t.shortGoalTitle}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {profile.shortGoal || t.notSet}
            </p>
          </div>
        </div>

        <div className="card bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl shadow-sm">
          <div className="card-body p-5">
            <h3 className="font-semibold text-info-content/80 mb-2">
              🏔️ {t.longGoalTitle}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {profile.longGoal || t.notSet}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
