import React, { useRef, useState } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { useStorageFile } from '../../hooks/useStorageFile';

interface Props {
  storagePath: string;
  label?: string;
}

export const BrutalistAudioPlayer: React.FC<Props> = ({ storagePath, label }) => {
  const { signedUrl, loading } = useStorageFile(storagePath);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || !signedUrl) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    setProgress((audio.currentTime / audio.duration) * 100);
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
    setProgress(ratio * 100);
  };

  const formatTime = (sec: number) => {
    if (!sec || Number.isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="p-2 border-2 border-black bg-neutral-100 text-xs font-mono-brutal font-bold">
        Cargando audio...
      </div>
    );
  }

  return (
    <div
      className="nodrag nopan p-2.5 bg-white text-black border-2 border-black shadow-[2px_2px_0px_#000] space-y-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      {signedUrl && (
        <audio
          ref={audioRef}
          src={signedUrl}
          preload="metadata"
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={() => {
            setPlaying(false);
            setProgress(0);
          }}
        />
      )}

      {label && (
        <div className="flex items-center gap-1.5 text-[11px] font-mono-brutal font-bold truncate">
          <Volume2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{label}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={togglePlay}
          className="w-9 h-9 shrink-0 flex items-center justify-center bg-black text-white border-2 border-black neo-press"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <div
          onClick={handleScrub}
          className="flex-1 h-5 bg-neutral-200 border-2 border-black cursor-pointer relative overflow-hidden"
        >
          <div
            className="h-full bg-[#39FF14] border-r-2 border-black transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>

        <span className="text-[11px] font-mono-brutal font-bold shrink-0">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};