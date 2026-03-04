import React, { useRef, useMemo } from 'react';
import { RecordModel } from 'pocketbase';

interface TimelineProps {
  currentTime: number;
  duration: number;
  comments: RecordModel[];
  draftPin: number | null;
  onTimelineClick: (time: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
}

export default function Timeline({
  currentTime,
  duration,
  comments,
  draftPin,
  onTimelineClick,
  isPlaying,
  onPlayToggle
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !duration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    onTimelineClick(newTime);
  };

  const currentPercentage = duration ? (currentTime / duration) * 100 : 0;
  
  const draftPinPercentage = duration && draftPin !== null ? (draftPin / duration) * 100 : null;

  const formatTimecode = (timeInSeconds: number) => {
    const pad = (num: number, size = 2) => num.toString().padStart(size, '0');
    const hrs = Math.floor(timeInSeconds / 3600);
    const mins = Math.floor((timeInSeconds % 3600) / 60);
    const secs = Math.floor(timeInSeconds % 60);
    const frames = Math.floor((timeInSeconds % 1) * 24);
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}:${pad(frames)}`;
  };

  const colors = ["bg-gray-300", "bg-gray-400", "bg-gray-500"];
  
  const renderComments = useMemo(() => {
    return comments.map((c, i) => {
      if (!duration) return null;
      const pct = (c.timestamp / duration) * 100;
      const colorClass = colors[i % colors.length];
      
      return (
        <div 
          key={c.id}
          className="absolute top-0 bottom-0 w-[1px] shadow-[0_0_5px_rgba(255,255,255,0.3)] z-10 bg-ghost-white"
          style={{ left: `${pct}%` }}
        >
          <div className={`absolute top-0 left-[-3px] w-1.5 h-1.5 ${colorClass}`}></div>
        </div>
      );
    });
  }, [comments, duration]);


  return (
    <div className="h-60 bg-obsidian flex flex-col font-mono border-t border-industrial-gray shrink-0">
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-industrial-gray bg-industrial-gray/50 shrink-0">
        <div className="flex gap-4">
          <button className="text-ghost-white flex items-center gap-1 text-[10px] hover:text-industrial-orange transition-colors">
            <span className="material-symbols-outlined text-xs">add_box</span> MARKER (M)
          </button>
          <button className="text-gray-400 flex items-center gap-1 text-[10px] hover:text-ghost-white transition-colors">
            <span className="material-symbols-outlined text-xs">content_cut</span> TRIM_MODE
          </button>
        </div>
        <div className="flex gap-3 items-center">
          <span className="text-[9px] text-gray-400">ZOOM_LEVEL: 1:1</span>
          <div className="w-24 h-1 bg-industrial-gray"><div className="w-2/3 h-full bg-ghost-white"></div></div>
        </div>
      </div>

      <div 
        className="flex-1 relative overflow-hidden cursor-pointer group"
        ref={timelineRef}
        onPointerDown={handlePointerDown}
      >
        <div className="absolute inset-0 grid grid-cols-12 opacity-10 pointer-events-none">
          {Array.from({length: 11}).map((_, i) => (
             <div key={i} className="border-r border-ghost-white"></div>
          ))}
        </div>

        <div className="p-2 space-y-1 h-full flex flex-col justify-center pointer-events-none">
          <div className="h-10 border border-industrial-gray bg-industrial-gray/20 relative flex items-center">
            <span className="text-[8px] text-gray-500 absolute left-1 top-1">V1</span>
            <div className="h-full w-full bg-industrial-orange/10 border-x border-industrial-orange/30 flex items-center px-2 relative mx-8">
               <span className="text-[9px] text-industrial-orange/70 truncate">CLIP_MAIN</span>
               {renderComments}
            </div>
          </div>
          
          <div className="h-8 border border-industrial-gray bg-industrial-gray/10 relative flex items-center">
            <span className="text-[8px] text-gray-500 absolute left-1 top-1">A1</span>
            <div className="w-full h-full px-12 flex items-center">
              <div className="w-full h-2 bg-ghost-white/10 border-y border-ghost-white/20"></div>
            </div>
          </div>
          
          <div className="h-8 border border-industrial-gray bg-industrial-gray/10 relative flex items-center">
            <span className="text-[8px] text-gray-500 absolute left-1 top-1">A2</span>
            <div className="w-full h-full px-12 flex items-center">
              <div className="w-3/4 h-2 bg-ghost-white/10 border-y border-ghost-white/20"></div>
            </div>
          </div>
        </div>

        {/* Playhead */}
        <div 
          className="absolute top-0 bottom-0 w-[1px] bg-industrial-orange z-20 transition-all duration-75 pointer-events-none"
          style={{ left: `${currentPercentage}%` }}
        >
          <div className="absolute top-0 left-[-4px] w-2 h-2 bg-industrial-orange rotate-45"></div>
        </div>

        {/* Draft Pin */}
        {draftPinPercentage !== null && (
          <div 
            className="absolute top-0 bottom-0 w-[1px] bg-ghost-white z-10 opacity-70 pointer-events-none"
            style={{ left: `${draftPinPercentage}%` }}
          >
             <div className="absolute top-0 left-[-4px] w-2 h-2 bg-ghost-white rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      <div className="bg-obsidian-slate border-t border-industrial-gray p-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button className="material-symbols-outlined text-gray-400 hover:text-industrial-orange text-lg transition-colors">skip_previous</button>
            <button 
              className="material-symbols-outlined text-ghost-white hover:text-industrial-orange text-2xl transition-colors"
              onClick={onPlayToggle}
            >
              {isPlaying ? 'pause' : 'play_arrow'}
            </button>
            <button className="material-symbols-outlined text-gray-400 hover:text-industrial-orange text-lg transition-colors">skip_next</button>
          </div>
          <div className="h-4 w-[1px] bg-gray-600"></div>
          <span className="text-[9px] text-ghost-white font-bold tabular-nums">
            {formatTimecode(currentTime)} / {formatTimecode(duration)}
          </span>
        </div>
        <div className="flex items-center gap-4 text-[9px] text-gray-400 uppercase">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs">volume_up</span>
            <div className="w-16 h-1 bg-obsidian"><div className="w-3/4 h-full bg-ghost-white"></div></div>
          </div>
          <span className="border-l border-gray-600 pl-4">48kHz_PCM</span>
        </div>
      </div>
    </div>
  );
}