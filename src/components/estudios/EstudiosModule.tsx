import React, { useEffect, useState, useCallback, useRef } from 'react';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';
import {
  Plus,
  Clock,
  Play,
  Pause,
  FileText,
  Upload,
  CheckCircle2,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Exam, Subject, Topic, TopicStatus } from '../../types/database';
import { useStorageUploader } from '../../hooks/useStorageFile';
import { NeoButton, NeoCard, NeoModal } from '../ui/NeoPrimitives';

interface Props {
  userId: string;
  syncTick: number;
  initialExamId: string | null;
  onClearDeepLink: () => void;
}

const STATUS_CYCLE: Record<
  TopicStatus,
  { next: TopicStatus; label: string; score: number; bg: string }
> = {
  pendiente: { next: 'repaso', label: 'PENDIENTE (0%)', score: 0, bg: 'bg-white text-black' },
  repaso: {
    next: 'dominado',
    label: 'EN REPASO (50%)',
    score: 50,
    bg: 'bg-[#39FF14]/35 text-black'
  },
  dominado: {
    next: 'pendiente',
    label: 'DOMINADO (100%)',
    score: 100,
    bg: 'bg-[#39FF14] text-black'
  }
};

export const EstudiosModule: React.FC<Props> = ({
  userId,
  syncTick,
  initialExamId,
  onClearDeepLink
}) => {
  const [subTab, setSubTab] = useState<'actividades' | 'asignaturas'>('actividades');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);

  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const [showNewExam, setShowNewExam] = useState(false);
  const [showNewSubject, setShowNewSubject] = useState(false);

  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [examSubjectId, setExamSubjectId] = useState('');

  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [newTopicTitle, setNewTopicTitle] = useState('');

  const [draftNotes, setDraftNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const notesTimerRef = useRef<number | null>(null);

  const [timerSubjectId, setTimerSubjectId] = useState<string | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  const { uploadFile, uploading } = useStorageUploader(userId);

  const fetchAll = useCallback(async () => {
    const [subRes, topRes, exRes] = await Promise.all([
      supabase.from('subjects').select('*').eq('user_id', userId).order('name'),
      supabase.from('topics').select('*').eq('user_id', userId).order('order_index'),
      supabase
        .from('exams')
        .select('*, subject:subjects(*), exam_topics(*, topic:topics(*))')
        .eq('user_id', userId)
        .order('exam_date', { ascending: true })
    ]);

    if (subRes.data) {
      setSubjects(subRes.data);
      if (!examSubjectId && subRes.data[0]) setExamSubjectId(subRes.data[0].id);
    }
    if (topRes.data) setTopics(topRes.data);
    if (exRes.data) setExams(exRes.data as Exam[]);
  }, [userId, examSubjectId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, syncTick]);

  useEffect(() => {
    if (initialExamId) {
      setSubTab('actividades');
      setSelectedExamId(initialExamId);
      onClearDeepLink();
    }
  }, [initialExamId, onClearDeepLink]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const stopAndSaveTimer = async () => {
    setTimerRunning(false);
    if (timerSubjectId && sessionSeconds > 0) {
      const subj = subjects.find((s) => s.id === timerSubjectId);
      if (subj) {
        const nextTotal = subj.total_study_seconds + sessionSeconds;
        await supabase
          .from('subjects')
          .update({ total_study_seconds: nextTotal })
          .eq('id', subj.id);
        setSessionSeconds(0);
        setTimerSubjectId(null);
        fetchAll();
      }
    }
  };

  const computeExamProgress = (exam: Exam) => {
    const links = exam.exam_topics || [];
    if (links.length === 0) return 0;
    const sum = links.reduce((acc, item) => acc + STATUS_CYCLE[item.status].score, 0);
    return Math.round(sum / links.length);
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;
    await supabase.from('subjects').insert({
      user_id: userId,
      name: subjectName.trim(),
      code: subjectCode.trim() || null
    });
    setSubjectName('');
    setSubjectCode('');
    setShowNewSubject(false);
    fetchAll();
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || !examSubjectId) return;
    await supabase.from('exams').insert({
      user_id: userId,
      subject_id: examSubjectId,
      title: examTitle.trim(),
      exam_date: examDate
    });
    setExamTitle('');
    setShowNewExam(false);
    fetchAll();
  };

  const handleCreateTopic = async (subjectId: string) => {
    if (!newTopicTitle.trim()) return;
    const count = topics.filter((t) => t.subject_id === subjectId).length;
    await supabase.from('topics').insert({
      user_id: userId,
      subject_id: subjectId,
      title: newTopicTitle.trim(),
      order_index: count + 1
    });
    setNewTopicTitle('');
    fetchAll();
  };

  const toggleLinkTopicToExam = async (examId: string, topicId: string, exists: boolean) => {
    if (exists) {
      await supabase.from('exam_topics').delete().match({ exam_id: examId, topic_id: topicId });
    } else {
      await supabase.from('exam_topics').insert({
        user_id: userId,
        exam_id: examId,
        topic_id: topicId,
        status: 'pendiente'
      });
    }
    fetchAll();
  };

  const cycleExamTopicStatus = async (linkId: string, current: TopicStatus) => {
    const next = STATUS_CYCLE[current].next;
    await supabase.from('exam_topics').update({ status: next }).eq('id', linkId);
    fetchAll();
  };

  const handleNotesChange = (topicId: string, value: string) => {
    setDraftNotes(value);
    setSavingNotes(true);
    if (notesTimerRef.current) window.clearTimeout(notesTimerRef.current);

    notesTimerRef.current = window.setTimeout(async () => {
      await supabase.from('topics').update({ notes_markdown: value }).eq('id', topicId);
      setTopics((prev) =>
        prev.map((t) => (t.id === topicId ? { ...t, notes_markdown: value } : t))
      );
      setSavingNotes(false);
    }, 500);
  };

  const handleUploadTopicAttachment = async (topic: Topic, file: File) => {
    const path = await uploadFile(file, 'estudios');
    if (!path) return;
    const isPdf = file.type === 'application/pdf';
    const nextAttachments = [
      ...(topic.attachments || []),
      { name: file.name, path, type: isPdf ? 'pdf' : 'image' }
    ];
    await supabase.from('topics').update({ attachments: nextAttachments }).eq('id', topic.id);
    fetchAll();
  };

  const openSignedAttachment = async (path: string) => {
    const { data } = await supabase.storage.from('lifeos-vault').createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const selectedExam = exams.find((e) => e.id === selectedExamId) || null;
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) || null;
  const selectedTopic = topics.find((t) => t.id === selectedTopicId) || null;

  return (
    <div className="p-4 md:p-6 space-y-5 bg-white">
      <div className="p-4 border-2 border-black bg-[#39FF14] shadow-[4px_4px_0px_#000] flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-mono-brutal font-extrabold bg-black text-white px-2 py-0.5 uppercase">
            MÓDULO ESTUDIOS
          </span>
          <h1 className="text-xl font-extrabold uppercase mt-1">
            Exámenes, Temario y Enfoque
          </h1>
        </div>

        <div className="grid grid-cols-2 border-2 border-black bg-white shadow-[2px_2px_0px_#000]">
          <button
            onClick={() => setSubTab('actividades')}
            className={`px-4 py-2 text-xs font-extrabold uppercase ${
              subTab === 'actividades' ? 'bg-black text-[#39FF14]' : 'bg-white text-black'
            }`}
          >
            Actividades ({exams.length})
          </button>
          <button
            onClick={() => setSubTab('asignaturas')}
            className={`px-4 py-2 text-xs font-extrabold uppercase border-l-2 border-black ${
              subTab === 'asignaturas' ? 'bg-black text-[#39FF14]' : 'bg-white text-black'
            }`}
          >
            Asignaturas ({subjects.length})
          </button>
        </div>
      </div>

      {timerSubjectId && (
        <NeoCard bg="bg-black text-white" className="p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono-brutal text-[#39FF14] uppercase font-bold">
              ENFOQUE ACTIVO · {subjects.find((s) => s.id === timerSubjectId)?.name}
            </div>
            <div className="text-2xl font-mono-brutal font-extrabold">
              {Math.floor(sessionSeconds / 60)}m {sessionSeconds % 60}s
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className="px-3.5 py-2 bg-white text-black border-2 border-white font-extrabold text-xs"
            >
              {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={stopAndSaveTimer}
              className="px-3.5 py-2 bg-[#39FF14] text-black border-2 border-white font-extrabold text-xs uppercase"
            >
              Guardar
            </button>
          </div>
        </NeoCard>
      )}

      {subTab === 'actividades' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-extrabold text-sm uppercase">Próximos Exámenes y Entregas</h2>
            <NeoButton size="sm" onClick={() => setShowNewExam(true)}>
              <Plus className="w-4 h-4" /> Examen
            </NeoButton>
          </div>

          {exams.length === 0 ? (
            <NeoCard className="p-6 text-center text-xs font-mono-brutal bg-white">
              Crea una Asignatura y programa tu próximo examen o parcial.
            </NeoCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exams.map((exam) => {
                const daysLeft = differenceInCalendarDays(parseISO(exam.exam_date), new Date());
                const progress = computeExamProgress(exam);
                const badgeText =
                  daysLeft < 0
                    ? 'FINALIZADO'
                    : daysLeft === 0
                      ? '¡HOY!'
                      : `FALTAN ${daysLeft} DÍAS`;

                return (
                  <NeoCard
                    key={exam.id}
                    interactive
                    onClick={() => setSelectedExamId(exam.id)}
                    className="p-4 space-y-3 bg-white"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-mono-brutal font-extrabold uppercase px-2 py-0.5 bg-[#39FF14] border border-black">
                          {exam.subject?.name || 'Asignatura'}
                        </span>
                        <h3 className="font-extrabold text-base mt-1.5">{exam.title}</h3>
                        <p className="text-xs font-mono-brutal font-bold text-neutral-600">
                          {exam.exam_date}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-black text-white text-[11px] font-mono-brutal font-extrabold shrink-0">
                        {badgeText}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono-brutal font-extrabold">
                        <span>TEMARIO DOMINADO</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-4 w-full bg-neutral-200 border-2 border-black overflow-hidden">
                        <div
                          className="h-full bg-[#39FF14] border-r-2 border-black transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </NeoCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {subTab === 'asignaturas' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-extrabold text-sm uppercase">Mis Asignaturas</h2>
            <NeoButton size="sm" onClick={() => setShowNewSubject(true)}>
              <Plus className="w-4 h-4" /> Asignatura
            </NeoButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((subj) => {
              const subjTopics = topics.filter((t) => t.subject_id === subj.id);
              const hours = (subj.total_study_seconds / 3600).toFixed(1);

              return (
                <NeoCard key={subj.id} className="p-4 space-y-3 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      onClick={() => setSelectedSubjectId(subj.id)}
                      className="cursor-pointer flex-1"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        <h3 className="font-extrabold text-base">{subj.name}</h3>
                      </div>
                      <p className="text-xs font-mono-brutal font-bold text-neutral-600 mt-1">
                        {subjTopics.length} temas · {hours}h acumuladas
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setTimerSubjectId(subj.id);
                        setSessionSeconds(0);
                        setTimerRunning(true);
                      }}
                      className="px-3 py-1.5 bg-[#39FF14] border-2 border-black shadow-[2px_2px_0px_#000] neo-press text-xs font-extrabold uppercase inline-flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" /> Estudiar
                    </button>
                  </div>

                  <div className="flex justify-end border-t border-black pt-2">
                    <button
                      onClick={() => setSelectedSubjectId(subj.id)}
                      className="text-xs font-mono-brutal font-extrabold underline"
                    >
                      Abrir Temario, Apuntes y PDFs →
                    </button>
                  </div>
                </NeoCard>
              );
            })}
          </div>
        </div>
      )}

      <NeoModal
        open={!!selectedExam}
        onClose={() => setSelectedExamId(null)}
        title={selectedExam?.title || 'Detalle Examen'}
        headerBg="bg-[#39FF14]"
      >
        {selectedExam && (
          <div className="space-y-4">
            <div className="p-3 border-2 border-black bg-[#39FF14] flex justify-between items-center">
              <span className="text-xs font-extrabold uppercase">Progreso del Parcial</span>
              <span className="text-xl font-mono-brutal font-extrabold">
                {computeExamProgress(selectedExam)}%
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase">
                1. Temas vinculados (Pulsa para cambiar estado)
              </h4>
              {(selectedExam.exam_topics || []).length === 0 ? (
                <p className="text-xs font-mono-brutal text-neutral-600">
                  Selecciona abajo qué temas entran en este examen.
                </p>
              ) : (
                (selectedExam.exam_topics || []).map((link) => {
                  const st = STATUS_CYCLE[link.status];
                  return (
                    <button
                      key={link.id}
                      onClick={() => cycleExamTopicStatus(link.id, link.status)}
                      className={`w-full p-3 border-2 border-black shadow-[3px_3px_0px_#000] neo-press flex items-center justify-between text-left ${st.bg}`}
                    >
                      <span className="font-bold text-sm pr-2">{link.topic?.title}</span>
                      <span className="text-[10px] font-mono-brutal font-extrabold px-2 py-0.5 border border-black bg-white text-black shrink-0">
                        {st.label}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="space-y-2 border-t-2 border-black pt-3">
              <h4 className="text-xs font-extrabold uppercase">
                2. Temario de {selectedExam.subject?.name}
              </h4>
              {topics
                .filter((t) => t.subject_id === selectedExam.subject_id)
                .map((topic) => {
                  const isLinked = (selectedExam.exam_topics || []).some(
                    (l) => l.topic_id === topic.id
                  );
                  return (
                    <button
                      key={topic.id}
                      onClick={() => toggleLinkTopicToExam(selectedExam.id, topic.id, isLinked)}
                      className={`w-full p-2.5 border-2 border-black flex items-center justify-between text-xs font-bold ${
                        isLinked ? 'bg-[#39FF14]' : 'bg-white'
                      }`}
                    >
                      <span>{topic.title}</span>
                      <CheckCircle2
                        className={`w-4 h-4 ${isLinked ? 'opacity-100' : 'opacity-25'}`}
                      />
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </NeoModal>

      <NeoModal
        open={!!selectedSubject && !selectedTopic}
        onClose={() => setSelectedSubjectId(null)}
        title={selectedSubject?.name || 'Asignatura'}
        headerBg="bg-[#39FF14]"
      >
        {selectedSubject && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                placeholder="Nuevo tema (ej. Tema 1: Derivadas)"
                className="flex-1 px-3 py-2 border-2 border-black"
              />
              <NeoButton onClick={() => handleCreateTopic(selectedSubject.id)}>Añadir</NeoButton>
            </div>

            <div className="space-y-2">
              {topics
                .filter((t) => t.subject_id === selectedSubject.id)
                .map((topic) => (
                  <NeoCard
                    key={topic.id}
                    interactive
                    onClick={() => {
                      setDraftNotes(topic.notes_markdown || '');
                      setSelectedTopicId(topic.id);
                    }}
                    className="p-3 flex items-center justify-between bg-white"
                  >
                    <div>
                      <div className="font-extrabold text-sm">{topic.title}</div>
                      <div className="text-[11px] font-mono-brutal text-neutral-600">
                        {(topic.attachments || []).length} archivos adjuntos
                      </div>
                    </div>
                    <FileText className="w-4 h-4" />
                  </NeoCard>
                ))}
            </div>
          </div>
        )}
      </NeoModal>

      <NeoModal
        open={!!selectedTopic}
        onClose={() => setSelectedTopicId(null)}
        title={selectedTopic?.title || 'Apuntes'}
        headerBg="bg-[#39FF14]"
      >
        {selectedTopic && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-extrabold uppercase">
                  Apuntes en la Nube (Markdown)
                </label>
                <span className="text-[10px] font-mono-brutal font-bold px-1.5 py-0.5 bg-[#39FF14] border border-black">
                  {savingNotes ? 'Guardando en nube...' : 'Sincronizado ✓'}
                </span>
              </div>
              <textarea
                rows={8}
                value={draftNotes}
                onChange={(e) => handleNotesChange(selectedTopic.id, e.target.value)}
                placeholder="Tus apuntes se guardan automáticamente en Supabase..."
                className="w-full p-3 border-2 border-black font-mono-brutal text-sm bg-white"
              />
            </div>

            <div className="space-y-2 border-t-2 border-black pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase">Exámenes Tipo (PDF / Foto)</span>
                <label className="px-3 py-1.5 bg-black text-[#39FF14] border-2 border-black text-xs font-bold cursor-pointer inline-flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  {uploading ? 'Subiendo...' : 'Subir Archivo'}
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadTopicAttachment(selectedTopic, f);
                    }}
                  />
                </label>
              </div>

              {(selectedTopic.attachments || []).map((att, idx) => (
                <button
                  key={idx}
                  onClick={() => openSignedAttachment(att.path)}
                  className="w-full p-2.5 border-2 border-black bg-neutral-100 flex items-center justify-between text-xs font-bold"
                >
                  <span className="truncate pr-2">{att.name}</span>
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </NeoModal>

      <NeoModal
        open={showNewSubject}
        onClose={() => setShowNewSubject(false)}
        title="Nueva Asignatura"
        headerBg="bg-[#39FF14]"
      >
        <form onSubmit={handleCreateSubject} className="space-y-3">
          <input
            type="text"
            required
            placeholder="Nombre (ej. Física Cuántica)"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            className="w-full p-3 border-2 border-black"
          />
          <input
            type="text"
            placeholder="Código opcional (ej. FIS-302)"
            value={subjectCode}
            onChange={(e) => setSubjectCode(e.target.value)}
            className="w-full p-3 border-2 border-black"
          />
          <NeoButton type="submit" className="w-full">
            Crear Asignatura
          </NeoButton>
        </form>
      </NeoModal>

      <NeoModal
        open={showNewExam}
        onClose={() => setShowNewExam(false)}
        title="Programar Examen"
        headerBg="bg-[#39FF14]"
      >
        <form onSubmit={handleCreateExam} className="space-y-3">
          <select
            required
            value={examSubjectId}
            onChange={(e) => setExamSubjectId(e.target.value)}
            className="w-full p-3 border-2 border-black bg-white"
          >
            <option value="">Selecciona asignatura...</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            required
            placeholder="Título (ej. Parcial 1)"
            value={examTitle}
            onChange={(e) => setExamTitle(e.target.value)}
            className="w-full p-3 border-2 border-black"
          />
          <input
            type="date"
            required
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="w-full p-3 border-2 border-black bg-white"
          />
          <NeoButton type="submit" className="w-full">
            Guardar en Nube
          </NeoButton>
        </form>
      </NeoModal>
    </div>
  );
};