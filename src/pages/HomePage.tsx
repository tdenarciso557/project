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
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3.5 sm:px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
            <CalendarCheck size={20} />
          </span>
          <div className="leading-tight">
            <p className="text-base font-semibold tracking-tight">Agendamento Online</p>
            <p className="text-xs text-stone-500">Marque seu horário em poucos cliques</p>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Agenda aberta
            </span>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.15] tracking-tight text-stone-900 sm:text-5xl">
              Escolha o melhor horário para você
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg">
              Veja os horários disponíveis, selecione um deles e confirme seu agendamento em poucos segundos.
            </p>
          </div>
        </section>

        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[1.5fr_1fr] lg:gap-10">
          <section aria-labelledby="slots-title" className="min-w-0">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="slots-title" className="text-xl font-semibold tracking-tight">
                Horários disponíveis
              </h2>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
              <AvailableSlots
                slots={slots}
                status={slotsStatus}
                onRetry={loadSlots}
                onSelect={setSelectedSlot}
              />
            </div>
          </section>

          <section aria-labelledby="notices-title" className="min-w-0">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="notices-title" className="text-xl font-semibold tracking-tight">
                Avisos
              </h2>
            </div>
            <NoticeBoard notices={notices} status={noticesStatus} onRetry={loadNotices} />
          </section>
        </div>
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-stone-500 sm:flex-row sm:px-6">
          <p>Agendamento Online</p>
          <a
            href="/admin"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-stone-600 transition hover:bg-stone-100 hover:text-emerald-800"
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
