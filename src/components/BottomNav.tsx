import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, CheckSquare, Home, UtensilsCrossed, Users } from 'lucide-react';

const tabs = [
  { path: '/', label: 'Heute', icon: Home },
  { path: '/calendar', label: 'Kalender', icon: Calendar },
  { path: '/tasks', label: 'Aufgaben', icon: CheckSquare },
  { path: '/meals', label: 'Essen', icon: UtensilsCrossed },
  { path: '/family', label: 'Familie', icon: Users },
] as const;

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
      <div className="glass-panel mx-auto flex h-18 max-w-xl items-center justify-around rounded-[28px] border border-white/70 px-2 shadow-[0_28px_65px_-36px_rgba(15,23,42,0.55)]">
        {tabs.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex min-h-[56px] min-w-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-3 transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-400 hover:bg-white/60 hover:text-slate-700'
              }`}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-semibold tracking-wide">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
