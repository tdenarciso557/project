import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDayLabel, formatDateTime, formatTime } from '@/lib/format';
import type { Slot } from '@/lib/types';
import { errorTextClass, inputClass, labelClass, primaryButtonClass } from '@/lib/ui';

interface BookingModalProps {
  slot: Slot;
  onClose: () => void;
  onBooked: () => void;
}

const DUPLICATE_BOOKING_CODE = '23505';

export default function BookingModal({ slot, onClose, onBooked }: BookingModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName || !trimmedPhone) {
      setError('Preencha seu nome e telefone.');
      return;
    }

    setSubmitting(true);
    setError(null);
    const { error: insertError } = await supabase.from('appointments').insert({
      slot_id: slot.id,
      client_name: trimmedName,
      client_phone: trimmedPhone,
    });
    setSubmitting(false);

    if (insertError) {
      setError(
        insertError.code === DUPLICATE_BOOKING_CODE
          ? 'Este horário acabou de ser reservado. Escolha outro.'
          : 'Não foi possível concluir o agendamento. Tente novamente.'
      );
      return;
    }
    setBooked(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/50 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-700">{formatDayLabel(slot.starts_at)}</p>
            <h2 className="text-xl font-semibold tracking-tight text-stone-900">
              Reservar às {formatTime(slot.starts_at)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
          >
            <X size={20} />
          </button>
        </div>

        {booked ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle2 size={48} className="text-emerald-600" />
            <div>
              <p className="text-lg font-semibold text-stone-900">Solicitação enviada</p>
              <p className="mt-1 text-sm text-stone-600">
                Seu pedido para {formatDateTime(slot.starts_at)} foi recebido e aguarda aprovação.
              </p>
            </div>
            <button type="button" onClick={onBooked} className={`${primaryButtonClass} w-full`}>
              Concluir
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="client-name" className={labelClass}>
                Nome completo
              </label>
              <input
                id="client-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                autoComplete="name"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="client-phone" className={labelClass}>
                Telefone
              </label>
              <input
                id="client-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                maxLength={30}
                autoComplete="tel"
                className={inputClass}
              />
            </div>
            {error && <p className={errorTextClass}>{error}</p>}
            <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-full`}>
              {submitting ? 'Reservando...' : 'Confirmar agendamento'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
