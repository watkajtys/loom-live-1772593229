import React, { useRef, useEffect, useState } from 'react';
import { RecordModel } from 'pocketbase';
import { Filter, Paperclip, Send, AtSign, Hash, CheckCircle2, AlertCircle } from 'lucide-react';

interface FeedbackDrawerProps {
  comments: RecordModel[];
  currentTime: number;
  pendingCommentTime: number | null;
  onAddComment: (content: string, timecode: number) => void;
  onToggleResolve: (id: string, isResolved: boolean) => void;
  onCommentClick: (timecode: number) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 24);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
}

export function FeedbackDrawer({ comments, currentTime, pendingCommentTime, onAddComment, onToggleResolve, onCommentClick, inputRef }: FeedbackDrawerProps) {
  const [content, setContent] = useState('');

  // When a pending time is set, automatically focus the input
  useEffect(() => {
    if (pendingCommentTime !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [pendingCommentTime, inputRef]);

  const handleSubmit = () => {
    if (!content.trim()) return;
    const timeToUse = pendingCommentTime !== null ? pendingCommentTime : currentTime;
    onAddComment(content, timeToUse);
    setContent('');
    // pendingCommentTime should be cleared by parent after submit or keep it to allow multiple?
    // We'll let the parent handle clearing it, or just keep writing at the same timecode.
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const activeTimeStr = formatTime(pendingCommentTime !== null ? pendingCommentTime : currentTime);

  return (
    <aside className="w-[400px] border-l border-industrial bg-background-dark/50 backdrop-blur-md flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-industrial flex items-center justify-between shrink-0">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Feedback</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Sorted by time</span>
          <Filter className="w-4 h-4 text-slate-500" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {comments.map((comment) => (
          <div 
            key={comment.id}
            className={`z-layer rounded-xl p-4 border relative overflow-hidden cursor-pointer ${
              comment.is_resolved 
                ? 'bg-obsidian/40 border-industrial opacity-60' 
                : 'bg-obsidian/80 border-industrial'
            }`}
            onClick={() => onCommentClick(comment.timecode)}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-industrial flex items-center justify-center text-xs font-bold uppercase text-hazard">
                  {comment.author_name?.substring(0, 2) || 'U'}
                </div>
                <div>
                  <p className={`text-xs font-bold ${comment.is_resolved ? 'text-slate-400' : 'text-white'}`}>
                    {comment.author_name}
                  </p>
                  <p className="text-[10px] text-hazard font-mono">{formatTime(comment.timecode)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                {comment.is_resolved ? (
                  <div className="flex items-center gap-1 text-slate-500">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[10px] font-bold">RESOLVED</span>
                  </div>
                ) : (
                  <input 
                    type="checkbox" 
                    className="rounded border-industrial bg-transparent text-hazard focus:ring-hazard size-4 cursor-pointer"
                    checked={comment.is_resolved}
                    onChange={(e) => onToggleResolve(comment.id, e.target.checked)}
                  />
                )}
              </div>
            </div>
            <p className={`text-sm leading-relaxed ${comment.is_resolved ? 'text-slate-500 italic line-through' : 'text-slate-300'}`}>
              {comment.content}
            </p>
          </div>
        ))}
        {comments.length === 0 && (
          <div className="text-center text-slate-500 text-sm mt-10">
            No feedback yet. Be the first to comment!
          </div>
        )}
      </div>

      <div className="p-6 bg-obsidian border-t border-industrial shrink-0">
        <div className="relative">
          <textarea 
            ref={inputRef}
            className="w-full bg-industrial border-industrial rounded-xl text-sm focus:ring-hazard focus:border-hazard placeholder:text-slate-500 transition-all resize-none p-4 pb-12 text-white" 
            placeholder={`Add a comment at ${activeTimeStr}...`} 
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
          ></textarea>
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button className="p-1.5 text-slate-400 hover:text-white transition-colors">
              <Paperclip className="w-4 h-4" />
            </button>
            <button 
              onClick={handleSubmit}
              className="size-8 bg-hazard rounded-lg flex items-center justify-center text-black hover:bg-hazard/80 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AtSign className="w-4 h-4 text-slate-500" />
            <Hash className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-[10px] text-slate-500">Press Enter to send</p>
        </div>
      </div>
    </aside>
  );
}