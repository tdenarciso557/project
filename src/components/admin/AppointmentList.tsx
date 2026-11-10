import { useCallback, useEffect, useState } from 'react';
import { Check, CalendarDays, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDayLabel, formatTime } from '@/lib/format';
import type { Appointment } from '@/lib/types';
import { errorTextClass } from '@/lib/ui';

interface AppointmentListProps {
  refreshKey: number;
  onChanged: () => void;
}

export default function AppointmentList({ refreshKey, onChanged }: AppointmentListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('id, slot_id, client_name, client_phone, status, created_at, availability_slots(starts_at)')
      .order('created_at', { ascending: false });
    if (error || !data) {
      setLoadError(true);
    } else {
      setAppointments(data as unknown as Appointment[]);
      setLoadError(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments, refreshKey]);

  const upcoming = appointments
    .filter((item) => item.availability_slots && new Date(item.availability_slots.starts_at) >= new Date())
    .sort((a, b) =>
      (a.availability_slots?.starts_at ?? '').localeCompare(b.availability_slots?.starts_at ?? '')
    );

  async function handleApprove(appointment: Appointment) {
    setActionError(null);
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'approved' })
      .eq('id', appointment.id);
    if (error) {
      setActionError('Não foi possível aprovar o agendamento. Tente novamente.');
      return;
    }
    onChanged();
  }

  async function handleCancel(appointment: Appointment) {
    if (!window.confirm(`Cancelar o agendamento de ${appointment.client_name}?`)) return;
    setActionError(null);
    const { error } = await supabase.from('appointments').delete().eq('id', appointment.id);
    if (error) {
      setActionError('Não foi possível cancelar o agendamento. Tente novamente.');
      return;
    }
    onChanged();
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">Agendamentos</h2>
      <p className="mt-1 text-sm text-stone-600">Pedidos de clientes para horários a partir de hoje.</p>
      {actionError && <p className={`${errorTextClass} mt-3`}>{actionError}</p>}

      {loading && <p className="py-8 text-center text-stone-500">Carregando agendamentos...</p>}

      {!loading && loadError && (
        <div className="py-8 text-center">
          <p className="text-stone-700">Não foi possível carregar os agendamentos.</p>
          <button
            type="button"
            onClick={loadAppointments}
            className="mt-3 text-sm font-medium text-emerald-700 hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !loadError && upcoming.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <CalendarDays size={36} className="text-stone-400" />
          <p className="text-stone-600">Nenhum agendamento futuro.</p>
        </div>
      )}

      {!loading && !loadError && upcoming.length > 0 && (
        <ul className="mt-4 divide-y divide-stone-100">
          {upcoming.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-stone-900">{item.client_name}</p>
                <p className="text-sm text-stone-600">{item.client_phone}</p>
                {item.availability_slots && (
                  <p className="mt-1 text-sm capitalize text-emerald-800">
                    {formatDayLabel(item.availability_slots.starts_at)} às{' '}
                    {formatTime(item.availability_slots.starts_at)}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {item.status === 'pending' ? (
                  <button
                    type="button"
                    onClick={() => handleApprove(item)}
                    aria-label={`Aprovar agendamento de ${item.client_name}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-800"
                  >
                    <Check size={14} /> Aprovar
                  </button>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-900">
                    Aprovado
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleCancel(item)}
                  aria-label={`Cancelar agendamento de ${item.client_name}`}
                  className="rounded-lg p-2 text-stone-500 transition hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
