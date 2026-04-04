import { useMemo } from 'react';
import {
  Zap,
  Heart,
  ArrowRightLeft,
  Battery,
  Users,
  Sparkles,
  Activity,
  Lightbulb,
} from 'lucide-react';
import type { FamilyMemberId } from '../../models/types';
import type { FamilyState } from '../../hooks/useFamilyState';
import {
  calculateFairnessScore,
  getFairnessBalance,
} from '../../engine/fairness';
import { familyMembers } from '../../data/family';
import { Card, Avatar, ProgressBar, Badge } from '../../components';

interface FamilyPageProps {
  state: FamilyState;
  toggleStressMode: (activatedBy: FamilyMemberId, reason?: string) => void;
  switchUser: (memberId: FamilyMemberId) => void;
}

const memberName: Record<FamilyMemberId, string> = {
  mother: 'Mama',
  father: 'Papa',
};

const productOpportunities = [
  'Suche und erweiterte Filter für Aufgaben, Meals und Historie fehlen aktuell.',
  'Stress-Modus nutzt noch keinen Grund und keine adaptive Timeline-Ansicht.',
  'Es gibt keine Verlaufscharts für Fairness, Completion-Rate oder Wochenvergleiche.',
  'Meal Planning hat noch keine Einkaufsliste, keine eigenen Rezepte und keine Portionierung.',
];

function getChargeStyles(chargeLevel: number) {
  if (chargeLevel < 30) {
    return {
      color: 'text-red-600',
      gradient: 'from-red-400 to-red-500',
    };
  }
  if (chargeLevel < 60) {
    return {
      color: 'text-yellow-600',
      gradient: 'from-yellow-400 to-orange-500',
    };
  }
  return {
    color: 'text-green-600',
    gradient: 'from-emerald-400 to-green-500',
  };
}

