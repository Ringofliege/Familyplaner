import { useMemo } from 'react';
import { Zap, Heart, ArrowRightLeft, Battery, Users } from 'lucide-react';
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

  const chargeLevel = state.carResource.metadata.chargeLevel;
  const chargeColor =
    chargeLevel < 30 ? 'text-red-600' : chargeLevel < 60 ? 'text-yellow-600' : 'text-green-600';
  const chargeBg =
    chargeLevel < 30 ? 'bg-red-500' : chargeLevel < 60 ? 'bg-yellow-500' : 'bg-green-500';

  const needsChargeDays = state.carResource.metadata.needsChargeBefore;
  const DAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const chargeDayLabels = needsChargeDays.map((d) => DAY_NAMES[d]).join(', ');

  return (
    <div className="pb-20 px-4 space-y-4 pt-4">
      {/* Family members */}
      <section>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Familie</h3>
        <div className="grid grid-cols-2 gap-3">
          {familyMembers.map((member) => {
            const completed =
              member.id === 'mother' ? motherCompleted : fatherCompleted;
            const score =
              member.id === 'mother' ? motherScore : fatherScore;
            return (
              <Card key={member.id} className="text-center">
                <div className="flex flex-col items-center gap-2">
                  <Avatar memberId={member.id} size="lg" showName />
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">
                      {completed} Aufgaben erledigt
                    </p>
                    <p className="text-xs text-slate-500">
                      {score.total} Fairness-Punkte
                    </p>
                    <Badge
                      label={score.total > 0 ? `${score.total} Pkt.` : 'Keine Daten'}
                      color={member.id === 'mother' ? 'pink' : 'blue'}
                      size="sm"
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Fairness dashboard */}
      <section>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Fairness</h3>
        <Card>
          <div className="space-y-4">
            <div>
              <ProgressBar
                motherValue={motherScore.total}
                fatherValue={fatherScore.total}
                label="Gesamt"
              />
              <p className="text-xs text-slate-500 mt-1 text-center">
                {balance.advantageMember === 'balanced'
                  ? '✅ Ausgewogen'
                  : `⚖️ ${balance.imbalancePercent}% Unterschied – ${
                      memberName[balance.advantageMember]
                    } ist weniger belastet`}
              </p>
            </div>

            <ProgressBar
              motherValue={motherScore.childcare}
              fatherValue={fatherScore.childcare}
              label="Kinderbetreuung"
            />
            <ProgressBar
              motherValue={motherScore.household}
              fatherValue={fatherScore.household}
              label="Haushalt"
            />
            <ProgressBar
              motherValue={motherScore.mentalLoad}
              fatherValue={fatherScore.mentalLoad}
              label="Mental Load"
            />
            <ProgressBar
              motherValue={motherScore.pets}
              fatherValue={fatherScore.pets}
              label="Tiere"
            />
          </div>
        </Card>
      </section>

      {/* Weekly review */}
      <section>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Wochenrückblick</h3>
        <Card>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Aufgaben erledigt</span>
              <span className="text-sm font-bold text-slate-800">{totalCompleted}</span>
            </div>

            {/* Thank Yous */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Heart className="w-4 h-4 text-pink-500" />
                <span className="text-sm text-slate-600">
                  Dankeschöns ({state.thankYous.length})
                </span>
              </div>
              {state.thankYous.length > 0 ? (
                <div className="space-y-1 ml-5.5">
                  {state.thankYous.slice(-5).map((ty) => (
                    <p key={ty.id} className="text-xs text-slate-500">
                      {memberName[ty.from]} → {memberName[ty.to]}
                      {ty.message && `: "${ty.message}"`}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 ml-6">Noch keine Dankeschöns</p>
              )}
            </div>

            {/* Take Overs */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-slate-600">
                  Übernahmen ({state.takeOvers.length})
                </span>
              </div>
              {state.takeOvers.length > 0 ? (
                <div className="space-y-1 ml-6">
                  {state.takeOvers.slice(-5).map((to) => {
                    const task = state.tasks.find((t) => t.id === to.taskId);
                    return (
                      <p key={to.id} className="text-xs text-slate-500">
                        {memberName[to.to]} übernimmt{' '}
                        {task ? `"${task.title}"` : 'eine Aufgabe'} von{' '}
                        {memberName[to.from]}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 ml-6">Noch keine Übernahmen</p>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* Resources – Car */}
      <section>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Ressourcen</h3>
        <Card>
          <div className="flex items-center gap-3">
            <Battery className={`w-6 h-6 ${chargeColor}`} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">
                {state.carResource.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${chargeBg}`}
                    style={{ width: `${chargeLevel}%` }}
                  />
                </div>
                <span className={`text-sm font-bold ${chargeColor}`}>
                  {chargeLevel}%
                </span>
              </div>
              {needsChargeDays.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Laden vor: {chargeDayLabels} (Bürotage)
                </p>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* Settings-like section */}
      <section>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Einstellungen</h3>

        {/* Stress Mode toggle */}
        <Card
          onClick={() => toggleStressMode(state.currentUser)}
          className={`mb-3 ${
            state.stressMode.active
              ? 'border-2 border-yellow-400 bg-yellow-50'
              : 'border border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <Zap
              className={`w-5 h-5 ${
                state.stressMode.active ? 'text-yellow-600' : 'text-slate-400'
              }`}
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">Stress-Modus</p>
              <p className="text-xs text-slate-500">
                {state.stressMode.active ? 'Aktiv' : 'Inaktiv'}
              </p>
            </div>
            <div
              className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${
                state.stressMode.active
                  ? 'bg-yellow-400 justify-end'
                  : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-5 h-5 bg-white rounded-full shadow" />
            </div>
          </div>
        </Card>

        {/* User switcher */}
        <Card>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-slate-400" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">Aktiver Benutzer</p>
              <p className="text-xs text-slate-500">
                {memberName[state.currentUser]}
              </p>
            </div>
            <div className="flex gap-2">
              {familyMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    switchUser(member.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
      </section>
    </div>
  );
}
