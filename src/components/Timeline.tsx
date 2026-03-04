import React, { useRef, useMemo } from 'react';
import { RecordModel } from 'pocketbase';
import { SkipBack, PlayCircle, SkipForward, Volume2, Settings, Maximize, PauseCircle } from 'lucide-react';

interface TimelineProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  comments: RecordModel[];
  onPlayPause: () => void;
  onTimelineClick: (time: number) => void;
  onMarkerClick: (time: number) => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 24); // Assuming 24fps
  
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
}

export function Timeline({ currentTime, duration, isPlaying, comments, onPlayPause, onTimelineClick, onMarkerClick }: TimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    
    const durationToUse = duration || 60; // fallback if duration isn't loaded
    
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const clickTime = percentage * durationToUse;

    // Use toFixed to avoid excessive precision and simulate a standard float read
    onTimelineClick(parseFloat(clickTime.toFixed(3)));
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Filter for unique timecodes to avoid stacking markers at exact same pixel
  const uniqueMarkers = useMemo(() => {
    const markers = new Map<number, boolean>();
    comments.forEach(c => {
      // If we already have a marker, keep track if any are unresolved
      if (markers.has(c.timecode)) {
        if (!c.is_resolved) markers.set(c.timecode, false);
      } else {
        markers.set(c.timecode, c.is_resolved);
      }
    });
    return Array.from(markers.entries()).map(([timecode, isResolved]) => ({
      timecode,
      isResolved,
      percentage: duration > 0 ? (timecode / duration) * 100 : 0
    }));
  }, [comments, duration]);

  return (
    <div className="h-32 bg-obsidian/90 backdrop-blur-xl border-t border-industrial px-6 py-4 flex flex-col gap-4 z-20">
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <button className="hover:text-hazard transition-colors">
            <SkipBack className="w-[18px] h-[18px]" />
          </button>
          <button className="hover:text-hazard transition-colors" onClick={onPlayPause}>
            {isPlaying ? <PauseCircle className="w-[18px] h-[18px]" /> : <PlayCircle className="w-[18px] h-[18px]" />}
          </button>
          <button className="hover:text-hazard transition-colors">
            <SkipForward className="w-[18px] h-[18px]" />
          </button>
          <span className="text-hazard font-bold ml-2">{formatTime(currentTime)}</span>
          <span className="opacity-40">/</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="flex items-center gap-4">
          <Volume2 className="w-4 h-4" />
          <Settings className="w-4 h-4" />
          <Maximize className="w-4 h-4" />
        </div>
      </div>
      
      <div 
        ref={trackRef}
        className="relative h-12 celluloid-track rounded-md border border-industrial flex items-center overflow-hidden cursor-pointer"
        onClick={handleTrackClick}
      >
        <div className="absolute inset-0 flex items-center">
          {/* Markers */}
          {uniqueMarkers.map((m, i) => (
            <div 
              key={i}
              className={`absolute size-3 rounded-full border-2 border-obsidian z-10 hover:scale-150 transition-transform ${m.isResolved ? 'bg-slate-500' : 'bg-hazard shadow-[0_0_8px_rgba(255,193,7,0.6)]'}`}
              style={{ left: `calc(${m.percentage}% - 6px)` }}
              title={`Marker at ${m.timecode}s`}
              onClick={(e) => {
                e.stopPropagation();
                onMarkerClick(m.timecode);
              }}
            />
          ))}

          {/* Active Progress */}
          <div 
            className="absolute left-0 top-0 bottom-0 bg-hazard/10 border-r-2 border-hazard z-20 pointer-events-none"
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="absolute right-[-1px] top-[-8px] bottom-[-8px] w-0.5 bg-hazard shadow-[0_0_10px_rgba(255,193,7,0.6)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-2 h-2 rotate-45 bg-hazard"></div>
            </div>
          </div>

          {/* Film Strip Visuals */}
          <div className="flex gap-1 opacity-20 pointer-events-none w-full overflow-hidden absolute inset-0 pt-2 pl-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="min-w-[5rem] h-8 bg-industrial rounded-sm shrink-0"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}