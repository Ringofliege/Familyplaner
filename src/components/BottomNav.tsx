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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] gap-0.5 transition-colors ${
                isActive ? 'text-blue-600' : 'text-slate-400'
              }`}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
