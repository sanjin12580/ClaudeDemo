// ============================================================
// EventCardWithEdit — 年份页等静态页面的事件卡片 + 编辑按钮（仅 dev）
// ============================================================

import { useState } from 'react';
import EventCard from '../EventCard';
import EventPostEditDialog from './EventPostEditDialog';
import EditButton from './EditButton';
import { useI18n } from '../../lib/i18n';
import type { EventMeta } from '../../lib/types';

interface Props {
  event: EventMeta;
  editable?: boolean;
}

export default function EventCardWithEdit({ event, editable }: Props) {
  const { editMode: t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="relative">
        <EventCard event={event} />
        {editable && (
          <EditButton
            onClick={() => setOpen(true)}
            title={t.edit}
            className="absolute top-3 right-3 z-10"
          />
        )}
      </div>
      {editable && open && (
        <EventPostEditDialog
          key={event.slug}
          mode="events"
          item={event}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
