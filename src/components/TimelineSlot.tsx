import type { TimeBlock, SlotStatus } from '../models/types';

interface TimelineSlotProps {
  block: TimeBlock;
  compact?: boolean;
}

const statusStyles: Record<SlotStatus, { dot: string; bg: string }> = {
  blocked: { dot: 'bg-red-500', bg: 'bg-red-50 text-red-700' },
  limited: { dot: 'bg-yellow-500', bg: 'bg-yellow-50 text-yellow-700' },
  free: { dot: 'bg-green-500', bg: 'bg-green-50 text-green-700' },
};

export function TimelineSlot({ block, compact = false }: TimelineSlotProps) {
  const styles = statusStyles[block.status];

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${styles.bg}`}
        title={`${block.slot.start}–${block.slot.end}: ${block.reason}`}
      >
        <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
        {block.slot.start}–{block.slot.end}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${styles.bg}`}>
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${styles.dot}`} />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold">
          {block.slot.start}–{block.slot.end}
        </span>
        <p className="text-xs opacity-75 truncate">{block.reason}</p>
      </div>
    </div>
  );
}
