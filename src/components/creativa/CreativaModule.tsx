import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Palette, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { CreativeProject, UserSettings } from '../../types/database';
import { NeoButton, NeoModal } from '../ui/NeoPrimitives';
import { CreativeCanvas } from './CreativeCanvas';

interface Props {
  userId: string;
  syncTick: number;
  settings: UserSettings;
  onUpdateTheme: (patch: Partial<UserSettings>) => void;
}

const NEON_PRESETS = ['#39FF14', '#FF5F1F', '#FF10F0', '#00F0FF', '#FFF01F'];

export const CreativaModule: React.FC<Props> = ({
  userId,
  syncTick,
  settings,
  onUpdateTheme
}) => {
  const [projects, setProjects] = useState<CreativeProject[]>([]);
  const [activeProject, setActiveProject] = useState<CreativeProject | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Canción');

  const fetchProjects = useCallback(async () => {
    const { data } = await supabase
      .from('creative_projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) setProjects(data as CreativeProject[]);
  }, [userId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects, syncTick]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const { data } = await supabase
      .from('creative_projects')
      .insert({
        user_id: userId,
        title: title.trim(),
        category
      })
      .select()
      .single();

    setTitle('');
    setShowNewModal(false);
    fetchProjects();
    if (data) setActiveProject(data as CreativeProject);
  };

  if (activeProject) {
    return (
      <CreativeCanvas
        userId={userId}
        syncTick={syncTick}
        project={activeProject}
        accentColor={settings.accent_creativa || '#39FF14'}
        onBack={() => setActiveProject(null)}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 bg-black text-white min-h-[calc(100dvh-5rem)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-white pb-3">
        <div>
          <span
            style={{ backgroundColor: settings.accent_creativa || '#39FF14' }}
            className="text-[11px] font-mono-brutal font-extrabold text-black px-2 py-0.5 uppercase"
          >
            ESTUDIO CREATIVO · MODO OSCURO
          </span>
          <h1 className="text-xl font-extrabold uppercase mt-1 text-white">
            Proyectos y Mapas Mentales
          </h1>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowThemeModal(true)}
            className="px-3.5 py-2 bg-black text-white border-2 border-white shadow-[3px_3px_0px_#FFFFFF] neo-press text-xs font-extrabold uppercase inline-flex items-center gap-1.5"
          >
            <Palette className="w-4 h-4" /> Acento
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            style={{ backgroundColor: settings.accent_creativa || '#39FF14' }}
            className="px-3.5 py-2 text-black border-2 border-white shadow-[3px_3px_0px_#FFFFFF] neo-press text-xs font-extrabold uppercase inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Nuevo Proyecto
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="p-8 border-2 border-white bg-black text-center space-y-3 shadow-[4px_4px_0px_#39FF14]">
          <Sparkles className="w-8 h-8 mx-auto text-[#39FF14]" />
          <p className="text-xs font-mono-brutal text-neutral-300">
            Crea un proyecto (canción, EP o concepto visual) para abrir su tablero infinito de
            nodos sincronizado en la nube.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => setActiveProject(proj)}
              style={{ boxShadow: `4px 4px 0px ${settings.accent_creativa || '#39FF14'}` }}
              className="p-4 bg-black border-2 border-white cursor-pointer neo-press flex flex-col justify-between gap-4"
            >
              <div>
                <span
                  style={{ backgroundColor: settings.accent_creativa || '#39FF14' }}
                  className="px-2 py-0.5 text-black text-[10px] font-mono-brutal font-extrabold uppercase"
                >
                  {proj.category}
                </span>
                <h3 className="font-extrabold text-lg mt-2 text-white">{proj.title}</h3>
              </div>
              <div className="flex justify-end">
                <span className="px-2.5 py-1 bg-white text-black text-xs font-mono-brutal font-extrabold">
                  ABRIR LIENZO →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <NeoModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nuevo Proyecto Creativo"
        headerBg="bg-[#39FF14]"
      >
        <form onSubmit={handleCreateProject} className="space-y-3 text-black">
          <input
            type="text"
            required
            placeholder="Título (ej. Maqueta #7)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border-2 border-black"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-3 border-2 border-black bg-white"
          >
            <option value="Canción">Canción en proceso</option>
            <option value="EP / Álbum">EP / Álbum</option>
            <option value="Concepto Visual">Concepto Visual / Portada</option>
          </select>
          <NeoButton type="submit" className="w-full">
            Crear y Abrir Tablero
          </NeoButton>
        </form>
      </NeoModal>

      <NeoModal
        open={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        title="Acento Fosforito Creativa"
        headerBg="bg-[#39FF14]"
      >
        <div className="space-y-4 text-black">
          <p className="text-xs font-mono-brutal">
            Fondo fijo en Negro Puro (#000000). Elige el color fosforito de acento:
          </p>
          <div className="flex gap-2">
            {NEON_PRESETS.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => onUpdateTheme({ bg_creativa: '#000000', accent_creativa: hex })}
                style={{ backgroundColor: hex }}
                className="w-11 h-11 border-2 border-black shadow-[2px_2px_0px_#000]"
              />
            ))}
          </div>
        </div>
      </NeoModal>
    </div>
  );
};