export function FamilyPage({ state, toggleStressMode, switchUser }: FamilyPageProps) {
  const motherRecords = useMemo(
    () => state.fairnessRecords.filter((r) => r.memberId === 'mother'),
    [state.fairnessRecords],
  );
  const fatherRecords = useMemo(
    () => state.fairnessRecords.filter((r) => r.memberId === 'father'),
    [state.fairnessRecords],
  );

  const motherScore = useMemo(() => calculateFairnessScore(motherRecords), [motherRecords]);
  const fatherScore = useMemo(() => calculateFairnessScore(fatherRecords), [fatherRecords]);
  const balance = useMemo(
    () => getFairnessBalance(motherScore, fatherScore),
    [motherScore, fatherScore],
  );

  const motherCompleted = state.tasks.filter(
    (t) => t.completed && t.completedBy === 'mother',
  ).length;
  const fatherCompleted = state.tasks.filter(
    (t) => t.completed && t.completedBy === 'father',
  ).length;
  const totalCompleted = motherCompleted + fatherCompleted;
  const openTasks = state.tasks.filter((task) => !task.completed).length;

  const chargeLevel = state.carResource.metadata.chargeLevel;
  const chargeStyles = getChargeStyles(chargeLevel);

  const needsChargeDays = state.carResource.metadata.needsChargeBefore;
  const DAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const chargeDayLabels = needsChargeDays.map((d) => DAY_NAMES[d]).join(', ');

  return (
    <div className="space-y-5 px-4 pb-28 pt-4">
      <Card className="section-fade-in overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.28),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.18),_transparent_28%)]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">Family pulse</p>
              <h2 className="mt-3 text-2xl font-bold">Balance, Teamgefühl und Ressourcen live</h2>
              <p className="mt-2 max-w-xl text-sm text-white/70">
                Die Familienseite bündelt Fairness, Wertschätzung, gemeinsame Last und die nächsten Produktchancen.
              </p>
            </div>
            <Badge label={balance.advantageMember === 'balanced' ? 'Balanced' : 'In Bewegung'} color="purple" />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="glass-panel rounded-3xl p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">Offene Tasks</p>
              <p className="mt-2 text-3xl font-bold text-white">{openTasks}</p>
              <p className="mt-1 text-xs text-white/75">noch im Flow dieser Woche</p>
            </div>
            <div className="glass-panel rounded-3xl p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">Erledigt</p>
              <p className="mt-2 text-3xl font-bold text-white">{totalCompleted}</p>
              <p className="mt-1 text-xs text-white/75">gemeinsam abgeschlossene Aufgaben</p>
            </div>
            <div className="glass-panel rounded-3xl p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">Dank & Hilfe</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {state.thankYous.length + state.takeOvers.length}
              </p>
              <p className="mt-1 text-xs text-white/75">Interaktionen, die Reibung reduzieren</p>
            </div>
          </div>
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <section className="section-fade-in">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Familie</h3>
                <p className="text-xs text-slate-400">Wer trägt wie viel und wie fühlt sich die Woche an?</p>
              </div>
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {familyMembers.map((member) => {
                const completed = member.id === 'mother' ? motherCompleted : fatherCompleted;
                const score = member.id === 'mother' ? motherScore : fatherScore;
                const isActive = state.currentUser === member.id;
                return (
                  <Card key={member.id} className="section-fade-in">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar memberId={member.id} size="lg" />
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{member.name}</p>
                          <p className="text-xs text-slate-500">{completed} Aufgaben erledigt</p>
                        </div>
                      </div>
                      <Badge
                        label={isActive ? 'Aktiv' : `${score.total} Pkt.`}
                        color={member.id === 'mother' ? 'pink' : 'blue'}
                      />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-slate-100/70 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fairness</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">{score.total}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-100/70 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Anteil</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                          {totalCompleted > 0 ? Math.round((completed / totalCompleted) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="section-fade-in">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Fairness</h3>
                <p className="text-xs text-slate-400">Visuelle Lastverteilung pro Bereich</p>
              </div>
              <Activity className="h-4 w-4 text-slate-400" />
            </div>
            <Card>
              <div className="space-y-5">
                <div className="rounded-[28px] bg-slate-950 px-4 py-4 text-center text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">Gesamtgefühl</p>
                  <p className="mt-2 text-2xl font-bold">
                    {balance.advantageMember === 'balanced'
                      ? 'Ausgewogen'
                      : `${balance.imbalancePercent}% Unterschied`}
                  </p>
                  <p className="mt-1 text-xs text-white/70">
                    {balance.advantageMember === 'balanced'
                      ? 'Beide tragen die Woche aktuell sehr ähnlich.'
                      : `${memberName[balance.advantageMember]} ist im Moment etwas weniger belastet.`}
                  </p>
                </div>

                <ProgressBar motherValue={motherScore.total} fatherValue={fatherScore.total} label="Gesamt" />
                <ProgressBar motherValue={motherScore.childcare} fatherValue={fatherScore.childcare} label="Kinderbetreuung" />
                <ProgressBar motherValue={motherScore.household} fatherValue={fatherScore.household} label="Haushalt" />
                <ProgressBar motherValue={motherScore.mentalLoad} fatherValue={fatherScore.mentalLoad} label="Mental Load" />
                <ProgressBar motherValue={motherScore.pets} fatherValue={fatherScore.pets} label="Tiere" />
              </div>
            </Card>
          </section>
        </div>

        <div className="space-y-4">
          <section className="section-fade-in">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Wochenrückblick</h3>
                <p className="text-xs text-slate-400">Dankbarkeit und spontane Entlastung</p>
              </div>
              <Sparkles className="h-4 w-4 text-slate-400" />
            </div>
            <Card>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-pink-50 p-3">
                    <div className="flex items-center gap-2 text-pink-500">
                      <Heart className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Dankeschöns</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{state.thankYous.length}</p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-3">
                    <div className="flex items-center gap-2 text-blue-500">
                      <ArrowRightLeft className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Übernahmen</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{state.takeOvers.length}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Letzte Signale</p>
                  <div className="mt-3 space-y-2">
                    {state.thankYous.slice(-3).map((ty) => (
                      <div key={ty.id} className="rounded-2xl bg-slate-100/70 px-3 py-2 text-sm text-slate-600">
                        {memberName[ty.from]} → {memberName[ty.to]}
                        {ty.message && `: "${ty.message}"`}
                      </div>
                    ))}
                    {state.takeOvers.slice(-2).map((to) => {
                      const task = state.tasks.find((t) => t.id === to.taskId);
                      return (
                        <div key={to.id} className="rounded-2xl bg-slate-100/70 px-3 py-2 text-sm text-slate-600">
                          {memberName[to.to]} übernimmt {task ? `„${task.title}“` : 'eine Aufgabe'} von {memberName[to.from]}
                        </div>
                      );
                    })}
                    {state.thankYous.length === 0 && state.takeOvers.length === 0 && (
                      <p className="text-sm text-slate-400">Noch keine Interaktionen gespeichert.</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section className="section-fade-in">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Ressourcen</h3>
                <p className="text-xs text-slate-400">Fahrbereitschaft und kritische Tage</p>
              </div>
              <Battery className={`h-4 w-4 ${chargeStyles.color}`} />
            </div>
            <Card>
              <div className="flex items-start gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${chargeStyles.gradient} text-white shadow-lg`}>
                  <Battery className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{state.carResource.name}</p>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`progress-shimmer h-full rounded-full bg-gradient-to-r ${chargeStyles.gradient}`}
                      style={{ width: `${chargeLevel}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Ladestand</span>
                    <span className={`font-semibold ${chargeStyles.color}`}>{chargeLevel}%</span>
                  </div>
                  {needsChargeDays.length > 0 && (
                    <p className="mt-3 text-xs text-slate-500">Laden vor: {chargeDayLabels}</p>
                  )}
                </div>
              </div>
            </Card>
          </section>

          <section className="section-fade-in">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Produktchancen</h3>
                <p className="text-xs text-slate-400">Was der aktuelle Tool-Stand noch vermissen lässt</p>
              </div>
              <Lightbulb className="h-4 w-4 text-amber-500" />
            </div>
            <Card>
              <div className="space-y-3">
                {productOpportunities.map((item) => (
                  <div key={item} className="rounded-2xl bg-amber-50 px-3 py-3 text-sm text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </div>
      </section>

      <section className="section-fade-in">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Einstellungen</h3>
            <p className="text-xs text-slate-400">Schnelle Schalter für den Alltag</p>
          </div>
          <Users className="h-4 w-4 text-slate-400" />
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Card
            onClick={() => toggleStressMode(state.currentUser)}
            className={`overflow-hidden ${
              state.stressMode.active
                ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-100'
                : 'bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  state.stressMode.active ? 'bg-yellow-100 text-yellow-600' : 'bg-white/12 text-yellow-300'
                }`}
              >
                <Zap className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${state.stressMode.active ? 'text-slate-900' : 'text-white'}`}>
                  Stress-Modus
                </p>
                <p className={`mt-1 text-xs ${state.stressMode.active ? 'text-slate-500' : 'text-white/70'}`}>
                  {state.stressMode.active ? 'Aktiviert für schnelle Entlastung' : 'Aktiviere bei Bedarf einen einfacheren Tagesmodus'}
                </p>
              </div>
              <div
                className={`flex h-7 w-12 items-center rounded-full px-1 ${
                  state.stressMode.active ? 'bg-yellow-400 justify-end' : 'bg-white/25 justify-start'
                }`}
              >
                <div className="h-5 w-5 rounded-full bg-white shadow" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-slate-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Aktiver Benutzer</p>
                <p className="text-xs text-slate-500">{memberName[state.currentUser]}</p>
              </div>
              <div className="flex gap-2">
                {familyMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      switchUser(member.id);
                    }}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      state.currentUser === member.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
