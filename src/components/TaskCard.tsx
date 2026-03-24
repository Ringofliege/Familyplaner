import { Check, Heart, ArrowRightLeft, Clock } from 'lucide-react';
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

  return (
    <Card className={task.completed ? 'opacity-60' : ''}>
      <div className="flex items-start gap-3">
        {member && <Avatar memberId={member} size="sm" />}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`text-sm font-semibold text-slate-800 ${task.completed ? 'line-through' : ''}`}>
              {task.title}
            </h3>
            <Badge label={task.category} color={categoryColors[task.category]} />
          </div>

          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
            {/* Effort indicator */}
            <span className="flex items-center gap-0.5" title={task.effort}>
              {Array.from({ length: 4 }, (_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i < dots ? 'bg-slate-600' : 'bg-slate-200'
                  }`}
                />
              ))}
            </span>

            {/* Duration */}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.durationMinutes}m
            </span>
          </div>
        </div>

        {/* Actions */}
        {showActions && !task.completed && (
          <div className="flex items-center gap-1">
            {onComplete && (
              <button
                onClick={() => onComplete(task.id)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-green-600 hover:bg-green-50 active:bg-green-100 transition-colors"
                aria-label="Aufgabe erledigen"
              >
                <Check className="w-5 h-5" />
              </button>
            )}
            {onTakeOver && (
              <button
                onClick={() => onTakeOver(task.id)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors"
                aria-label="Aufgabe übernehmen"
              >
                <ArrowRightLeft className="w-5 h-5" />
              </button>
            )}
            {onThankYou && (
              <button
                onClick={() => onThankYou(task.id)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-pink-500 hover:bg-pink-50 active:bg-pink-100 transition-colors"
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
