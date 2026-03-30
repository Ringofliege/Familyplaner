import { useState, useMemo } from 'react';
import { getDay, addDays, startOfWeek, format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { DayOfWeek, FamilyMemberId } from '../../models/types';
import type { FamilyState } from '../../hooks/useFamilyState';
import { calculateTimeBlocks } from '../../engine/energy';
import { motherWorkSchedule, fatherWorkSchedule, allFixedEvents } from '../../data/schedules';
import { Card, TimelineSlot, Badge } from '../../components';

interface CalendarPageProps {
  state: FamilyState;
}

const memberName: Record<FamilyMemberId, string> = {
  mother: 'Mama',
  father: 'Papa',
};

export function CalendarPage({ state }: CalendarPageProps) {
  const today = getDay(new Date()) as DayOfWeek;
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(today);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      dayOfWeek: getDay(date) as DayOfWeek,
      label: format(date, 'EEE', { locale: de }),
      dateNum: format(date, 'd'),
      fullDate: format(date, 'yyyy-MM-dd'),
    };
  });

  const workSchedules = useMemo(
    () => ({ mother: motherWorkSchedule, father: fatherWorkSchedule }),
    [],
  );

  const blocks = useMemo(
    () => calculateTimeBlocks(selectedDay, workSchedules, allFixedEvents),
    [selectedDay, workSchedules],
  );

  const dayEvents = useMemo(
    () => allFixedEvents.filter((e) => e.day === selectedDay),
    [selectedDay],
  );

  const dayTasks = useMemo(
    () =>
      state.tasks.filter((task) => {
        if (task.completed) return false;
        if (task.recurrenceDays && task.recurrenceDays.length > 0) {
          return task.recurrenceDays.includes(selectedDay);
        }
        if (task.recurrence === 'daily') return true;
        if (task.recurrence === 'weekday') return selectedDay >= 1 && selectedDay <= 5;
        return false;
      }),
    [state.tasks, selectedDay],
  );

  const motherBlocks = blocks.filter((b) => b.owner === 'mother');
  const fatherBlocks = blocks.filter((b) => b.owner === 'father');

  return (
    <div className="pb-20 px-4 space-y-4 pt-4">
      {/* Week selector */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weekDays.map((d) => {
          const isToday = d.dayOfWeek === today;
          const isSelected = d.dayOfWeek === selectedDay;
          return (
            <button
              key={d.dayOfWeek}
              onClick={() => setSelectedDay(d.dayOfWeek)}
              className={`flex flex-col items-center min-w-[48px] py-2 px-2 rounded-xl transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : isToday
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-50 text-slate-600'
              }`}
            >
              <span className="text-[10px] font-medium uppercase">{d.label}</span>
              <span className="text-lg font-bold">{d.dateNum}</span>
            </button>
          );
        })}
      </div>

      {/* Events for selected day */}
      {dayEvents.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Termine</h3>
          <div className="space-y-2">
            {dayEvents.map((ev) => (
              <Card key={ev.id}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-1 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: ev.color ?? '#94a3b8' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {ev.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {ev.slot.start} – {ev.slot.end}
                    </p>
                  </div>
                  <Badge
                    label={
                      ev.owner === 'household' || ev.owner === 'family'
                        ? 'Alle'
                        : memberName[ev.owner]
                    }
                    color={ev.owner === 'mother' ? 'pink' : ev.owner === 'father' ? 'blue' : 'gray'}
                  />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Tasks for selected day */}
      {dayTasks.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">
            Aufgaben ({dayTasks.length})
          </h3>
          <div className="space-y-1.5">
            {dayTasks.map((task) => (
              <Card key={task.id} className="py-2.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-800 flex-1">{task.title}</p>
                  <Badge label={task.category} color="gray" size="sm" />
                  {task.assignedTo && (
                    <Badge
                      label={memberName[task.assignedTo]}
                      color={task.assignedTo === 'mother' ? 'pink' : 'blue'}
                      size="sm"
                    />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Timeline – side by side */}
      <section>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Tagesplan</h3>
        <div className="grid grid-cols-2 gap-2">
          {/* Mother */}
          <div>
            <p className="text-xs font-semibold text-pink-600 mb-1 text-center">Mama</p>
            <div className="space-y-0.5">
              {motherBlocks.map((block) => (
                <TimelineSlot
                  key={`m-${block.slot.start}`}
                  block={block}
                  compact
                />
              ))}
            </div>
          </div>

          {/* Father */}
          <div>
            <p className="text-xs font-semibold text-blue-600 mb-1 text-center">Papa</p>
            <div className="space-y-0.5">
              {fatherBlocks.map((block) => (
                <TimelineSlot
                  key={`f-${block.slot.start}`}
                  block={block}
                  compact
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Legend */}
      <Card className="py-3">
        <div className="flex items-center justify-center gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            Belegt
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            Eingeschränkt
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            Frei
          </span>
        </div>
      </Card>
    </div>
  );
}
