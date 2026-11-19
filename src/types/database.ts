export type AppSection = 'calendario' | 'estudios' | 'deporte' | 'grupo' | 'creativa';

export type TopicStatus = 'pendiente' | 'repaso' | 'dominado';

export interface UserSettings {
  user_id: string;
  app_name: string;
  weekly_workout_goal_hours: number;
  color_estudios: string;
  color_deporte: string;
  color_grupo: string;
  bg_creativa: string;
  accent_creativa: string;
}

export interface CalendarEvent {
  entity_id: string;
  user_id: string;
  module: 'estudios' | 'deporte' | 'grupo';
  title: string;
  subtitle: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  is_completed: boolean;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  code: string | null;
  total_study_seconds: number;
  created_at: string;
}

export interface TopicAttachment {
  name: string;
  path: string;
  type: 'pdf' | 'image';
}

export interface Topic {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  order_index: number;
  notes_markdown: string;
  attachments: TopicAttachment[];
  created_at: string;
}

export interface ExamTopicLink {
  id: string;
  exam_id: string;
  topic_id: string;
  status: TopicStatus;
  topic?: Topic;
}

export interface Exam {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  exam_date: string;
  exam_time: string | null;
  notes: string;
  created_at: string;
  subject?: Subject;
  exam_topics?: ExamTopicLink[];
}

export interface Workout {
  id: string;
  user_id: string;
  title: string;
  discipline: string;
  workout_date: string;
  start_time: string;
  end_time: string;
  planned_minutes: number;
  actual_minutes: number | null;
  completed: boolean;
  tags: string[];
  fatigue_level: number | null;
  notes: string;
  series_id: string | null;
  created_at: string;
}

export interface Concert {
  id: string;
  user_id: string;
  title: string;
  venue_city: string;
  concert_date: string;
  concert_time: string;
  notes: string;
  created_at: string;
}

export interface ConcertSong {
  id: string;
  user_id: string;
  concert_id: string;
  title: string;
  is_learned: boolean;
  key_bpm_notes: string;
  reference_url: string;
  audio_path: string | null;
}

export interface ConcertTask {
  id: string;
  user_id: string;
  concert_id: string;
  title: string;
  is_done: boolean;
  due_date: string | null;
}

export interface CreativeProject {
  id: string;
  user_id: string;
  title: string;
  category: string;
  description: string;
  created_at: string;
}

export type CreativeNodeType = 'audioNode' | 'lyricsNode' | 'ideaNode' | 'imageNode';

export interface CreativeNodeData {
  label?: string;
  content?: string;
  filePath?: string;
  fileName?: string;
  [key: string]: unknown;
}