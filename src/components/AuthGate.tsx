import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { NeoButton, NeoCard } from './ui/NeoPrimitives';
import { Lock, Terminal } from 'lucide-react';

interface Props {
  children: (session: Session) => React.ReactNode;
}

export const AuthGate: React.FC<Props> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMsg(error.message);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white p-6">
        <div className="neo-box bg-[#39FF14] px-6 py-4 font-mono-brutal font-extrabold text-lg">
          CARGANDO LIFE OS...
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-dvh flex flex-col justify-center bg-white p-5 pt-safe pb-safe">
        <NeoCard className="p-6 max-w-md w-full mx-auto space-y-5 bg-white">
          <div className="flex items-center gap-3 border-b-2 border-black pb-4">
            <div className="w-12 h-12 bg-black text-[#39FF14] flex items-center justify-center border-2 border-black">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight uppercase">LIFE OS</h1>
              <p className="text-xs font-mono-brutal font-bold text-neutral-700">
                SINCRONIZACIÓN CLOUD iOS + PC
              </p>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-3 py-2.5 border-2 border-black bg-white font-medium focus:outline-none focus:bg-[#39FF14]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase mb-1">Contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 border-2 border-black bg-white font-medium focus:outline-none focus:bg-[#39FF14]/20"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-[#FF5F1F] text-black border-2 border-black text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <NeoButton type="submit" size="lg" className="w-full" disabled={submitting}>
              <Lock className="w-4 h-4" />
              {submitting ? 'Conectando...' : isSignUp ? 'Crear Cuenta Única' : 'Entrar al Sistema'}
            </NeoButton>
          </form>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-center text-xs font-mono-brutal font-bold underline"
          >
            {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : 'Primera vez: Registrar usuario'}
          </button>
        </NeoCard>
      </div>
    );
  }

  return <>{children(session)}</>;
};