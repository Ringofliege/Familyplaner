import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Zap,
  Sun,
  Sunrise,
  Moon,
  ArrowRight,
  Sparkles,
  Car,
  ShieldCheck,
} from 'lucide-react';
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

const memberColorClass: Record<FamilyMemberId, string> = {
  mother: 'from-pink-400 via-rose-400 to-fuchsia-500',
  father: 'from-sky-400 via-blue-500 to-indigo-500',
};

function getGreeting(): { text: string; icon: typeof Sun } {
  const hour = new Date().getHours();
  if (hour < 11) return { text: 'Guten Morgen', icon: Sunrise };
  if (hour < 17) return { text: 'Guten Tag', icon: Sun };
  return { text: 'Guten Abend', icon: Moon };
}

function QuickStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="glass-panel rounded-3xl p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/75">{detail}</p>
    </div>
  );
}

function EnergyOrb({
  label,
  load,
  gradient,
}: {
  label: string;
  load: { blocked: number; limited: number; free: number };
  gradient: string;
}) {
  const total = load.blocked + load.limited + load.free;
  const freePercent = total > 0 ? Math.round((load.free / total) * 100) : 0;
  const availabilityLabel =
    freePercent >= 55 ? 'viel Spielraum' : freePercent >= 30 ? 'knapp planbar' : 'nahe am Limit';

  return (
    <div className="glass-panel rounded-[28px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">{label}</p>
          <p className="mt-1 text-xs text-slate-400">{availabilityLabel}</p>
        </div>
        <div
          className={`relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${gradient} p-[7px] shadow-lg`}
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-white/90">
            <div className="text-center">
              <p className="text-xl font-bold text-slate-900">{freePercent}%</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                frei
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-xs text-slate-500">
        <div className="flex items-center justify-between">
          <span>Verplant</span>
          <span className="font-semibold text-slate-700">{load.blocked}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Eingeschränkt</span>
          <span className="font-semibold text-slate-700">{load.limited}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Frei</span>
          <span className="font-semibold text-slate-700">{load.free}</span>
        </div>
      </div>
    </div>
  );
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

  const visibleSuggestions = todayView.suggestions.filter(
    (s) => !s.dismissed && !dismissedSuggestions.has(s.id),
  );

  const handleDismiss = (id: string) => {
    setDismissedSuggestions((prev) => new Set(prev).add(id));
  };

  const totalSlots = (load: { blocked: number; limited: number; free: number }) =>
    load.blocked + load.limited + load.free;
  const currentLoad = currentUser === 'mother' ? todayView.motherLoad : todayView.fatherLoad;
  const currentFreePercent = Math.round(
    (currentLoad.free / Math.max(totalSlots(currentLoad), 1)) * 100,
  );
  const workloadDelta = Math.abs(myTasks.length - otherTasks.length);
  const chargeLevel = state.carResource.metadata.chargeLevel;
  const chargeStatus = chargeLevel >= 70 ? 'bereit' : chargeLevel >= 40 ? 'einplanen' : 'laden';

  return (
    <div className="space-y-5 px-4 pb-28 pt-4">
      <Card className="section-fade-in overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(129,140,248,0.35),_transparent_32%),radial-gradient(circle_at_left,_rgba(236,72,153,0.25),_transparent_28%)]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
                {dateStr}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="glow-pill flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 text-amber-300">
                  <GreetingIcon className="h-7 w-7 shrink-0" />
                </span>
                <div>
                  <h2 className="text-2xl font-bold">
                    {greeting.text}, {memberName[currentUser]}
                  </h2>
                  <p className="mt-1 text-sm text-white/70">
                    {todayView.todayTasks.length} Aufgaben, {visibleSuggestions.length} smarte Hinweise
                  </p>
                </div>
              </div>
            </div>
            <Badge
              label={state.stressMode.active ? 'Stress aktiv' : 'Flow aktiv'}
              color={state.stressMode.active ? 'yellow' : 'green'}
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <QuickStat
              label="Dein Fokus"
              value={`${myTasks.length}`}
              detail={workloadDelta === 0 ? 'gleich verteilt' : `${workloadDelta} Task Unterschied`}
            />
            <QuickStat
              label="Freiraum"
              value={`${currentFreePercent}%`}
              detail="so viel Energie ist heute noch frei"
            />
            <QuickStat
              label="Auto"
              value={`${chargeLevel}%`}
              detail={`Status: ${chargeStatus}`}
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-white/70">
            <span className="rounded-full bg-white/10 px-3 py-1.5">
              {memberName[otherUser]} hat {otherTasks.length} offene Tasks
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1.5">
              {visibleSuggestions.length > 0
                ? `${visibleSuggestions.length} smarte Hinweise aktiv`
                : 'keine kritischen Hinweise'}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1.5">
              {currentFreePercent >= 50 ? 'guter Spielraum heute' : 'heute eher eng geplant'}
            </span>
          </div>
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="section-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Tageslage</p>
              <p className="mt-1 text-xs text-slate-500">
                Aufgaben, Energie und Verantwortung gebündelt.
              </p>
            </div>
            <Sparkles className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{todayView.todayTasks.length}</p>
          <p className="mt-1 text-xs text-slate-400">aktive Aufgaben im Familienboard</p>
        </Card>

        <Card className="section-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Auto-Radar</p>
              <p className="mt-1 text-xs text-slate-500">Ladestand für Wege und Übergaben.</p>
            </div>
            <Car className="h-5 w-5 text-sky-500" />
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{chargeLevel}%</p>
          <p className="mt-1 text-xs text-slate-400">
            {state.carResource.metadata.needsChargeBefore.length > 0
              ? 'Büro- und Familientage im Blick'
              : 'heute ohne Ladewarnung'}
          </p>
        </Card>

        <Card className="section-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Stressschutz</p>
              <p className="mt-1 text-xs text-slate-500">Schneller Fallback für intensive Tage.</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">
            {state.stressMode.active ? 'ON' : 'OFF'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {state.stressMode.active
              ? `aktiviert von ${state.stressMode.activatedBy ? memberName[state.stressMode.activatedBy] : 'unbekannt'}`
              : 'aktuell normale Priorisierung'}
          </p>
        </Card>
      </section>

      {visibleSuggestions.length > 0 && (
        <section className="section-fade-in">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Smartes Cockpit</h3>
              <p className="text-xs text-slate-400">Automatische Hinweise für Entlastung und Timing</p>
            </div>
            <Badge label={`${visibleSuggestions.length}`} color="purple" />
          </div>
          <div className="space-y-2">
            {visibleSuggestions.map((s) => (
              <SuggestionCard key={s.id} suggestion={s} onDismiss={handleDismiss} />
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="section-fade-in">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Aufgaben heute</h3>
              <p className="text-xs text-slate-400">Eigene Prioritäten und mögliche Übernahmen</p>
            </div>
            <Badge label={`${todayView.todayTasks.length}`} color="purple" />
          </div>

          {todayView.todayTasks.length > 0 ? (
            <div className="space-y-4">
              {myTasks.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Deine Lane
                    </p>
                    <span className="text-xs text-slate-400">{myTasks.length} aktiv</span>
                  </div>
                  <div className="space-y-3">
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
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Hilfe für {memberName[otherUser]}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs text-indigo-500">
                      Übernehmen oder danken <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div className="space-y-3">
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
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/60 px-4 py-8 text-center">
              <p className="text-sm font-medium text-slate-500">Keine Aufgaben für heute 🎉</p>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <section className="section-fade-in">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Energieübersicht</h3>
              <p className="text-xs text-slate-400">Wer hat heute noch Spielraum?</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <EnergyOrb
                label="Mama"
                load={todayView.motherLoad}
                gradient={memberColorClass.mother}
              />
              <EnergyOrb
                label="Papa"
                load={todayView.fatherLoad}
                gradient={memberColorClass.father}
              />
            </div>
          </section>

          <Card
            onClick={() => toggleStressMode(currentUser)}
            className={`section-fade-in overflow-hidden ${
              state.stressMode.active
                ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-100'
                : 'bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  state.stressMode.active ? 'bg-yellow-100 text-yellow-600' : 'bg-white/12 text-yellow-300'
                }`}
              >
                <Zap className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3
                  className={`text-sm font-semibold ${
                    state.stressMode.active ? 'text-slate-800' : 'text-white'
                  }`}
                >
                  Stress-Modus
                </h3>
                <p
                  className={`mt-1 text-xs ${
                    state.stressMode.active ? 'text-slate-500' : 'text-white/70'
                  }`}
                >
                  {state.stressMode.active
                    ? 'Aktiv – nicht essentielle Aufgaben werden sofort entschärft.'
                    : 'Ein Tap reduziert Komplexität und schafft sofort mehr Übersicht.'}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      state.stressMode.active
                        ? 'bg-yellow-200 text-yellow-700'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    {state.stressMode.active ? 'Jetzt deaktivieren' : 'Jetzt aktivieren'}
                  </span>
                  <div
                    className={`flex h-7 w-12 items-center rounded-full px-1 transition-colors ${
                      state.stressMode.active ? 'bg-yellow-400 justify-end' : 'bg-white/25 justify-start'
                    }`}
                  >
                    <div className="h-5 w-5 rounded-full bg-white shadow" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
