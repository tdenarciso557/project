import { useState } from 'react';
import { CalendarCheck, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import SlotManager from '@/components/admin/SlotManager';
import AppointmentList from '@/components/admin/AppointmentList';
import NoticeManager from '@/components/admin/NoticeManager';

type Tab = 'agenda' | 'avisos';

const TABS: { id: Tab; label: string }[] = [
  { id: 'agenda', label: 'Agenda' },
  { id: 'avisos', label: 'Avisos' },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('agenda');
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((key) => key + 1);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <CalendarCheck size={20} />
            </span>
            <span className="font-semibold tracking-tight">Painel do administrador</span>
          </div>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <nav className="mb-8 flex gap-2 border-b border-stone-200" aria-label="Seções">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-current={tab === item.id ? 'page' : undefined}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition ${
                tab === item.id
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {tab === 'agenda' ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            <SlotManager refreshKey={refreshKey} onChanged={refresh} />
            <AppointmentList refreshKey={refreshKey} onChanged={refresh} />
          </div>
        ) : (
          <NoticeManager />
        )}
      </main>
    </div>
  );
}
