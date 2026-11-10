import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/format';
import type { Notice } from '@/lib/types';
import { errorTextClass, inputClass, labelClass, primaryButtonClass } from '@/lib/ui';

export default function NoticeManager() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadNotices = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notices')
      .select('id, title, body, created_at')
      .order('created_at', { ascending: false });
    if (error || !data) {
      setLoadError(true);
    } else {
      setNotices(data as Notice[]);
      setLoadError(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || !trimmedBody) {
      setFormError('Preencha o título e o texto do aviso.');
      return;
    }

    setSaving(true);
    setFormError(null);
    setActionError(null);
    const { error } = await supabase
      .from('notices')
      .insert({ title: trimmedTitle, body: trimmedBody });
    setSaving(false);

    if (error) {
      setFormError('Não foi possível publicar o aviso. Tente novamente.');
      return;
    }
    setTitle('');
    setBody('');
    loadNotices();
  }

  async function handleDelete(notice: Notice) {
    if (!window.confirm(`Excluir o aviso "${notice.title}"?`)) return;
    setActionError(null);
    const { error } = await supabase.from('notices').delete().eq('id', notice.id);
    if (error) {
      setActionError('Não foi possível excluir o aviso. Tente novamente.');
      return;
    }
    loadNotices();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Novo aviso</h2>
        <p className="mt-1 text-sm text-stone-600">O aviso aparece na página inicial para todos os visitantes.</p>
        <form onSubmit={handleCreate} className="mt-5 space-y-4" noValidate>
          <div>
            <label htmlFor="notice-title" className={labelClass}>
              Título
            </label>
            <input
              id="notice-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={150}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="notice-body" className={labelClass}>
              Texto
            </label>
            <textarea
              id="notice-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={2000}
              rows={5}
              className={inputClass}
            />
          </div>
          {formError && <p className={errorTextClass}>{formError}</p>}
          <button type="submit" disabled={saving} className={`${primaryButtonClass} w-full`}>
            {saving ? 'Publicando...' : 'Publicar aviso'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Avisos publicados</h2>
        {actionError && <p className={`${errorTextClass} mt-3`}>{actionError}</p>}

        {loading && <p className="py-8 text-center text-stone-500">Carregando avisos...</p>}

        {!loading && loadError && (
          <div className="py-8 text-center">
            <p className="text-stone-700">Não foi possível carregar os avisos.</p>
            <button
              type="button"
              onClick={loadNotices}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline"
            >
              <RefreshCw size={14} /> Tentar novamente
            </button>
          </div>
        )}

        {!loading && !loadError && notices.length === 0 && (
          <p className="py-8 text-center text-stone-600">Nenhum aviso publicado ainda.</p>
        )}

        {!loading && !loadError && notices.length > 0 && (
          <ul className="mt-4 divide-y divide-stone-100">
            {notices.map((notice) => (
              <li key={notice.id} className="flex items-start justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="text-xs text-stone-500">{formatDateTime(notice.created_at)}</p>
                  <p className="mt-1 font-medium text-stone-900">{notice.title}</p>
                  <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-stone-600">{notice.body}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(notice)}
                  aria-label={`Excluir aviso ${notice.title}`}
                  className="shrink-0 rounded-lg p-2 text-stone-500 transition hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
