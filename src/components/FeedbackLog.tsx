import React, { useState, useEffect, useRef } from 'react';
import { RecordModel } from 'pocketbase';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface FeedbackLogProps {
  comments: RecordModel[];
  draftPin: number | null;
  currentTime: number;
  onSubmit: (content: string, timestamp: number) => void;
  onCommentClick: (time: number) => void;
  onToggleResolve: (commentId: string, resolved: boolean) => void;
}

export default function FeedbackLog({
  comments,
  draftPin,
  currentTime,
  onSubmit,
  onCommentClick,
  onToggleResolve
}: FeedbackLogProps) {
  const [draftContent, setDraftContent] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (draftPin !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [draftPin]);

  const handleSubmit = () => {
    if (!draftContent.trim() || draftPin === null) return;
    onSubmit(draftContent, draftPin);
    setDraftContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatTimecode = (timeInSeconds: number) => {
    const pad = (num: number, size = 2) => num.toString().padStart(size, '0');
    const hrs = Math.floor(timeInSeconds / 3600);
    const mins = Math.floor((timeInSeconds % 3600) / 60);
    const secs = Math.floor(timeInSeconds % 60);
    const frames = Math.floor((timeInSeconds % 1) * 24);
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}:${pad(frames)}`;
  };

  return (
    <>
      <div className="p-3 border-b border-industrial-gray flex justify-between items-center bg-obsidian-slate shrink-0">
        <h3 className="text-[10px] font-bold tracking-widest text-ghost-white uppercase font-sans">Log.Entries</h3>
        <span className="text-[9px] text-gray-500 font-mono">COUNT: {String(comments.length).padStart(2, '0')}</span>
      </div>

      <div className="p-3 bg-industrial-gray/30 border-b border-industrial-gray shrink-0 transition-opacity duration-200" style={{ opacity: draftPin !== null ? 1 : 0.5 }}>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-[9px] font-mono">
            <span className="text-industrial-orange font-bold tabular-nums">
              {draftPin !== null ? formatTimecode(draftPin) : formatTimecode(currentTime)}
            </span>
            <span className="text-gray-500">@GUEST_REVIEWER</span>
          </div>
          <textarea 
            ref={inputRef}
            className="bg-obsidian border border-industrial-gray w-full text-[10px] p-2 focus:border-industrial-orange focus:ring-0 placeholder:text-gray-600 text-ghost-white resize-none font-sans" 
            placeholder={draftPin !== null ? "COMMIT_FEEDBACK..." : "CLICK TIMELINE TO ADD FEEDBACK..."} 
            rows={2}
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={draftPin === null}
          ></textarea>
          <div className="flex justify-end">
            <button 
              className="px-3 py-1 bg-industrial-orange text-obsidian text-[9px] font-bold hover:bg-ghost-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-sans"
              onClick={handleSubmit}
              disabled={draftPin === null || !draftContent.trim()}
            >
              SUBMIT_LOG
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-2 font-mono">
        {comments.map((comment) => {
           return (
              <div 
                key={comment.id} 
                className={twMerge(
                  "border border-industrial-gray p-2.5 border-l-2 cursor-pointer transition-all hover:bg-industrial-gray/40",
                  comment.resolved ? "bg-industrial-gray/10 border-l-gray-600 opacity-40" : "bg-industrial-gray/20 border-l-ghost-white"
                )}
                onClick={() => onCommentClick(comment.timestamp)}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      className={twMerge(
                        "w-3 h-3 bg-obsidian border-gray-600 focus:ring-0 rounded-none cursor-pointer",
                        comment.resolved ? "text-gray-500" : "text-industrial-orange"
                      )}
                      checked={comment.resolved}
                      onChange={(e) => onToggleResolve(comment.id, e.target.checked)}
                    />
                    <span className={twMerge(
                      "text-[10px] font-bold tabular-nums",
                      comment.resolved ? "text-gray-500" : "text-ghost-white"
                    )}>
                      {formatTimecode(comment.timestamp)}
                    </span>
                  </div>
                  <span className="text-[8px] text-gray-500 uppercase">@{comment.author || 'UNKNOWN'}</span>
                </div>
                <p className={twMerge(
                  "text-[10px] leading-normal font-sans",
                  comment.resolved ? "text-gray-500 line-through" : "text-gray-300"
                )}>
                  {comment.content}
                </p>
              </div>
           );
        })}
        {comments.length === 0 && (
           <div className="text-[10px] text-gray-500 text-center p-4 font-mono">NO_ENTRIES_FOUND</div>
        )}
      </div>

      <div className="p-3 bg-obsidian-slate border-t border-industrial-gray grid grid-cols-2 gap-y-2 text-[8px] shrink-0 font-mono">
        <div className="flex flex-col">
          <span className="text-gray-500">BUFFER_PIPE</span>
          <span className="text-ghost-white">CONNECTED_10G</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-500">LATENCY</span>
          <span className="text-ghost-white">14MS</span>
        </div>
        <div className="flex flex-col col-span-2">
          <span className="text-gray-500">CLIENT_HNDL</span>
          <span className="text-industrial-orange uppercase">PRJ_X_CORE_DARK</span>
        </div>
      </div>
    </>
  );
}