import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { LoadStatus, Notice, Slot } from '@/lib/types';
import AvailableSlots from '@/components/home/AvailableSlots';
import BookingModal from '@/components/home/BookingModal';
import NoticeBoard from '@/components/home/NoticeBoard';

export default function HomePage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsStatus, setSlotsStatus] = useState<LoadStatus>('loading');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticesStatus, setNoticesStatus] = useState<LoadStatus>('loading');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const loadSlots = useCallback(async () => {
    setSlotsStatus('loading');
    const { error: ensureError } = await supabase.rpc('ensure_default_slots');
    if (ensureError) {
      setSlotsStatus('error');
      return;
    }
    const { data, error } = await supabase
      .from('availability_slots')
      .select('id, starts_at, booked')
      .eq('booked', false)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true });
    if (error || !data) {
      setSlotsStatus('error');
      return;
    }
    setSlots(data as Slot[]);
    setSlotsStatus('ready');
  }, []);

  const loadNotices = useCallback(async () => {
    setNoticesStatus('loading');
    const { data, error } = await supabase
      .from('notices')
      .select('id, title, body, created_at')
      .order('created_at', { ascending: false });
    if (error || !data) {
      setNoticesStatus('error');
      return;
    }
    setNotices(data as Notice[]);
    setNoticesStatus('ready');
  }, []);

  useEffect(() => {
    loadSlots();
    loadNotices();
  }, [loadSlots, loadNotices]);

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white">
            <CalendarCheck size={20} />
          </span>
          <span className="text-lg font-semibold tracking-tight">Agendamento Online</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <section className="mb-10 max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            Escolha o melhor horário para você
          </h1>
          <p className="mt-3 text-base leading-relaxed text-stone-600">
            Veja os horários disponíveis, selecione um deles e confirme seu agendamento em poucos segundos.
          </p>
        </section>

        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <section aria-labelledby="slots-title">
            <h2 id="slots-title" className="mb-5 text-xl font-semibold tracking-tight">
              Horários disponíveis
            </h2>
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
              <AvailableSlots
                slots={slots}
                status={slotsStatus}
                onRetry={loadSlots}
                onSelect={setSelectedSlot}
              />
            </div>
          </section>

          <section aria-labelledby="notices-title">
            <h2 id="notices-title" className="mb-5 text-xl font-semibold tracking-tight">
              Avisos
            </h2>
            <NoticeBoard notices={notices} status={noticesStatus} onRetry={loadNotices} />
          </section>
        </div>
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-end px-4 py-5 sm:px-6">
          <a
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-emerald-700"
          >
            <ShieldCheck size={16} /> Área do administrador
          </a>
        </div>
      </footer>

      {selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onBooked={() => {
            setSelectedSlot(null);
            loadSlots();
          }}
        />
      )}
    </div>
  );
}
