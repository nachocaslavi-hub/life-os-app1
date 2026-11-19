import React, { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import {
  MapPin,
  Plus,
  Music2,
  CheckSquare,
  Square,
  Upload,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Concert, ConcertSong, ConcertTask } from '../../types/database';
import { useStorageUploader } from '../../hooks/useStorageFile';
import { NeoButton, NeoCard, NeoModal } from '../ui/NeoPrimitives';
import { BrutalistAudioPlayer } from '../ui/BrutalistAudioPlayer';

interface Props {
  userId: string;
  syncTick: number;
  initialConcertId: string | null;
  onClearDeepLink: () => void;
}

export const GrupoModule: React.FC<Props> = ({
  userId,
  syncTick,
  initialConcertId,
  onClearDeepLink
}) => {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [selectedConcert, setSelectedConcert] = useState<Concert | null>(null);
  const [songs, setSongs] = useState<ConcertSong[]>([]);
  const [tasks, setTasks] = useState<ConcertTask[]>([]);

  const [showNewConcert, setShowNewConcert] = useState(false);
  const [title, setTitle] = useState('');
  const [venueCity, setVenueCity] = useState('');
  const [concertDate, setConcertDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [concertTime, setConcertTime] = useState('22:00');

  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongMeta, setNewSongMeta] = useState('');
  const [newSongLink, setNewSongLink] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const { uploadFile, uploading } = useStorageUploader(userId);

  const fetchConcerts = useCallback(async () => {
    const { data } = await supabase
      .from('concerts')
      .select('*')
      .eq('user_id', userId)
      .order('concert_date', { ascending: true });

    if (data) setConcerts(data as Concert[]);
  }, [userId]);

  const fetchConcertDetails = useCallback(async (concertId: string) => {
    const [songsRes, tasksRes] = await Promise.all([
      supabase
        .from('concert_songs')
        .select('*')
        .eq('concert_id', concertId)
        .order('created_at', { ascending: true }),
      supabase
        .from('concert_tasks')
        .select('*')
        .eq('concert_id', concertId)
        .order('created_at', { ascending: true })
    ]);

    setSongs((songsRes.data as ConcertSong[]) || []);
    setTasks((tasksRes.data as ConcertTask[]) || []);
  }, []);

  useEffect(() => {
    fetchConcerts();
    if (selectedConcert) fetchConcertDetails(selectedConcert.id);
  }, [fetchConcerts, fetchConcertDetails, selectedConcert, syncTick]);

  useEffect(() => {
    if (initialConcertId && concerts.length > 0) {
      const found = concerts.find((c) => c.id === initialConcertId);
      if (found) {
        setSelectedConcert(found);
        fetchConcertDetails(found.id);
      }
      onClearDeepLink();
    }
  }, [initialConcertId, concerts, fetchConcertDetails, onClearDeepLink]);

  const handleOpenConcert = (concert: Concert) => {
    setSelectedConcert(concert);
    fetchConcertDetails(concert.id);
  };

  const handleCreateConcert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !venueCity.trim()) return;
    await supabase.from('concerts').insert({
      user_id: userId,
      title: title.trim(),
      venue_city: venueCity.trim(),
      concert_date: concertDate,
      concert_time: concertTime
    });
    setTitle('');
    setVenueCity('');
    setShowNewConcert(false);
    fetchConcerts();
  };

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConcert || !newSongTitle.trim()) return;
    await supabase.from('concert_songs').insert({
      user_id: userId,
      concert_id: selectedConcert.id,
      title: newSongTitle.trim(),
      key_bpm_notes: newSongMeta.trim(),
      reference_url: newSongLink.trim()
    });
    setNewSongTitle('');
    setNewSongMeta('');
    setNewSongLink('');
    fetchConcertDetails(selectedConcert.id);
  };

  const toggleSongLearned = async (song: ConcertSong) => {
    await supabase
      .from('concert_songs')
      .update({ is_learned: !song.is_learned })
      .eq('id', song.id);
    if (selectedConcert) fetchConcertDetails(selectedConcert.id);
  };

  const handleAttachSongAudio = async (song: ConcertSong, file: File) => {
    const path = await uploadFile(file, 'grupo');
    if (!path) return;
    await supabase.from('concert_songs').update({ audio_path: path }).eq('id', song.id);
    if (selectedConcert) fetchConcertDetails(selectedConcert.id);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConcert || !newTaskTitle.trim()) return;
    await supabase.from('concert_tasks').insert({
      user_id: userId,
      concert_id: selectedConcert.id,
      title: newTaskTitle.trim()
    });
    setNewTaskTitle('');
    fetchConcertDetails(selectedConcert.id);
  };

  const toggleTaskDone = async (task: ConcertTask) => {
    await supabase.from('concert_tasks').update({ is_done: !task.is_done }).eq('id', task.id);
    if (selectedConcert) fetchConcertDetails(selectedConcert.id);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 bg-white">
      <div className="p-4 border-2 border-black bg-[#FF10F0] shadow-[4px_4px_0px_#000] flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-mono-brutal font-extrabold bg-black text-white px-2 py-0.5 uppercase">
            MÓDULO GRUPO
          </span>
          <h1 className="text-xl font-extrabold uppercase mt-1">Conciertos, Setlist y Gestiones</h1>
        </div>
        <NeoButton size="sm" onClick={() => setShowNewConcert(true)}>
          <Plus className="w-4 h-4" /> Nuevo Bolo
        </NeoButton>
      </div>

      {concerts.length === 0 ? (
        <NeoCard className="p-6 text-center text-xs font-mono-brutal bg-white">
          Añade tu próximo concierto para gestionar canciones nuevas y tareas operativas.
        </NeoCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {concerts.map((c) => (
            <NeoCard
              key={c.id}
              interactive
              onClick={() => handleOpenConcert(c)}
              className="p-4 space-y-2 bg-white"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-[#FF10F0] border border-black text-black text-[11px] font-mono-brutal font-extrabold">
                  {c.concert_date} · {c.concert_time.slice(0, 5)}
                </span>
              </div>
              <h3 className="font-extrabold text-lg">{c.title}</h3>
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700">
                <MapPin className="w-3.5 h-3.5" />
                <span>{c.venue_city}</span>
              </div>
            </NeoCard>
          ))}
        </div>
      )}

      <NeoModal
        open={!!selectedConcert}
        onClose={() => setSelectedConcert(null)}
        title={selectedConcert?.title || 'Detalle Bolo'}
        headerBg="bg-[#FF10F0]"
      >
        {selectedConcert && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b-2 border-black pb-1">
                <Music2 className="w-4 h-4" />
                <h4 className="font-extrabold text-xs uppercase">1. Canciones por Aprender</h4>
              </div>

              <form
                onSubmit={handleAddSong}
                className="space-y-2 p-3 bg-neutral-100 border-2 border-black"
              >
                <input
                  type="text"
                  required
                  placeholder="Título del tema..."
                  value={newSongTitle}
                  onChange={(e) => setNewSongTitle(e.target.value)}
                  className="w-full p-2 border-2 border-black bg-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Tono / BPM / Notas"
                    value={newSongMeta}
                    onChange={(e) => setNewSongMeta(e.target.value)}
                    className="w-full p-2 border-2 border-black bg-white"
                  />
                  <input
                    type="url"
                    placeholder="Enlace ref. (opcional)"
                    value={newSongLink}
                    onChange={(e) => setNewSongLink(e.target.value)}
                    className="w-full p-2 border-2 border-black bg-white"
                  />
                </div>
                <NeoButton type="submit" size="sm" className="w-full">
                  Añadir Canción
                </NeoButton>
              </form>

              <div className="space-y-2">
                {songs.map((song) => (
                  <div
                    key={song.id}
                    className={`p-3 border-2 border-black space-y-2 ${
                      song.is_learned ? 'bg-[#FF10F0]/30' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSongLearned(song)}
                        className="flex items-start gap-2 text-left flex-1"
                      >
                        {song.is_learned ? (
                          <CheckSquare className="w-5 h-5 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-5 h-5 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-extrabold text-sm">{song.title}</div>
                          {song.key_bpm_notes && (
                            <div className="text-xs font-mono-brutal font-bold">
                              {song.key_bpm_notes}
                            </div>
                          )}
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {song.reference_url && (
                          <a
                            href={song.reference_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-white border-2 border-black"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <label className="p-1.5 bg-[#FF10F0] border-2 border-black cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <input
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            disabled={uploading}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleAttachSongAudio(song, f);
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {song.audio_path && (
                      <BrutalistAudioPlayer storagePath={song.audio_path} label="Maqueta / Ref" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t-4 border-black pt-4">
              <h4 className="font-extrabold text-xs uppercase">
                2. Gestiones y Recordatorios del Bolo
              </h4>

              <form onSubmit={handleAddTask} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ej. Hablar con X para el pago..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 p-2 border-2 border-black"
                />
                <NeoButton type="submit" size="sm">
                  Añadir
                </NeoButton>
              </form>

              <div className="space-y-1.5">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => toggleTaskDone(task)}
                    className={`w-full p-2.5 border-2 border-black flex items-center gap-2.5 text-left text-xs font-bold ${
                      task.is_done ? 'bg-neutral-200 line-through opacity-70' : 'bg-white'
                    }`}
                  >
                    {task.is_done ? (
                      <CheckSquare className="w-4 h-4 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 shrink-0" />
                    )}
                    <span>{task.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </NeoModal>

      <NeoModal
        open={showNewConcert}
        onClose={() => setShowNewConcert(false)}
        title="Programar Concierto"
        headerBg="bg-[#FF10F0]"
      >
        <form onSubmit={handleCreateConcert} className="space-y-3">
          <input
            type="text"
            required
            placeholder="Nombre del evento / cartel"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border-2 border-black"
          />
          <input
            type="text"
            required
            placeholder="Sala y Ciudad"
            value={venueCity}
            onChange={(e) => setVenueCity(e.target.value)}
            className="w-full p-3 border-2 border-black"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              required
              value={concertDate}
              onChange={(e) => setConcertDate(e.target.value)}
              className="w-full p-3 border-2 border-black bg-white"
            />
            <input
              type="time"
              required
              value={concertTime}
              onChange={(e) => setConcertTime(e.target.value)}
              className="w-full p-3 border-2 border-black bg-white"
            />
          </div>
          <NeoButton type="submit" className="w-full">
            Guardar Concierto
          </NeoButton>
        </form>
      </NeoModal>
    </div>
  );
};