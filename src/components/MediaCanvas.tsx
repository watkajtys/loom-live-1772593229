import React, { useRef, useEffect } from 'react';
import { RecordModel } from 'pocketbase';
import { pb } from '../lib/pb';
import { Play } from 'lucide-react';

interface MediaCanvasProps {
  video: RecordModel | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export function MediaCanvas({ video, isPlaying, onPlayPause, onTimeUpdate, onDurationChange, videoRef }: MediaCanvasProps) {
  
  let videoUrl = '';
  try {
    videoUrl = video && video.media_file ? pb.files.getURL(video, video.media_file) : '';
  } catch (e) {
    // ignore
  }

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const handleTimeUpdate = () => onTimeUpdate(v.currentTime);
    const handleDurationChange = () => onDurationChange(v.duration);

    v.addEventListener('timeupdate', handleTimeUpdate);
    v.addEventListener('loadedmetadata', handleDurationChange);

    return () => {
      v.removeEventListener('timeupdate', handleTimeUpdate);
      v.removeEventListener('loadedmetadata', handleDurationChange);
    };
  }, [videoRef, onTimeUpdate, onDurationChange]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, videoRef]);

  return (
    <div className="flex-1 p-8 flex items-center justify-center relative bg-obsidian">
      <div className="w-full max-w-5xl aspect-video frosted-glass rounded-xl overflow-hidden shadow-2xl relative group bg-industrial">
        
        {video ? (
          <video 
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            onClick={onPlayPause}
            crossOrigin="anonymous"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500">
            No video loaded.
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>

        {!isPlaying && video && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button 
              onClick={onPlayPause}
              className="size-20 rounded-full bg-hazard/90 text-black flex items-center justify-center shadow-xl hover:scale-105 transition-transform pointer-events-auto"
            >
              <Play className="w-10 h-10 ml-1 fill-black" />
            </button>
          </div>
        )}

        <div className="absolute top-4 left-4 flex gap-2 pointer-events-none">
          <span className="px-2 py-1 rounded bg-obsidian/60 backdrop-blur-md text-[10px] font-mono text-white border border-white/10">
            4K • 23.976 fps
          </span>
          <span className="px-2 py-1 rounded bg-hazard/60 backdrop-blur-md text-[10px] font-mono text-black font-bold border border-black/10">
            REC 709
          </span>
        </div>
      </div>
    </div>
  );
}