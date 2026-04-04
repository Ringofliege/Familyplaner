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
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">{label}</p>
          <p className="text-xs text-slate-400">{motherValue + fatherValue} Punkte</p>
        </div>
      )}
      <div className="flex items-center gap-3">
        <span className="w-10 text-right text-xs font-semibold text-pink-600">
          {motherPct}%
        </span>
        <div className="progress-shimmer glass-panel flex h-4 flex-1 overflow-hidden rounded-full bg-slate-100/70">
          <div
            className="bg-gradient-to-r from-pink-400 via-pink-500 to-fuchsia-500 transition-all duration-500"
            style={{ width: `${motherPct}%` }}
          />
          <div
            className="bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${fatherPct}%` }}
          />
        </div>
        <span className="w-10 text-xs font-semibold text-blue-600">
          {fatherPct}%
        </span>
      </div>
    </div>
  );
}
