import { BellRing, RefreshCw } from 'lucide-react';
import { formatDateTime } from '@/lib/format';
import type { LoadStatus, Notice } from '@/lib/types';

interface NoticeBoardProps {
  notices: Notice[];
  status: LoadStatus;
  onRetry: () => void;
}

export default function NoticeBoard({ notices, status, onRetry }: NoticeBoardProps) {
  if (status === 'loading') {
    return <p className="py-10 text-center text-stone-500">Carregando avisos...</p>;
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-stone-700">Não foi possível carregar os avisos.</p>
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

  if (notices.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <BellRing size={36} className="text-stone-400" />
        <p className="text-stone-600">Nenhum aviso publicado.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {notices.map((notice) => (
        <li
          key={notice.id}
          className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 pl-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="absolute inset-y-0 left-0 w-1 bg-emerald-600" aria-hidden="true" />
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            {formatDateTime(notice.created_at)}
          </p>
          <h3 className="mt-1.5 text-lg font-semibold leading-snug text-stone-900">{notice.title}</h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone-700">{notice.body}</p>
        </li>
      ))}
    </ul>
  );
}
