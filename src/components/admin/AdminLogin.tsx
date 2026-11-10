import { useEffect, useState, type FormEvent } from 'react';
import { CalendarCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { errorTextClass, inputClass, labelClass, primaryButtonClass } from '@/lib/ui';

type Mode = 'checking' | 'login' | 'setup' | 'unavailable';

export default function AdminLogin() {
  const [mode, setMode] = useState<Mode>('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    supabase.rpc('admin_exists').then(({ data, error: rpcError }) => {
      if (rpcError || typeof data !== 'boolean') {
        setMode('unavailable');
        return;
      }
      setMode(data ? 'login' : 'setup');
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Informe e-mail e senha.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    if (mode === 'setup') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      setSubmitting(false);
      if (signUpError) {
        setError('Não foi possível criar a conta. Use uma senha com pelo menos 6 caracteres.');
        return;
      }
      if (!data.session) {
        setMode('login');
        setNotice('Conta criada. Agora entre com seu e-mail e senha.');
      }
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (signInError) {
      setError('E-mail ou senha incorretos.');
    }
  }

  const isSetup = mode === 'setup';

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-white">
            <CalendarCheck size={24} />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            {isSetup ? 'Criar conta do administrador' : 'Entrar como administrador'}
          </h1>
          <p className="text-sm text-stone-600">
            {isSetup
              ? 'Esta é a única conta de administrador do sistema.'
              : 'Acesse para gerenciar horários, agendamentos e avisos.'}
          </p>
        </div>

        {mode === 'checking' && (
          <div className="flex justify-center py-6">
            <Loader2 size={24} className="animate-spin text-emerald-700" />
          </div>
        )}

        {mode === 'unavailable' && (
          <p className={`${errorTextClass} text-center`}>
            Não foi possível verificar o acesso. Recarregue a página e tente novamente.
          </p>
        )}

        {(mode === 'login' || mode === 'setup') && (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm" noValidate>
            <div>
              <label htmlFor="admin-email" className={labelClass}>
                E-mail
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="admin-password" className={labelClass}>
                Senha
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={isSetup ? 'new-password' : 'current-password'}
                className={inputClass}
              />
            </div>
            {notice && <p className="text-sm text-emerald-800">{notice}</p>}
            {error && <p className={errorTextClass}>{error}</p>}
            <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-full`}>
              {submitting
                ? 'Aguarde...'
                : isSetup
                  ? 'Criar conta e entrar'
                  : 'Entrar'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <a href="/" className="font-medium text-stone-600 transition hover:text-emerald-700">
            Voltar para o site
          </a>
        </p>
      </div>
    </div>
  );
}
