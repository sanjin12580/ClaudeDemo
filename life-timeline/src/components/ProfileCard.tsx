// ============================================================
// ProfileCard — 关于页叙事 Hero 风个人信息卡
// 与首页 v1.6 风格统一：衬线标题 + 渐变光晕 + 毛玻璃信息条
// ============================================================

import type { Profile } from '../lib/types';
import { useI18n } from '../lib/i18n';
import { formatDate, to } from '../lib/base';

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
  const initial = profile.name?.trim().charAt(0) || '我';
  const avatarUrl = profile.avatar ? to(profile.avatar) : '';

  return (
    <div className="space-y-6">
      {/* Hero 卡片 */}
      <div className="relative card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
        {/* 渐变光晕背景 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-24 w-80 h-80 rounded-full bg-green-200/50 dark:bg-green-900/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-24 w-72 h-72 rounded-full bg-emerald-100/70 dark:bg-emerald-900/20 blur-3xl"
        />

        <div className="relative card-body flex flex-col sm:flex-row items-center sm:items-start gap-6 py-10 px-6 sm:px-10">
          {/* 头像 */}
          <div className="shrink-0 relative">
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-green-400/40 to-emerald-300/40 blur-lg"
            />
            <div className="relative w-28 h-28 rounded-full ring-2 ring-green-200 dark:ring-green-800 ring-offset-4 ring-offset-base-100 overflow-hidden grid place-items-center bg-gradient-to-tr from-green-100 to-emerald-50 dark:from-green-900/50 dark:to-emerald-900/30">
              {avatarUrl ? (
                <img src={avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif text-5xl text-green-600 dark:text-green-400">
                  {initial}
                </span>
              )}
            </div>
          </div>

          {/* 信息 */}
          <div className="flex-1 min-w-0 text-center sm:text-left font-serif">
            <h1 className="text-3xl sm:text-4xl font-medium tracking-[0.12em]">
              {profile.name}
            </h1>
            <p className="mt-2 text-base-content/70">{profile.tagline}</p>
            <div className="mt-5 inline-flex items-center gap-2 text-sm text-base-content/60 font-sans bg-base-200/60 dark:bg-gray-800/50 rounded-full px-4 py-1.5">
              <span aria-hidden="true">🎂</span>
              <span>
                {formatDate(profile.birthDate)} · {age}
                {t.yearsOld}
              </span>
            </div>
          </div>
        </div>

        {/* 技能胶囊 */}
        {profile.skills.length > 0 && (
          <div className="relative px-6 sm:px-10 pb-8 flex flex-wrap gap-2 justify-center sm:justify-start">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-200/70 dark:border-green-800/70 text-green-700 dark:text-green-300"
              >
                <span aria-hidden="true" className="text-green-400 dark:text-green-500">
                  ✦
                </span>
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 目标卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 shadow-sm overflow-hidden">
          <div aria-hidden="true" className="h-1 bg-gradient-to-r from-amber-300 to-yellow-200" />
          <div className="card-body p-5">
            <h3 className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <span aria-hidden="true">🎯</span>
              {t.shortGoalTitle}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {profile.shortGoal || t.notSet}
            </p>
          </div>
        </div>

        <div className="card bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 shadow-sm overflow-hidden">
          <div aria-hidden="true" className="h-1 bg-gradient-to-r from-blue-300 to-sky-200" />
          <div className="card-body p-5">
            <h3 className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <span aria-hidden="true">🏔️</span>
              {t.longGoalTitle}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {profile.longGoal || t.notSet}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
