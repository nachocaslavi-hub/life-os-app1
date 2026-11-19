import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isWithinInterval,
  parseISO,
  getDay
} from 'date-fns';
import { CalendarPlus, Check, Dumbbell, Plus, Repeat } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Workout } from '../../types/database';
import { NeoButton, NeoCard, NeoModal } from '../ui/NeoPrimitives';

interface Props {
  userId: string;
  syncTick: number;
  weeklyGoalHours: number;
  onUpdateGoal: (hours: number) => void;
  initialWorkoutId: string | null;
  onClearDeepLink: () => void;
}

const TRAINING_TAGS = ['Técnica', 'Sparring', 'Físico/Saco', 'Cardio/Pesas'];
const WEEKDAYS = [
  { id: 1, label: 'L' },
  { id: 2, label: 'M' },
  { id: 3, label: 'X' },
  { id: 4, label: 'J' },
  { id: 5, label: 'V' },
  { id: 6, label: 'S' },
  { id: 0, label: 'D' }
];

export const DeporteModule: React.FC<Props> = ({
  userId,
  syncTick,
  weeklyGoalHours,
  onUpdateGoal,
  initialWorkoutId,
  onClearDeepLink
}) => {
  const [activeSubView, setActiveSubView] = useState<'actividades' | 'v2_ready'>('actividades');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showExtraModal, setShowExtraModal] = useState(false);

  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]);
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('20:30');
  const [weeksCount, setWeeksCount] = useState(4);

  const [extraTitle, setExtraTitle] = useState('Sesión Extra / Saco');
  const [extraDate, setExtraDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [extraMinutes, setExtraMinutes] = useState(60);

  const fetchWorkouts = useCallback(async () => {
    const { data } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .order('workout_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (data) setWorkouts(data as Workout[]);
  }, [userId]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts, syncTick]);

  useEffect(() => {
    if (initialWorkoutId && workouts.length > 0) {
      const found = workouts.find((w) => w.id === initialWorkoutId);
      if (found) setSelectedWorkout(found);
      onClearDeepLink();
    }
  }, [initialWorkoutId, workouts, onClearDeepLink]);

  const weeklyStats = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });

    const completedMinutes = workouts
      .filter((w) => w.completed && isWithinInterval(parseISO(w.workout_date), { start, end }))
      .reduce((acc, w) => acc + (w.actual_minutes ?? w.planned_minutes), 0);

    const hours = Number((completedMinutes / 60).toFixed(1));
    const pct = Math.min(100, Math.round((hours / Math.max(0.5, weeklyGoalHours)) * 100));
    return { hours, pct };
  }, [workouts, weeklyGoalHours]);

  const handleGenerateRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDays.length === 0) return;

    const seriesId = crypto.randomUUID();
    const today = new Date();
    const totalDays = weeksCount * 7;

    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const plannedMinutes = Math.max(15, eh * 60 + em - (sh * 60 + sm));

    const batch: Partial<Workout>[] = [];
    for (let i = 0; i < totalDays; i++) {
      const candidate = addDays(today, i);
      if (selectedDays.includes(getDay(candidate))) {
        batch.push({
          user_id: userId,
          title: 'Clase Muay Thai',
          discipline: 'Muay Thai',
          workout_date: format(candidate, 'yyyy-MM-dd'),
          start_time: startTime,
          end_time: endTime,
          planned_minutes: plannedMinutes,
          completed: false,
          tags: [],
          series_id: seriesId
        });
      }
    }

    if (batch.length > 0) {
      await supabase.from('workouts').insert(batch);
      setShowRecurringModal(false);
      fetchWorkouts();
    }
  };

  const handleCreateExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('workouts').insert({
      user_id: userId,
      title: extraTitle.trim() || 'Entrenamiento Extra',
      discipline: 'Acondicionamiento',
      workout_date: extraDate,
      start_time: '18:00',
      end_time: '19:00',
      planned_minutes: extraMinutes,
      actual_minutes: extraMinutes,
      completed: true,
      tags: ['Físico/Saco'],
      fatigue_level: 3
    });
    setShowExtraModal(false);
    fetchWorkouts();
  };

  const handleSaveWorkoutDetail = async (updated: Workout) => {
    await supabase
      .from('workouts')
      .update({
        completed: updated.completed,
        actual_minutes: updated.actual_minutes ?? updated.planned_minutes,
        tags: updated.tags,
        fatigue_level: updated.fatigue_level,
        notes: updated.notes
      })
      .eq('id', updated.id);

    setSelectedWorkout(null);
    fetchWorkouts();
  };

  const toggleDaySelection = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-5 bg-white">
      <div className="p-4 border-2 border-black bg-[#FF5F1F] shadow-[4px_4px_0px_#000] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono-brutal font-extrabold uppercase bg-black text-white px-2 py-0.5">
              DEPORTE · OBJETIVO SEMANAL
            </span>
            <div className="text-2xl font-mono-brutal font-extrabold mt-1">
              {weeklyStats.hours}h / {weeklyGoalHours}h
            </div>
          </div>

          <button
            onClick={() => {
              const next = prompt('Nuevo objetivo semanal en horas:', String(weeklyGoalHours));
              if (next && !Number.isNaN(Number(next))) onUpdateGoal(Number(next));
            }}
            className="px-3 py-1.5 border-2 border-black bg-white text-xs font-extrabold uppercase neo-press"
          >
            Editar Meta
          </button>
        </div>

        <div className="h-5 w-full bg-white border-2 border-black overflow-hidden">
          <div
            className="h-full bg-black transition-all"
            style={{ width: `${weeklyStats.pct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 border-2 border-black shadow-[3px_3px_0px_#000] bg-white">
        <button
          onClick={() => setActiveSubView('actividades')}
          className={`py-2.5 text-xs font-extrabold uppercase ${
            activeSubView === 'actividades' ? 'bg-black text-[#FF5F1F]' : 'bg-white text-black'
          }`}
        >
          Sesiones ({workouts.length})
        </button>
        <button
          onClick={() => setActiveSubView('v2_ready')}
          className={`py-2.5 text-xs font-extrabold uppercase border-l-2 border-black ${
            activeSubView === 'v2_ready' ? 'bg-black text-[#FF5F1F]' : 'bg-white text-black'
          }`}
        >
          Salud / V2
        </button>
      </div>

      {activeSubView === 'actividades' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <NeoButton size="sm" onClick={() => setShowRecurringModal(true)}>
              <Repeat className="w-4 h-4" /> Clases Muay Thai
            </NeoButton>
            <NeoButton size="sm" variant="secondary" onClick={() => setShowExtraModal(true)}>
              <Plus className="w-4 h-4" /> Sesión Extra
            </NeoButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workouts.map((w) => (
              <NeoCard
                key={w.id}
                interactive
                onClick={() => setSelectedWorkout(w)}
                bg={w.completed ? 'bg-[#FF5F1F]' : 'bg-white'}
                className="p-4 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono-brutal font-extrabold">
                      {w.workout_date} · {w.start_time.slice(0, 5)}
                    </span>
                    {w.completed && (
                      <span className="px-1.5 py-0.5 bg-black text-white text-[10px] font-mono-brutal font-bold">
                        COMPLETADA
                      </span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-base">{w.title}</h3>
                  {w.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {w.tags.map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 bg-white border border-black text-[10px] font-bold"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono-brutal font-extrabold text-sm">
                    {w.actual_minutes ?? w.planned_minutes}m
                  </div>
                  {w.fatigue_level && (
                    <div className="text-[11px] font-mono-brutal font-bold">
                      Fatiga {w.fatigue_level}/5
                    </div>
                  )}
                </div>
              </NeoCard>
            ))}
          </div>
        </div>
      ) : (
        <NeoCard className="p-5 space-y-2 bg-white">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#FF5F1F] border-2 border-black text-xs font-extrabold">
            <Dumbbell className="w-4 h-4" /> MÓDULO V2 PREPARADO
          </div>
          <h3 className="font-extrabold text-base">Nutrición y Calorías (V2)</h3>
          <p className="text-xs text-neutral-700 leading-relaxed">
            Tabla independiente <code>nutrition_logs_v2</code> desplegada en Supabase PostgreSQL
            para acoplar macros y calorías diarias sin alterar el esquema de entrenamientos.
          </p>
        </NeoCard>
      )}

      <NeoModal
        open={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
        title="Programar Clases Recurrentes"
        headerBg="bg-[#FF5F1F]"
      >
        <form onSubmit={handleGenerateRecurring} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase mb-1.5">Días de clase</label>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((d) => {
                const active = selectedDays.includes(d.id);
                return (
                  <button
                    type="button"
                    key={d.id}
                    onClick={() => toggleDaySelection(d.id)}
                    className={`py-2.5 border-2 border-black font-extrabold text-xs ${
                      active ? 'bg-black text-[#FF5F1F]' : 'bg-white text-black'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-extrabold uppercase mb-1">Inicio</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2.5 border-2 border-black bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase mb-1">Fin</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2.5 border-2 border-black bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase mb-1">
              Semanas a programar
            </label>
            <input
              type="number"
              min={1}
              max={24}
              value={weeksCount}
              onChange={(e) => setWeeksCount(Number(e.target.value))}
              className="w-full p-2.5 border-2 border-black bg-white"
            />
          </div>

          <NeoButton type="submit" className="w-full">
            <CalendarPlus className="w-4 h-4" /> Generar Sesiones
          </NeoButton>
        </form>
      </NeoModal>

      <NeoModal
        open={!!selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
        title={selectedWorkout?.title || 'Sesión'}
        headerBg="bg-[#FF5F1F]"
      >
        {selectedWorkout && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() =>
                setSelectedWorkout({ ...selectedWorkout, completed: !selectedWorkout.completed })
              }
              className={`w-full p-3 border-2 border-black shadow-[3px_3px_0px_#000] font-extrabold text-sm flex items-center justify-center gap-2 ${
                selectedWorkout.completed ? 'bg-[#FF5F1F]' : 'bg-white'
              }`}
            >
              <Check className="w-5 h-5" />
              {selectedWorkout.completed ? 'SESIÓN COMPLETADA' : 'MARCAR COMO COMPLETADA'}
            </button>

            <div>
              <label className="block text-xs font-extrabold uppercase mb-1">
                Duración real (minutos)
              </label>
              <input
                type="number"
                value={selectedWorkout.actual_minutes ?? selectedWorkout.planned_minutes}
                onChange={(e) =>
                  setSelectedWorkout({
                    ...selectedWorkout,
                    actual_minutes: Number(e.target.value)
                  })
                }
                className="w-full p-2.5 border-2 border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase mb-1.5">
                Etiquetas de Entrenamiento
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TRAINING_TAGS.map((tag) => {
                  const active = (selectedWorkout.tags || []).includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => {
                        const current = selectedWorkout.tags || [];
                        const next = active
                          ? current.filter((t) => t !== tag)
                          : [...current, tag];
                        setSelectedWorkout({ ...selectedWorkout, tags: next });
                      }}
                      className={`p-2 border-2 border-black text-xs font-extrabold ${
                        active ? 'bg-black text-[#FF5F1F]' : 'bg-white text-black'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase mb-1.5">
                Nivel de Fatiga (1 a 5)
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setSelectedWorkout({ ...selectedWorkout, fatigue_level: lvl })}
                    className={`py-2.5 border-2 border-black font-mono-brutal font-extrabold ${
                      selectedWorkout.fatigue_level === lvl
                        ? 'bg-[#FF5F1F] shadow-[2px_2px_0px_#000]'
                        : 'bg-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <NeoButton
              className="w-full"
              onClick={() => handleSaveWorkoutDetail(selectedWorkout)}
            >
              Guardar Registro
            </NeoButton>
          </div>
        )}
      </NeoModal>

      <NeoModal
        open={showExtraModal}
        onClose={() => setShowExtraModal(false)}
        title="Añadir Sesión Extra"
        headerBg="bg-[#FF5F1F]"
      >
        <form onSubmit={handleCreateExtra} className="space-y-3">
          <input
            type="text"
            required
            value={extraTitle}
            onChange={(e) => setExtraTitle(e.target.value)}
            className="w-full p-2.5 border-2 border-black"
          />
          <input
            type="date"
            required
            value={extraDate}
            onChange={(e) => setExtraDate(e.target.value)}
            className="w-full p-2.5 border-2 border-black bg-white"
          />
          <input
            type="number"
            required
            value={extraMinutes}
            onChange={(e) => setExtraMinutes(Number(e.target.value))}
            className="w-full p-2.5 border-2 border-black"
          />
          <NeoButton type="submit" className="w-full">
            Registrar Sesión
          </NeoButton>
        </form>
      </NeoModal>
    </div>
  );
};