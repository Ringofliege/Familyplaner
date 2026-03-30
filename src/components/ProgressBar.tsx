interface ProgressBarProps {
  motherValue: number;
  fatherValue: number;
  label?: string;
}

export function ProgressBar({ motherValue, fatherValue, label }: ProgressBarProps) {
  const total = motherValue + fatherValue;
  const motherPct = total > 0 ? Math.round((motherValue / total) * 100) : 50;
  const fatherPct = total > 0 ? 100 - motherPct : 50;

  return (
    <div className="w-full">
      {label && (
        <p className="text-sm font-medium text-slate-700 mb-1">{label}</p>
      )}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-pink-600 w-9 text-right">
          {motherPct}%
        </span>
        <div className="flex-1 h-3 rounded-full overflow-hidden flex bg-slate-100">
          <div
            className="bg-pink-500 transition-all duration-300"
            style={{ width: `${motherPct}%` }}
          />
          <div
            className="bg-blue-500 transition-all duration-300"
            style={{ width: `${fatherPct}%` }}
          />
        </div>
        <span className="text-xs font-medium text-blue-600 w-9">
          {fatherPct}%
        </span>
      </div>
    </div>
  );
}
