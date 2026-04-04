import { Sparkles, Zap } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import type { FamilyMemberId } from '../models/types';
import { Avatar } from './Avatar';

interface HeaderProps {
  currentUser: FamilyMemberId;
  onSwitchUser: (memberId: FamilyMemberId) => void;
  stressMode: boolean;
}

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Heute im Fokus', subtitle: 'Live-Überblick für Aufgaben, Energie und Balance' },
  '/calendar': { title: 'Familienkalender', subtitle: 'Alle Wege, Termine und Übergaben in einer Sicht' },
  '/tasks': { title: 'Aufgabenboard', subtitle: 'Prioritäten, Ownership und Fairness auf einen Blick' },
  '/meals': { title: 'Meal Flow', subtitle: 'Essensplanung mit mehr Überblick und weniger Stress' },
  '/family': { title: 'Familienstatus', subtitle: 'Fairness, Ressourcen und Wochenrückblick' },
  '/admin': { title: 'Admin & Store', subtitle: 'Punkte, Aufgaben und Rewards elegant steuern' },
};

export function Header({ currentUser, onSwitchUser, stressMode }: HeaderProps) {
  const location = useLocation();
  const toggleUser = () => {
    onSwitchUser(currentUser === 'mother' ? 'father' : 'mother');
  };
  const isMother = currentUser === 'mother';
  const currentMeta = pageMeta[location.pathname] ?? pageMeta['/'];

  return (
    <header className="sticky top-0 z-30 px-4 pt-3">
      <div className="glass-panel section-fade-in rounded-[28px] border border-white/70 px-4 py-3 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="glow-pill inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 text-white shadow-lg">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-500">
                  FamilyOS
                </p>
                <h1 className="truncate text-base font-bold text-slate-900">{currentMeta.title}</h1>
              </div>
            </div>
            <p className="max-w-[18rem] text-xs text-slate-500">{currentMeta.subtitle}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  isMother
                    ? 'bg-pink-100/80 text-pink-700'
                    : 'bg-blue-100/80 text-blue-700'
                }`}
              >
                Aktiv: {isMother ? 'Mama' : 'Papa'}
              </span>
              {stressMode && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-yellow-100 text-yellow-700 px-3 py-1 text-xs font-semibold"
                  title="Stress-Modus aktiv"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Stress aktiv
                </span>
              )}
            </div>
          </div>

          <button
            onClick={toggleUser}
            className="glass-panel flex min-h-[52px] min-w-[92px] items-center justify-center gap-2 rounded-2xl px-3 py-2 text-left shadow-sm transition hover:-translate-y-0.5"
            aria-label={`Wechsle zu ${isMother ? 'Papa' : 'Mama'}`}
          >
            <Avatar memberId={currentUser} size="sm" />
            <div className="hidden min-[380px]:block">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Switch</p>
              <p className="text-sm font-semibold text-slate-700">{isMother ? 'Mama' : 'Papa'}</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
