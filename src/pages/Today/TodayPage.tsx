import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Zap, Sun, Sunrise, Moon } from 'lucide-react';
import type { FamilyMemberId, Task } from '../../models/types';
import type { FamilyState } from '../../hooks/useFamilyState';
import { useToday } from '../../hooks/useToday';
import { Card, TaskCard, SuggestionCard, Badge } from '../../components';

interface TodayPageProps {
  state: FamilyState;
  completeTask: (taskId: string, completedBy: FamilyMemberId) => void;
  takeOverTask: (taskId: string, to: FamilyMemberId) => void;
  sendThankYou: (to: FamilyMemberId, taskId?: string, message?: string) => void;
  toggleStressMode: (activatedBy: FamilyMemberId, reason?: string) => void;
}

const memberName: Record<FamilyMemberId, string> = {
  mother: 'Mama',
  father: 'Papa',
};

function getGreeting(): { text: string; icon: typeof Sun } {
  const hour = new Date().getHours();
  if (hour < 11) return { text: 'Guten Morgen', icon: Sunrise };
  if (hour < 17) return { text: 'Guten Tag', icon: Sun };
  return { text: 'Guten Abend', icon: Moon };
}

export function TodayPage({
  state,
  completeTask,
  takeOverTask,
  sendThankYou,
  toggleStressMode,
}: TodayPageProps) {
  const todayView = useToday(state);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  const currentUser = state.currentUser;
  const otherUser: FamilyMemberId = currentUser === 'mother' ? 'father' : 'mother';

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;
  const dateStr = format(new Date(), 'EEEE, d. MMMM', { locale: de });

  // Split tasks by owner
  const myTasks: Task[] = [];
  const otherTasks: Task[] = [];
  for (const task of todayView.todayTasks) {
    const responsible = todayView.responsibilities.get(task.id) ?? task.assignedTo;
    if (responsible === currentUser) {
      myTasks.push(task);
    } else {
      otherTasks.push(task);
    }
  }

  // Childcare summary
  const bringTask = todayView.todayTasks.find((t) =>
    t.title.toLowerCase().includes('bring'),
  );
  const pickupTask = todayView.todayTasks.find((t) =>
    t.title.toLowerCase().includes('abhol'),
  );
  const bringPerson = bringTask
    ? memberName[todayView.responsibilities.get(bringTask.id) ?? bringTask.assignedTo ?? 'father']
    : null;
  const pickupPerson = pickupTask
    ? memberName[todayView.responsibilities.get(pickupTask.id) ?? pickupTask.assignedTo ?? 'mother']
    : null;

  const visibleSuggestions = todayView.suggestions.filter(
    (s) => !s.dismissed && !dismissedSuggestions.has(s.id),
  );

  const handleDismiss = (id: string) => {
    setDismissedSuggestions((prev) => new Set(prev).add(id));
  };

  const totalSlots = (load: { blocked: number; limited: number; free: number }) =>
    load.blocked + load.limited + load.free;

  return (
    <div className="pb-20 px-4 space-y-4 pt-4">
      {/* Date header */}
      <p className="text-sm font-medium text-slate-500 capitalize">{dateStr}</p>

      {/* Greeting */}
      <Card className="bg-gradient-to-br from-indigo-50 to-white">
        <div className="flex items-center gap-3">
          <GreetingIcon className="w-8 h-8 text-amber-400 shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {greeting.text}, {memberName[currentUser]}
            </h2>
            <p className="text-sm text-slate-500">
              {todayView.todayTasks.length} Aufgaben heute
            </p>
          </div>
        </div>
      </Card>

      {/* Quick summary */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Überblick</h3>
        <div className="space-y-1 text-sm text-slate-600">
          <p>
            📋 {myTasks.length} Aufgaben für dich, {otherTasks.length} für{' '}
            {memberName[otherUser]}
          </p>
          {bringPerson && <p>🚗 Kind bringen: {bringPerson}</p>}
          {pickupPerson && <p>🏫 Kind abholen: {pickupPerson}</p>}
          {state.stressMode.active && (
            <p className="text-yellow-700 font-medium">
              ⚡ Stress-Modus aktiv
              {state.stressMode.activatedBy &&
                ` (${memberName[state.stressMode.activatedBy]})`}
            </p>
          )}
        </div>
      </Card>

      {/* Suggestions */}
      {visibleSuggestions.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Vorschläge</h3>
          <div className="space-y-2">
            {visibleSuggestions.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        </section>
      )}

      {/* Today's tasks */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-700">Aufgaben heute</h3>
          <Badge label={`${todayView.todayTasks.length}`} color="purple" />
        </div>

        {myTasks.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-slate-500 mb-1.5">Deine Aufgaben</p>
            <div className="space-y-2">
              {myTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  assignedTo={currentUser}
                  onComplete={(id) => completeTask(id, currentUser)}
                  onTakeOver={(id) => takeOverTask(id, otherUser)}
                  onThankYou={(id) => sendThankYou(otherUser, id)}
                />
              ))}
            </div>
          </div>
        )}

        {otherTasks.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1.5">
              Aufgaben von {memberName[otherUser]}
            </p>
            <div className="space-y-2">
              {otherTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  assignedTo={otherUser}
                  onComplete={(id) => completeTask(id, otherUser)}
                  onTakeOver={(id) => takeOverTask(id, currentUser)}
                  onThankYou={(id) => sendThankYou(otherUser, id)}
                />
              ))}
            </div>
          </div>
        )}

        {todayView.todayTasks.length === 0 && (
          <Card className="text-center py-6">
            <p className="text-slate-500 text-sm">Keine Aufgaben für heute 🎉</p>
          </Card>
        )}
      </section>

      {/* Energy overview */}
      <section>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Energielevel</h3>
        <Card>
          <div className="space-y-3">
            {(['mother', 'father'] as const).map((member) => {
              const load =
                member === 'mother' ? todayView.motherLoad : todayView.fatherLoad;
              const total = totalSlots(load);
              return (
                <div key={member}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-600">
                      {memberName[member]}
                    </span>
                    <span className="text-xs text-slate-400">
                      {load.free} frei · {load.limited} eingeschränkt · {load.blocked}{' '}
                      belegt
                    </span>
                  </div>
                  <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
                    {total > 0 && (
                      <>
                        <div
                          className="bg-red-400 transition-all"
                          style={{ width: `${(load.blocked / total) * 100}%` }}
                        />
                        <div
                          className="bg-yellow-400 transition-all"
                          style={{ width: `${(load.limited / total) * 100}%` }}
                        />
                        <div
                          className="bg-green-400 transition-all"
                          style={{ width: `${(load.free / total) * 100}%` }}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* Stress Mode toggle */}
      <Card
        onClick={() => toggleStressMode(currentUser)}
        className={
          state.stressMode.active
            ? 'border-2 border-yellow-400 bg-yellow-50'
            : 'border border-slate-200'
        }
      >
        <div className="flex items-center gap-3">
          <Zap
            className={`w-6 h-6 ${
              state.stressMode.active ? 'text-yellow-600' : 'text-slate-400'
            }`}
          />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-800">Stress-Modus</h3>
            <p className="text-xs text-slate-500">
              {state.stressMode.active
                ? 'Aktiv – Nicht-essentielle Aufgaben werden reduziert'
                : 'Tippe um den Stress-Modus zu aktivieren'}
            </p>
          </div>
          <div
            className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${
              state.stressMode.active ? 'bg-yellow-400 justify-end' : 'bg-slate-300 justify-start'
            }`}
          >
            <div className="w-5 h-5 bg-white rounded-full shadow" />
          </div>
        </div>
      </Card>
    </div>
  );
}
