import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { pb } from './lib/pocketbase';

export default function ReviewConsole() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
  const [isHoveringTimeline, setIsHoveringTimeline] = useState(false);
  const [timelineHoverPos, setTimelineHoverPos] = useState({ x: 0, seconds: 0 });
  
  // Input Form State
  const inputRef = useRef<HTMLInputElement>(null);
  const [newFeedbackContent, setNewFeedbackContent] = useState('');
  
  // URL Params State
  const isInputFocused = searchParams.get('focus') === 'true';
  const inputTimeSeconds = searchParams.get('time') ? parseFloat(searchParams.get('time')!) : null;

  useEffect(() => {
    // Focus logic based on URL param
    if (isInputFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInputFocused]);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const records = await pb.collection('feedbacks').getFullList({
          filter: `slug = "${slug}"`,
          sort: 'time_seconds',
        });
        setFeedbacks(records);
      } catch (err) {
        console.error("Failed to fetch feedbacks:", err);
      }
    };
    
    fetchFeedbacks();
    
    // Subscribe to real-time changes
    pb.collection('feedbacks').subscribe('*', function (e) {
      if (e.action === 'create' && e.record.slug === slug) {
        setFeedbacks((prev) => [...prev, e.record].sort((a, b) => a.time_seconds - b.time_seconds));
      } else if (e.action === 'update') {
        setFeedbacks((prev) => prev.map(f => f.id === e.record.id ? e.record : f).sort((a, b) => a.time_seconds - b.time_seconds));
      } else if (e.action === 'delete') {
        setFeedbacks((prev) => prev.filter(f => f.id !== e.record.id));
      }
    });

    return () => {
      pb.collection('feedbacks').unsubscribe('*');
    };
  }, [slug]);

  // Video duration mock (20 minutes for example)
  const videoDuration = 1200; 

  // Format seconds to HH:MM:SS:FF
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    const f = Math.floor((seconds % 1) * 24).toString().padStart(2, '0'); // Assuming 24fps
    return `${h}:${m}:${s}:${f}`;
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const seconds = pct * videoDuration;
    setTimelineHoverPos({ x, seconds });
    if (!isHoveringTimeline) setIsHoveringTimeline(true);
  };

  const handleTimelineMouseLeave = () => {
    setIsHoveringTimeline(false);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newSeconds = pct * videoDuration;
    
    setCurrentTimeSeconds(newSeconds);
    setIsPlaying(false); // Pause
    
    // Set URL params to trigger focus
    setSearchParams({ focus: 'true', time: newSeconds.toString() });
  };

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedbackContent.trim() || inputTimeSeconds === null) return;
    
    const timeDisplay = formatTime(inputTimeSeconds);
    
    try {
      await pb.collection('feedbacks').create({
        slug,
        time_seconds: inputTimeSeconds,
        time_display: timeDisplay,
        content: newFeedbackContent,
        is_resolved: false
      });
      
      setNewFeedbackContent('');
      setSearchParams({}); // Clear params after submit
    } catch (err) {
      console.error("Failed to create feedback:", err);
    }
  };

  const toggleResolved = async (id: string, currentResolved: boolean) => {
    try {
      await pb.collection('feedbacks').update(id, {
        is_resolved: !currentResolved
      });
    } catch (err) {
      console.error("Failed to update feedback:", err);
    }
  };

  const renderEmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center relative bg-obsidian-slate">
      <div className="mb-16">
        <h2 className="font-ibm text-5xl font-bold text-zinc-800 tracking-tighter opacity-20">STATION_IDLE</h2>
        <div className="h-[2px] w-full bg-zinc-800/40 mt-2"></div>
      </div>
      <button 
        onClick={() => setSearchParams({ focus: 'true', time: '0' })}
        className="rugged-btn brutalist-border-orange bg-zinc-900 px-8 py-5 flex flex-col items-center gap-3 hover:bg-zinc-800 group border-industrial-orange"
      >
        <span className="material-symbols-outlined text-3xl text-industrial-orange group-hover:scale-110 transition-transform">add_box</span>
        <span className="monospaced-ui font-bold text-xs text-zinc-200 group-hover:text-industrial-orange">INITIALIZE_FIRST_MARKER</span>
      </button>
      <div className="absolute bottom-10 left-0 right-0 px-10">
        <div className="border-t border-zinc-800/40 pt-6">
          <div className="flex justify-center mb-3">
            <span className="material-symbols-outlined text-zinc-800 text-lg">database</span>
          </div>
          <p className="font-ibm text-[10px] text-zinc-700 leading-relaxed uppercase tracking-wider">
            AUTO_SYNC_ENABLED: Feedback packets are currently routed to the <span className="text-zinc-600">PocketBase</span> instance for namespace: <span className="text-industrial-orange/60 font-bold">#{slug?.toUpperCase()}</span>. No local cache detected.
          </p>
        </div>
      </div>
    </div>
  );

  const renderPopulatedState = () => (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 bg-[#0a0e14]">
      {feedbacks.map((item) => (
        <div 
          key={item.id} 
          className={`brutalist-border p-3 flex flex-col gap-2 group transition-colors ${
            item.is_resolved ? 'bg-slate-900/20 border-slate-800' : 'bg-slate-900/40 hover:border-industrial-orange'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                checked={item.is_resolved}
                onChange={() => toggleResolved(item.id, item.is_resolved)}
                className="w-3 h-3 bg-black border-slate-700 text-industrial-orange focus:ring-0 focus:ring-offset-0" 
              />
              <span className={`monospaced-ui text-[10px] font-bold ${item.is_resolved ? 'text-zinc-600 line-through' : 'text-industrial-orange'}`}>
                {item.time_display}
              </span>
            </div>
            <span className={`material-symbols-outlined text-sm ${item.is_resolved ? 'text-zinc-600' : 'text-green-500'}`}>
              cloud_done
            </span>
          </div>
          <p className={`text-xs font-ibm leading-relaxed ${item.is_resolved ? 'text-zinc-600' : 'text-ghost-white'}`}>
            {item.content}
          </p>
          <div className="flex justify-between items-center mt-2 border-t border-slate-800 pt-2">
            <span className="text-[9px] monospaced-ui text-slate-500">SYNC_SUCCESS</span>
            <span className="text-[9px] monospaced-ui text-slate-500">ID:{item.id.slice(0, 8)}</span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-obsidian-slate font-display text-zinc-300 selection:bg-industrial-orange/30">
      
      {/* Header */}
      <header className="flex h-12 items-center justify-between border-b border-console-border bg-console-surface px-4 monospaced-ui text-[11px]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-industrial-orange">
            <span className="material-symbols-outlined text-lg">settings_input_component</span>
            <span className="font-bold tracking-tighter">CORE_CONSOLE_V1.5</span>
          </div>
          <nav className="hidden md:flex items-center gap-4 text-zinc-500">
            <a className="hover:text-industrial-orange transition-colors" href="#">TERMINAL</a>
            <span className="text-zinc-800">/</span>
            <a className="text-industrial-orange" href="#">REVIEW_{slug?.toUpperCase()}</a>
            <span className="text-zinc-800">/</span>
            <a className="hover:text-industrial-orange transition-colors" href="#">ASSETS</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black/40 px-2 py-0.5 border border-console-border">
            <div className="w-1.5 h-1.5 rounded-full bg-industrial-orange animate-pulse"></div>
            <span className="text-[9px] text-zinc-400">POCKETBASE_SYNC_LIVE</span>
          </div>
          <div className="flex gap-1">
            <button className="border border-console-border bg-zinc-900 p-1 hover:border-industrial-orange transition-colors">
              <span className="material-symbols-outlined text-sm">tune</span>
            </button>
            <button className="bg-industrial-orange text-black px-3 py-1 font-bold text-[10px] hover:brightness-110">
              PUSH_REMOTE
            </button>
          </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex flex-1 overflow-hidden">
        
        {/* Left Section (Video & Timeline) */}
        <section className="flex-1 flex flex-col border-r border-console-border overflow-hidden">
          
          {/* Video Player Mock */}
          <div className="relative flex-1 bg-black flex items-center justify-center">
            <div className="absolute inset-0 scanline pointer-events-none z-10"></div>
            <div 
              className="w-full h-full bg-center bg-no-repeat bg-contain opacity-30 grayscale contrast-125" 
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCOERSdz_Ls3q2QB__wVyu7vzmNCDvDzxstbcw14wWZ3rzcuR-HvApfvgGq3N4G-ngg-YeF-1fUl_BxJmkaUi0ylyhte1Y6mmwPc1dSDXaTb0BfW8rvwrILKPC2z_MR2xQKluxQE5Fqzz01EZf46JinnrGiSSqxexsKR4cZa0FUIc0BxNJfHI6PWLvUKyL67N6umhKRcozSHpqJ109d5XLJx8p0kMuK1a3qX2EV87-FlWY8P5oc85I8jxv6_1Rqlu7IyHWiW2fHA2A')" }}
            />
            <div className="absolute top-4 left-4 flex flex-col gap-1 monospaced-ui text-[10px] z-20">
              <div className="bg-zinc-900/80 px-2 py-1 border-l-2 border-industrial-orange text-zinc-400">INPUT: SDI_01_RAW</div>
              <div className="bg-zinc-900/80 px-2 py-1 border-l-2 border-industrial-orange text-zinc-400">STATUS: NO_SIGNAL</div>
            </div>
            <div className="absolute top-4 right-4 monospaced-ui text-right z-20">
              <div className="text-2xl font-bold text-zinc-700 tabular-nums tracking-widest bg-zinc-900/80 px-3 py-1">
                {formatTime(currentTimeSeconds)}
              </div>
            </div>
            <div className="z-20 flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-2 border-zinc-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-zinc-800">visibility_off</span>
              </div>
              <span className="monospaced-ui text-zinc-600 text-[11px] tracking-[0.2em]">WAITING_FOR_SOURCE</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="h-64 bg-zinc-950 border-t border-console-border flex flex-col monospaced-ui relative select-none">
            <div className="flex items-center justify-between px-4 py-1.5 border-b border-console-border bg-zinc-900/50">
              <div className="flex gap-4">
                <span className="text-zinc-600 text-[9px] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">history</span> TIMELINE
                </span>
              </div>
            </div>
            
            <div 
              className="flex-1 relative industrial-grid opacity-20 cursor-pointer hover:opacity-40 transition-opacity z-0"
              onMouseMove={handleTimelineMouseMove}
              onMouseLeave={handleTimelineMouseLeave}
              onClick={handleTimelineClick}
            >
              {/* Markers for existing feedbacks */}
              {feedbacks.map((fb) => (
                <div 
                  key={fb.id}
                  className="absolute top-0 bottom-0 w-[2px] bg-industrial-orange z-10 shadow-[0_0_10px_rgba(249,115,22,0.8)]"
                  style={{ left: `${(fb.time_seconds / videoDuration) * 100}%` }}
                />
              ))}

              {/* Hover indicator */}
              {isHoveringTimeline && (
                <div 
                  className="absolute top-0 bottom-0 w-[1px] bg-zinc-400 z-20 pointer-events-none"
                  style={{ left: `${timelineHoverPos.x}px` }}
                >
                  <div className="absolute -top-4 left-1 text-[8px] bg-zinc-800 px-1 rounded">
                    {formatTime(timelineHoverPos.seconds)}
                  </div>
                </div>
              )}
            </div>

            {/* Current Playhead */}
            <div 
              className="absolute top-[28px] bottom-[40px] w-[2px] bg-white z-30 pointer-events-none transition-all duration-75"
              style={{ left: `${(currentTimeSeconds / videoDuration) * 100}%` }}
            >
              <div className="absolute top-0 left-[-4px] w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-white"></div>
            </div>

            {/* Transport Controls */}
            <div className="bg-zinc-900 border-t border-console-border p-2 flex items-center justify-between px-6 z-40">
              <div className="flex items-center gap-6 opacity-80">
                <button className="material-symbols-outlined text-zinc-400 text-xl hover:text-industrial-orange">fast_rewind</button>
                <button 
                  className="material-symbols-outlined text-industrial-orange text-3xl hover:scale-110 transition-transform"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? 'pause_circle' : 'play_circle'}
                </button>
                <button className="material-symbols-outlined text-zinc-400 text-xl hover:text-industrial-orange">fast_forward</button>
              </div>
              <div className="text-[9px] text-zinc-600">NULL_PTR_EXCEPTION_SUPPRESSED</div>
            </div>
          </div>
        </section>

        {/* Right Sidebar (Feedback Log) */}
        <aside className="w-96 bg-obsidian-slate flex flex-col overflow-hidden relative">
          <div className="p-3 border-b border-console-border flex justify-between items-center bg-zinc-900/30 monospaced-ui">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-industrial-orange"></span>
              <h3 className="text-[11px] font-bold tracking-widest text-zinc-400">FEEDBACK_LOG.DB</h3>
            </div>
            <span className="text-[9px] text-zinc-600">OBJECTS: {feedbacks.length}</span>
          </div>

          {feedbacks.length === 0 ? renderEmptyState() : renderPopulatedState()}

          {/* Input Panel Overlay (when deep linked via focus param) */}
          {isInputFocused && inputTimeSeconds !== null && (
            <div className="absolute inset-x-0 bottom-[64px] bg-zinc-900 border-t-2 border-industrial-orange p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] z-50">
              <form onSubmit={submitFeedback} className="flex flex-col gap-3">
                <div className="flex justify-between items-center monospaced-ui text-[10px]">
                  <span className="text-industrial-orange font-bold">LOGGING_AT: {formatTime(inputTimeSeconds)}</span>
                  <button 
                    type="button" 
                    onClick={() => setSearchParams({})}
                    className="text-zinc-500 hover:text-white"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
                <input 
                  ref={inputRef}
                  type="text" 
                  value={newFeedbackContent}
                  onChange={(e) => setNewFeedbackContent(e.target.value)}
                  placeholder="Enter feedback content..."
                  className="bg-black border border-zinc-700 text-white p-2 text-sm font-ibm focus:border-industrial-orange focus:ring-1 focus:ring-industrial-orange outline-none"
                  autoFocus
                />
                <button 
                  type="submit" 
                  className="bg-industrial-orange text-black font-bold monospaced-ui text-[11px] py-2 hover:brightness-110 active:scale-95 transition-all"
                >
                  SUBMIT_LOG
                </button>
              </form>
            </div>
          )}

          {/* System Status Footer */}
          <div className="p-4 bg-zinc-900/40 border-t border-console-border grid grid-cols-2 gap-x-4 gap-y-3 text-[9px] monospaced-ui border-l border-console-border">
            <div className="flex flex-col gap-0.5">
              <span className="text-zinc-600">SYST_UPTIME</span>
              <span className="text-zinc-400 tabular-nums">00:14:02.84</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-zinc-600">DB_ENDPOINT</span>
              <span className="text-industrial-orange/80">LIVE_POCKETBASE</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-zinc-600">LATENCY</span>
              <span className="text-zinc-400">14MS</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-zinc-600">ENCRYPTION</span>
              <span className="text-zinc-400">AES_256_GCM</span>
            </div>
          </div>
        </aside>

      </main>
    </div>
  );
}
