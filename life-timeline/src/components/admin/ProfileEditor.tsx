// ============================================================
// ProfileEditor — 个人档案编辑器（shadcn 表单）
// ============================================================

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import type { ProfileFormShape } from './shapes';
import type { zh } from '../../lib/i18n';

interface Props {
  form: ProfileFormShape;
  status: 'idle' | 'saving' | 'success' | 'error';
  message: string;
  t: typeof zh['admin'];
  onField: <K extends keyof ProfileFormShape>(field: K, value: ProfileFormShape[K]) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function ProfileEditor({ form, status, message, t, onField, onSubmit }: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t.profileName}</Label>
            <Input type="text" value={form.name} onChange={(e) => onField('name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t.profileTagline}</Label>
            <Input type="text" value={form.tagline} onChange={(e) => onField('tagline', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t.profileAvatar}</Label>
            <Input
              type="text"
              value={form.avatar}
              onChange={(e) => onField('avatar', e.target.value)}
              placeholder="/images/avatar.jpg"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.profileBirthDate}</Label>
            <Input
              type="date"
              value={form.birthDate}
              onChange={(e) => onField('birthDate', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t.profileSkills}</Label>
          <Input
            type="text"
            value={form.skills}
            onChange={(e) => onField('skills', e.target.value)}
            placeholder={t.tagsPlaceholder}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t.profileShortGoal}</Label>
          <Input type="text" value={form.shortGoal} onChange={(e) => onField('shortGoal', e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>{t.profileLongGoal}</Label>
          <Input type="text" value={form.longGoal} onChange={(e) => onField('longGoal', e.target.value)} />
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Button type="submit" disabled={status === 'saving'}>
            {status === 'saving' ? t.savingBtn : t.profileSave}
          </Button>
          {message && (
            <span className={cn('text-xs', status === 'success' ? 'text-green-600' : 'text-destructive')}>
              {message}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
