import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Lock, Trash2 } from 'lucide-react';
import WeekNavigator from '@/components/WeekNavigator';
import { supabase } from '@/lib/supabase';
import { formatDayLabel, formatTime } from '@/lib/format';
import { SLOT_COLUMNS, toSlot, type SlotRow } from '@/lib/slots';
import type { Professor, Slot } from '@/lib/types';
import { errorTextClass, inputClass } from '@/lib/ui';
import { getWeekRange } from '@/lib/week';

interface SlotManagerProps {
  refreshKey: number;
  onChanged: () => void;
}

export default function SlotManager({ refreshKey, onChanged }: SlotManagerProps) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadSlots = useCallback(async () => {
    setLoading(true);
    const { error: ensureError } = await supabase.rpc('ensure_default_slots');
    if (ensureError) {
      setLoadError(true);
      setLoading(false);
      return;
    }
    const [slotsResult, professorsResult] = await Promise.all([
      supabase
        .from('availability_slots')
        .select(SLOT_COLUMNS)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true }),
      supabase.from('professors').select('id, name').order('name', { ascending: true }),
    ]);
    if (slotsResult.error || !slotsResult.data || professorsResult.error || !professorsResult.data) {
      setLoadError(true);
    } else {
      setSlots((slotsResult.data as unknown as SlotRow[]).map(toSlot));
      setProfessors(professorsResult.data as Professor[]);
      setLoadError(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSlots();
  }, [loadSlots, refreshKey]);

  const { startMs, endMs } = getWeekRange(weekOffset);
  const weekSlots = useMemo(
    () =>
      slots.filter((slot) => {
        const startsAtMs = new Date(slot.starts_at).getTime();
        return startsAtMs >= startMs && startsAtMs < endMs;
      }),
    [slots, startMs, endMs]
  );

  async function handleAssignProfessor(slot: Slot, professorId: string) {
    setActionError(null);
    const { error } = await supabase
      .from('availability_slots')
      .update({ professor_id: professorId || null })
      .eq('id', slot.id);
    if (error) {
      setActionError('Não foi possível definir o professor deste horário. Tente novamente.');
      return;
    }
    onChanged();
  }

  async function handleRemove(slot: Slot) {
    setActionError(null);
    const { error } = await supabase.from('availability_slots').delete().eq('id', slot.id);
    if (error) {
      setActionError('Não foi possível remover este horário. Tente novamente.');
      return;
    }
    onChanged();
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">Horários da semana</h2>
      <p className="mt-1 text-sm text-stone-600">
        Os horários são abertos automaticamente. Remova apenas os que não devem receber clientes.
      </p>

      <div className="mt-5">
        <WeekNavigator weekOffset={weekOffset} onChange={setWeekOffset} />
      </div>

      {actionError && <p className={`${errorTextClass} mt-3`}>{actionError}</p>}

      {loading && <p className="py-8 text-center text-stone-500">Carregando horários...</p>}

      {!loading && loadError && (
        <div className="py-8 text-center">
          <p className="text-stone-700">Não foi possível carregar os horários.</p>
          <button
            type="button"
            onClick={loadSlots}
            className="mt-3 text-sm font-medium text-emerald-700 hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !loadError && weekSlots.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <CalendarDays size={36} className="text-stone-400" />
          <p className="text-stone-600">Nenhum horário nesta semana.</p>
        </div>
      )}

      {!loading && !loadError && weekSlots.length > 0 && (
        <ul className="mt-4 divide-y divide-stone-100">
          {weekSlots.map((slot) => (
            <li key={slot.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-medium capitalize text-stone-900">{formatDayLabel(slot.starts_at)}</p>
                <p className="text-sm text-stone-600">{formatTime(slot.starts_at)}</p>
                <select
                  value={slot.professor_id ?? ''}
                  onChange={(event) => handleAssignProfessor(slot, event.target.value)}
                  aria-label={`Professor do horário de ${formatTime(slot.starts_at)}`}
                  disabled={professors.length === 0}
                  className={`${inputClass} mt-2 py-1.5 text-sm`}
                >
                  <option value="">
                    {professors.length === 0 ? 'Cadastre um professor primeiro' : 'Sem professor'}
                  </option>
                  {professors.map((professor) => (
                    <option key={professor.id} value={professor.id}>
                      {professor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {slot.booked ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900">
                    Reservado
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-900">
                    Livre
                  </span>
                )}
                {slot.booked ? (
                  <span
                    className="rounded-lg p-2 text-stone-400"
                    title="Cancele o agendamento para remover este horário"
                  >
                    <Lock size={16} />
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRemove(slot)}
                    aria-label="Remover horário"
                    className="rounded-lg p-2 text-stone-500 transition hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
