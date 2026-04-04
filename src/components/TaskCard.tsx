import { Check, Heart, ArrowRightLeft, Clock, Sparkles, Link2, CalendarClock } from 'lucide-react';
import type { Task, FamilyMemberId, TaskCategory, EffortLevel } from '../models/types';
import { Card } from './Card';
import { Badge } from './Badge';
import { Avatar } from './Avatar';

interface TaskCardProps {
  task: Task;
  assignedTo?: FamilyMemberId;
  onComplete?: (taskId: string) => void;
  onTakeOver?: (taskId: string) => void;
  onThankYou?: (taskId: string) => void;
  showActions?: boolean;
}

const categoryColors: Record<TaskCategory, 'pink' | 'blue' | 'purple' | 'green' | 'yellow' | 'red' | 'gray'> = {
  childcare: 'pink',
  household: 'purple',
  pets: 'green',
  food: 'yellow',
  admin: 'blue',
  personal: 'gray',
  garden: 'green',
};

const effortDots: Record<EffortLevel, number> = {
  passive: 1,
  light: 2,
  moderate: 3,
  heavy: 4,
};

const categoryAccent: Record<TaskCategory, string> = {
  childcare: 'from-pink-400 via-rose-400 to-fuchsia-500',
  household: 'from-violet-400 via-purple-500 to-indigo-500',
  pets: 'from-emerald-400 via-green-500 to-teal-500',
  food: 'from-amber-300 via-orange-400 to-rose-400',
  admin: 'from-sky-400 via-blue-500 to-indigo-500',
  personal: 'from-slate-300 via-slate-400 to-slate-500',
  garden: 'from-lime-400 via-green-500 to-emerald-500',
};

export function TaskCard({
  task,
  assignedTo,
  onComplete,
  onTakeOver,
  onThankYou,
  showActions = true,
}: TaskCardProps) {
  const member = assignedTo ?? task.assignedTo;
  const dots = effortDots[task.effort];
  const dueDateLabel = (() => {
    if (!task.dueDate) return null;
    const dueDate = new Date(task.dueDate);
    if (Number.isNaN(dueDate.getTime())) return null;
    return `Fällig ${dueDate.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
    })}`;
  })();
  const metaItems = [
    {
      key: 'duration',
      icon: Clock,
      label: `${task.durationMinutes} Min.`,
    },
    ...(dueDateLabel
      ? [
          {
            key: 'dueDate',
            icon: CalendarClock,
            label: dueDateLabel,
          },
        ]
      : []),
    ...(task.dependsOn?.length
      ? [
          {
            key: 'dependsOn',
            icon: Link2,
            label: `${task.dependsOn.length} Abhängigkeiten`,
          },
        ]
      : []),
  ];

  return (
    <Card className={`section-fade-in ${task.completed ? 'opacity-65 saturate-75' : ''}`}>
      <div className="absolute inset-x-0 top-0 h-1">
        <div className={`h-full w-full bg-gradient-to-r ${categoryAccent[task.category]}`} />
      </div>
      <div className="flex items-start gap-3">
        {member && <Avatar memberId={member} size="sm" />}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`text-sm font-semibold text-slate-800 ${task.completed ? 'line-through' : ''}`}
            >
              {task.title}
            </h3>
            <Badge label={task.category} color={categoryColors[task.category]} />
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-2 py-1 text-[11px] font-semibold text-slate-500">
              <Sparkles className="h-3 w-3 text-amber-500" />
              {task.fairnessPoints} Pkt.
            </span>
          </div>

          {task.description && <p className="mt-2 text-sm leading-5 text-slate-500">{task.description}</p>}

          <div className="mt-3 space-y-3">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Aufwand
                </span>
                <span className="text-xs font-medium text-slate-500">{task.effort}</span>
              </div>
              <div className="glass-panel h-2 overflow-hidden rounded-full bg-slate-100/70">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${categoryAccent[task.category]} transition-all duration-500`}
                  style={{ width: `${(dots / 4) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {metaItems.map(({ key, icon: Icon, label }) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 font-medium"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {showActions && !task.completed && (
          <div className="flex flex-col items-center gap-2">
            {onComplete && (
              <button
                onClick={() => onComplete(task.id)}
                className="glass-panel flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl text-green-600 transition hover:bg-green-50"
                aria-label="Aufgabe erledigen"
              >
                <Check className="w-5 h-5" />
              </button>
            )}
            {onTakeOver && (
              <button
                onClick={() => onTakeOver(task.id)}
                className="glass-panel flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl text-blue-600 transition hover:bg-blue-50"
                aria-label="Aufgabe übernehmen"
              >
                <ArrowRightLeft className="w-5 h-5" />
              </button>
            )}
            {onThankYou && (
              <button
                onClick={() => onThankYou(task.id)}
                className="glass-panel flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl text-pink-500 transition hover:bg-pink-50"
                aria-label="Danke sagen"
              >
                <Heart className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
