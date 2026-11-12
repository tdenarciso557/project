import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { GraduationCap, RefreshCw, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Professor } from '@/lib/types';
import { errorTextClass, inputClass, labelClass, primaryButtonClass } from '@/lib/ui';

export default function ProfessorManager() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadProfessors = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('professors')
      .select('id, name')
      .order('name', { ascending: true });
    if (error || !data) {
      setLoadError(true);
    } else {
      setProfessors(data as Professor[]);
      setLoadError(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfessors();
  }, [loadProfessors]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Informe o nome do professor.');
      return;
    }

    setSaving(true);
    setFormError(null);
    setActionError(null);
    const { error } = await supabase.from('professors').insert({ name: trimmedName });
    setSaving(false);

    if (error) {
      setFormError('Não foi possível cadastrar o professor. Tente novamente.');
      return;
    }
    setName('');
    loadProfessors();
  }

  async function handleDelete(professor: Professor) {
    if (!window.confirm(`Remover o professor ${professor.name}? Os horários dele ficarão sem professor.`)) return;
    setActionError(null);
    const { error } = await supabase.from('professors').delete().eq('id', professor.id);
    if (error) {
      setActionError('Não foi possível remover o professor. Tente novamente.');
      return;
    }
    loadProfessors();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Novo professor</h2>
        <p className="mt-1 text-sm text-stone-600">
          Depois de cadastrado, escolha o professor de cada horário na aba Agenda.
        </p>
        <form onSubmit={handleCreate} className="mt-5 space-y-4" noValidate>
          <div>
            <label htmlFor="professor-name" className={labelClass}>
              Nome
            </label>
            <input
              id="professor-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              className={inputClass}
            />
          </div>
          {formError && <p className={errorTextClass}>{formError}</p>}
          <button type="submit" disabled={saving} className={`${primaryButtonClass} w-full`}>
            {saving ? 'Cadastrando...' : 'Cadastrar professor'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Professores cadastrados</h2>
        {actionError && <p className={`${errorTextClass} mt-3`}>{actionError}</p>}

        {loading && <p className="py-8 text-center text-stone-500">Carregando professores...</p>}

        {!loading && loadError && (
          <div className="py-8 text-center">
            <p className="text-stone-700">Não foi possível carregar os professores.</p>
            <button
              type="button"
              onClick={loadProfessors}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline"
            >
              <RefreshCw size={14} /> Tentar novamente
            </button>
          </div>
        )}

        {!loading && !loadError && professors.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <GraduationCap size={36} className="text-stone-400" />
            <p className="text-stone-600">Nenhum professor cadastrado ainda.</p>
          </div>
        )}

        {!loading && !loadError && professors.length > 0 && (
          <ul className="mt-4 divide-y divide-stone-100">
            {professors.map((professor) => (
              <li key={professor.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                    <GraduationCap size={16} />
                  </span>
                  <p className="truncate font-medium text-stone-900">{professor.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(professor)}
                  aria-label={`Remover professor ${professor.name}`}
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
