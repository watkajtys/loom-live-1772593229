import React from 'react';

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  src: string;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
}

export default function VideoPlayer({
  videoRef,
  src,
  isPlaying,
  onPlay,
  onPause,
  onTimeUpdate,
  onDurationChange
}: VideoPlayerProps) {

  const formatTime = (timeInSeconds: number) => {
    const pad = (num: number, size = 2) => num.toString().padStart(size, '0');
    const hrs = Math.floor(timeInSeconds / 3600);
    const mins = Math.floor((timeInSeconds % 3600) / 60);
    const secs = Math.floor(timeInSeconds % 60);
    const frames = Math.floor((timeInSeconds % 1) * 24); 
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}:${pad(frames)}`;
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    onTimeUpdate(e.currentTarget.currentTime);
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    onDurationChange(e.currentTarget.duration);
  };

  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  return (
    <div className="relative flex-1 bg-black flex items-center justify-center group overflow-hidden">
      
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        onPlay={onPlay}
        onPause={onPause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={handleTogglePlay}
        crossOrigin="anonymous"
      />

      <div className="absolute top-4 left-4 flex flex-col gap-1 font-mono text-[10px] z-20">
        <div className="bg-obsidian/80 px-2 py-0.5 border-l border-industrial-orange text-ghost-white uppercase">SRC: MAIN_CAM.RAW</div>
        <div className="bg-obsidian/80 px-2 py-0.5 border-l border-gray-500 text-gray-300">COLOR: REC.709_D65</div>
      </div>
      
      <div className="absolute top-4 right-4 font-mono text-right z-20">
        <div className="text-xl font-bold text-ghost-white tabular-nums bg-obsidian/80 px-3 py-1 border border-industrial-gray">
          {formatTime(videoRef.current?.currentTime || 0)}
        </div>
        <div className="text-[9px] text-gray-500 mt-1 uppercase">
          Frame_{String(Math.floor((videoRef.current?.currentTime || 0) * 24)).padStart(6, '0')}
        </div>
      </div>
      
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <button 
            className="p-6 bg-obsidian/40 border border-industrial-orange text-industrial-orange backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
            onClick={handleTogglePlay}
          >
            <span className="material-symbols-outlined text-4xl">play_arrow</span>
          </button>
        </div>
      )}
    </div>
  );
}