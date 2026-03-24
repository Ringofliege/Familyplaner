import { X, ChevronRight } from 'lucide-react';
import type { Suggestion, SuggestionPriority } from '../models/types';
import { Card } from './Card';

interface SuggestionCardProps {
  suggestion: Suggestion;
  onDismiss?: (id: string) => void;
  onAccept?: (id: string) => void;
}

const priorityBorderColor: Record<SuggestionPriority, string> = {
  urgent: 'border-l-red-500',
  high: 'border-l-yellow-500',
  medium: 'border-l-blue-500',
  low: 'border-l-slate-400',
};

export function SuggestionCard({ suggestion, onDismiss, onAccept }: SuggestionCardProps) {
  return (
    <Card className={`border-l-4 ${priorityBorderColor[suggestion.priority]}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-800">
            {suggestion.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
            {suggestion.description}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onDismiss && (
            <button
              onClick={() => onDismiss(suggestion.id)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 active:bg-slate-200 transition-colors"
              aria-label="Vorschlag ausblenden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          {onAccept && (
            <button
              onClick={() => onAccept(suggestion.id)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors"
              aria-label="Vorschlag annehmen"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
