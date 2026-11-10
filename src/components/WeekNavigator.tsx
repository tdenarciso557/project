import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatShortDate } from '@/lib/format';
import { getWeekRange } from '@/lib/week';

interface WeekNavigatorProps {
  weekOffset: number;
  onChange: (weekOffset: number) => void;
}

export default function WeekNavigator({ weekOffset, onChange }: WeekNavigatorProps) {
  const { start, lastDay } = getWeekRange(weekOffset);

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => onChange(weekOffset - 1)}
        disabled={weekOffset === 0}
        aria-label="Semana anterior"
        className="rounded-lg border border-stone-300 bg-white p-2 text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
      >
        <ChevronLeft size={18} />
      </button>
      <p className="text-center text-sm font-medium text-stone-700">
        {formatShortDate(start)} a {formatShortDate(lastDay)}
      </p>
      <button
        type="button"
        onClick={() => onChange(weekOffset + 1)}
        aria-label="Próxima semana"
        className="rounded-lg border border-stone-300 bg-white p-2 text-stone-700 transition hover:bg-stone-100"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
