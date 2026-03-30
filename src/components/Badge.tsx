interface BadgeProps {
  label: string;
  color?: 'pink' | 'blue' | 'purple' | 'green' | 'yellow' | 'red' | 'gray';
  size?: 'sm' | 'md';
}

const colorMap: Record<NonNullable<BadgeProps['color']>, string> = {
  pink: 'bg-pink-100 text-pink-700',
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-slate-100 text-slate-700',
};

const sizeMap: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
};

export function Badge({ label, color = 'gray', size = 'sm' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colorMap[color]} ${sizeMap[size]}`}>
      {label}
    </span>
  );
}
