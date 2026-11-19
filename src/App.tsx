import React, { useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  Calendar,
  BookOpen,
  Flame,
  Music,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { supabase } from './lib/supabase';
import type { AppSection, UserSettings } from './types/database';
import { AuthGate } from './components/AuthGate';
import { CalendarModule } from './components/calendar/CalendarModule';
import { EstudiosModule } from './components/estudios/EstudiosModule';
import { DeporteModule } from './components/deporte/DeporteModule';
import { GrupoModule } from './components/grupo/GrupoModule';
import { CreativaModule } from './components/creativa/CreativaModule';

const DEFAULT_SETTINGS: Omit<UserSettings, 'user_id'> = {
  app_name: 'LIFE OS',
  weekly_workout_goal_hours: 6.0,
  color_estudios: '#39FF14',
  color_deporte: '#FF5F1F',
  color_grupo: '#FF10F0',
  bg_creativa: '#000000',
  accent_creativa: '#39FF14',
};

const MainShell: React.FC<{ session: Session }> = ({ session }) => {
  const userId = session.user.id;
  const [activeTab, setActiveTab] = useState<AppSection>('calendario');
  const [settings, setSettings] = useState<UserSettings>({
    user_id: userId,
    ...DEFAULT_SETTINGS,
  });
  const [deepLinkEntityId, setDeepLinkEntityId] = useState<string | null>(null);
  const [realtimePulse, setRealtimePulse] = useState(0);

  const loadSettings = useCallback(async () => {
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setSettings(data);
    } else {
      const initial = { user_id: userId, ...DEFAULT_SETTINGS };
      await supabase.from('user_settings').insert(initial);
      setSettings(initial);
    }
  }, [userId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Sincronización en tiempo real entre ordenador e iPhone
  useEffect(() => {
    const channel = supabase
      .channel(`lifeos-sync-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', filter: `user_id=eq.${userId}` },
        () => {
          setRealtimePulse((n) => n + 1);
          loadSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadSettings]);

  // Inyecta tokens CSS fosforitos y tema Creativa
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--color-estudios', settings.color_estudios || '#39FF14');
    root.setProperty('--color-deporte', settings.color_deporte || '#FF5F1F');
    root.setProperty('--color-grupo', settings.color_grupo || '#FF10F0');
    root.setProperty('--bg-creativa', settings.bg_creativa || '#000000');
    root.setProperty(
      '--accent-creativa',
      settings.accent_creativa || '#39FF14'
    );
  }, [settings]);

  const handleUpdateSettings = async (patch: Partial<UserSettings>) => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    await supabase.from('user_settings').upsert(updated);
  };

  const handleCalendarNavigate = (
    module: 'estudios' | 'deporte' | 'grupo',
    entityId: string
  ) => {
    setDeepLinkEntityId(entityId);
    setActiveTab(module);
  };

  const isCreativa = activeTab === 'creativa';

  const navItems: {
    id: AppSection;
    label: string;
    icon: React.FC<{ className?: string }>;
    accentColor: string;
  }[] = [
    {
      id: 'calendario',
      label: 'Agenda',
      icon: Calendar,
      accentColor: '#FFFFFF',
    },
    {
      id: 'estudios',
      label: 'Estudios',
      icon: BookOpen,
      accentColor: '#39FF14',
    },
    { id: 'deporte', label: 'Deporte', icon: Flame, accentColor: '#FF5F1F' },
    { id: 'grupo', label: 'Grupo', icon: Music, accentColor: '#FF10F0' },
    {
      id: 'creativa',
      label: 'Creativa',
      icon: Sparkles,
      accentColor: settings.accent_creativa,
    },
  ];

  return (
    <div
      className="min-h-dvh flex flex-col transition-colors duration-150"
      style={{
        backgroundColor: isCreativa
          ? settings.bg_creativa || '#000000'
          : '#FFFFFF',
        color: isCreativa ? '#FFFFFF' : '#000000',
      }}
    >
      {/* Cabecera Superior Sticky: Adaptada con navegación horizontal en ordenador */}
      <header
        className={`sticky top-0 z-30 pt-safe pb-3 border-b-2 transition-colors ${
          isCreativa
            ? 'bg-black text-white border-white'
            : 'bg-white text-black border-black'
        }`}
      >
        <div className="max-w-[1100px] mx-auto px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <span
              className={`px-2.5 py-1 font-mono-brutal font-extrabold text-xs border-2 ${
                isCreativa
                  ? 'bg-[#39FF14] text-black border-white'
                  : 'bg-black text-white border-black'
              }`}
            >
              {settings.app_name}
            </span>
            <span className="md:hidden font-extrabold text-sm uppercase tracking-wider">
              {activeTab}
            </span>
          </div>

          {/* Barra de Navegación Superior para Ordenador (>= 768px) */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setDeepLinkEntityId(null);
                    setActiveTab(item.id);
                  }}
                  style={{
                    backgroundColor: isActive ? item.accentColor : '#FFFFFF',
                    color: '#000000',
                  }}
                  className={`px-3.5 py-2 border-2 text-xs uppercase tracking-wide inline-flex items-center gap-2 transition-transform ${
                    isCreativa ? 'border-white' : 'border-black'
                  } ${
                    isActive
                      ? isCreativa
                        ? 'shadow-[3px_3px_0px_#FFFFFF] -translate-y-0.5 font-extrabold'
                        : 'shadow-[3px_3px_0px_#000000] -translate-y-0.5 font-extrabold'
                      : 'font-bold opacity-85 hover:opacity-100'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2.5]" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Indicador Cloud Sync + Cerrar Sesión */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="text-[11px] font-mono-brutal font-extrabold px-2 py-1 border-2 border-black text-black"
              style={{ backgroundColor: '#39FF14' }}
            >
              CLOUD SYNC
            </span>
            <button
              onClick={() => supabase.auth.signOut()}
              title="Cerrar sesión"
              className={`p-1.5 border-2 neo-press ${
                isCreativa
                  ? 'bg-black text-white border-white'
                  : 'bg-white text-black border-black'
              }`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Contenedor Principal Centrado (max-w: 1100px en ordenador) */}
      <main className="flex-1 w-full max-w-[1100px] mx-auto pb-nav-safe">
        {activeTab === 'calendario' && (
          <CalendarModule
            userId={userId}
            syncTick={realtimePulse}
            onNavigateEvent={handleCalendarNavigate}
          />
        )}
        {activeTab === 'estudios' && (
          <EstudiosModule
            userId={userId}
            syncTick={realtimePulse}
            initialExamId={deepLinkEntityId}
            onClearDeepLink={() => setDeepLinkEntityId(null)}
          />
        )}
        {activeTab === 'deporte' && (
          <DeporteModule
            userId={userId}
            syncTick={realtimePulse}
            weeklyGoalHours={settings.weekly_workout_goal_hours}
            onUpdateGoal={(hours) =>
              handleUpdateSettings({ weekly_workout_goal_hours: hours })
            }
            initialWorkoutId={deepLinkEntityId}
            onClearDeepLink={() => setDeepLinkEntityId(null)}
          />
        )}
        {activeTab === 'grupo' && (
          <GrupoModule
            userId={userId}
            syncTick={realtimePulse}
            initialConcertId={deepLinkEntityId}
            onClearDeepLink={() => setDeepLinkEntityId(null)}
          />
        )}
        {activeTab === 'creativa' && (
          <CreativaModule
            userId={userId}
            syncTick={realtimePulse}
            settings={settings}
            onUpdateTheme={handleUpdateSettings}
          />
        )}
      </main>

      {/* Barra de Navegación Inferior Fija Exclusiva para Móvil (< 768px) */}
      <nav
        className={`md:hidden fixed bottom-0 inset-x-0 z-40 border-t-4 pb-safe px-1.5 pt-1.5 ${
          isCreativa ? 'bg-black border-white' : 'bg-white border-black'
        }`}
      >
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setDeepLinkEntityId(null);
                  setActiveTab(item.id);
                }}
                style={{
                  backgroundColor: isActive ? item.accentColor : '#FFFFFF',
                  color: '#000000',
                }}
                className={`flex flex-col items-center justify-center py-1.5 px-1 border-2 border-black transition-transform ${
                  isActive
                    ? 'shadow-[2px_2px_0px_#000] -translate-y-0.5 font-extrabold'
                    : 'opacity-90 font-bold'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.5]" />
                <span className="text-[10px] uppercase tracking-tighter mt-0.5">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default function App() {
  return <AuthGate>{(session) => <MainShell session={session} />}</AuthGate>;
}
