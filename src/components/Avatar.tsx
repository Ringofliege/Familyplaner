import type { FamilyMemberId } from '../models/types';

interface AvatarProps {
  memberId: FamilyMemberId;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

const memberConfig: Record<FamilyMemberId, { initial: string; name: string; bgClass: string }> = {
  mother: { initial: 'M', name: 'Mama', bgClass: 'bg-pink-500' },
  father: { initial: 'P', name: 'Papa', bgClass: 'bg-blue-500' },
};

const sizeMap: Record<NonNullable<AvatarProps['size']>, { circle: string; text: string }> = {
  sm: { circle: 'w-8 h-8', text: 'text-xs' },
  md: { circle: 'w-10 h-10', text: 'text-sm' },
  lg: { circle: 'w-14 h-14', text: 'text-lg' },
};

export function Avatar({ memberId, size = 'md', showName = false }: AvatarProps) {
  const config = memberConfig[memberId];
  const sizeStyles = sizeMap[size];

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${sizeStyles.circle} ${config.bgClass} rounded-full flex items-center justify-center text-white font-semibold ${sizeStyles.text}`}
      >
        {config.initial}
      </div>
      {showName && (
        <span className="text-xs text-slate-600">{config.name}</span>
      )}
    </div>
  );
}
