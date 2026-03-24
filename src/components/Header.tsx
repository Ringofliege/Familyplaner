import { Zap } from 'lucide-react';
import type { FamilyMemberId } from '../models/types';
import { Avatar } from './Avatar';

interface HeaderProps {
  currentUser: FamilyMemberId;
  onSwitchUser: (memberId: FamilyMemberId) => void;
  stressMode: boolean;
}

export function Header({ currentUser, onSwitchUser, stressMode }: HeaderProps) {
  const toggleUser = () => {
    onSwitchUser(currentUser === 'mother' ? 'father' : 'mother');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-slate-800">FamilyOS</h1>
          {stressMode && (
            <span
              className="flex items-center gap-1 rounded-full bg-yellow-100 text-yellow-700 px-2 py-0.5 text-xs font-semibold"
              title="Stress-Modus aktiv"
            >
              <Zap className="w-3.5 h-3.5" />
              Stress
            </span>
          )}
        </div>

        <button
          onClick={toggleUser}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={`Wechsle zu ${currentUser === 'mother' ? 'Papa' : 'Mama'}`}
        >
          <Avatar memberId={currentUser} size="sm" />
        </button>
      </div>
    </header>
  );
}
