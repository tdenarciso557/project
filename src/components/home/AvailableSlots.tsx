import { useMemo, useState } from 'react';
import { CalendarX, RefreshCw } from 'lucide-react';
import WeekNavigator from '@/components/WeekNavigator';
import { formatDayLabel, formatTime } from '@/lib/format';
import type { LoadStatus, Slot } from '@/lib/types';
import { getWeekRange } from '@/lib/week';

interface AvailableSlotsProps {
  slots: Slot[];
  status: LoadStatus;
  onRetry: () => void;
  onSelect: (slot: Slot) => void;
}

export default function AvailableSlots({ slots, status, onRetry, onSelect }: AvailableSlotsProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const { startMs, endMs } = getWeekRange(weekOffset);

  const groups = useMemo(() => {
    const byDay = new Map<string, Slot[]>();
    for (const slot of slots) {
      const startsAtMs = new Date(slot.starts_at).getTime();
      if (startsAtMs < startMs || startsAtMs >= endMs) continue;
      const day = formatDayLabel(slot.starts_at);
      byDay.set(day, [...(byDay.get(day) ?? []), slot]);
    }
    return Array.from(byDay.entries());
  }, [slots, startMs, endMs]);

  if (status === 'loading') {
    return <p className="py-10 text-center text-stone-500">Carregando horários...</p>;
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-stone-700">Não foi possível carregar os horários.</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-100"
        >
          <RefreshCw size={16} /> Tentar novamente
        </button>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="space-y-6">
        <WeekNavigator weekOffset={weekOffset} onChange={setWeekOffset} />
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <CalendarX size={36} className="text-stone-400" />
          <p className="text-stone-600">Nenhum horário nesta semana.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <WeekNavigator weekOffset={weekOffset} onChange={setWeekOffset} />
      {groups.map(([day, daySlots]) => (
        <div key={day}>
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-sm font-semibold capitalize text-stone-800">{day}</h3>
            <span className="h-px flex-1 bg-stone-200" />
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
            {daySlots.map((slot) =>
              slot.booked ? (
                <div
                  key={slot.id}
                  aria-disabled="true"
                  className="cursor-not-allowed rounded-xl border border-stone-200 bg-stone-100 px-3 py-3 text-stone-500"
                >
                  <p className="text-sm font-medium line-through decoration-stone-400">
                    {formatTime(slot.starts_at)}
                  </p>
                  <p className="mt-0.5 text-xs font-medium">Reservado</p>
                  {slot.professor_name && (
                    <p className="mt-1 truncate text-xs text-stone-500">{slot.professor_name}</p>
                  )}
                </div>
              ) : (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => onSelect(slot)}
                  className="group rounded-xl border border-emerald-200 bg-white px-3 py-3 text-left text-stone-800 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-600 hover:bg-emerald-700 hover:shadow-md active:translate-y-0 active:scale-[0.98]"
                >
                  <p className="text-sm font-semibold group-hover:text-white">{formatTime(slot.starts_at)}</p>
                  <p className="mt-0.5 text-xs font-medium text-emerald-700 group-hover:text-emerald-100">
                    Disponível
                  </p>
                  {slot.professor_name && (
                    <p className="mt-1 truncate text-xs text-stone-500 group-hover:text-emerald-100">
                      {slot.professor_name}
                    </p>
                  )}
                </button>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
