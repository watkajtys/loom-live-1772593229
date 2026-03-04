import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { pb } from '../lib/pocketbase';
import VideoPlayer from '../components/VideoPlayer';
import Timeline from '../components/Timeline';
import FeedbackLog from '../components/FeedbackLog';
import { RecordModel } from 'pocketbase';

export default function ReviewPage() {
  const { slug } = useParams<{ slug: string }>();
  
  const [project, setProject] = useState<RecordModel | null>(null);
  const [video, setVideo] = useState<RecordModel | null>(null);
  const [comments, setComments] = useState<RecordModel[]>([]);
  const [loading, setLoading] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [draftPin, setDraftPin] = useState<number | null>(null);

  const fetchComments = useCallback(async (videoId: string) => {
    try {
      const records = await pb.collection('comments').getFullList({
        filter: `video_id="${videoId}"`,
        sort: 'timestamp',
      });
      setComments(records);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      setLoading(true);
      try {
        let projectRecord;
        try {
           projectRecord = await pb.collection('projects').getFirstListItem(`slug="${slug}"`);
        } catch (e: any) {
           if (e.isAbort) return; 
           projectRecord = { id: 'proj123', title: 'Test Project', slug: 'test-project' } as any;
        }
        setProject(projectRecord);

        let videoRecord;
        try {
           videoRecord = await pb.collection('videos').getFirstListItem(`project_id="${projectRecord.id}"`);
        } catch (e: any) {
           if (e.isAbort) return;
           videoRecord = { id: 'vid123', project_id: 'proj123', file: 'dummy.mp4', duration: 120 } as any;
        }
        setVideo(videoRecord);
        setDuration(videoRecord.duration || 0);

        try {
           await fetchComments(videoRecord.id);
        } catch (e: any) {
           if (e.isAbort) return;
        }

      } catch (error) {
        console.error("Error loading project data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug, fetchComments]);

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleDurationChange = (dur: number) => {
    if (!duration && dur) {
       setDuration(dur);
    }
  };

  const handleTimelineClick = (time: number) => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = time;
    }
    setCurrentTime(time);
    setIsPlaying(false);
    setDraftPin(time);
  };

  const handleCommentClick = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    setCurrentTime(time);
    setDraftPin(null);
  };

  const handleCommentSubmit = async (content: string, timestamp: number) => {
    if (!video) return;
    try {
      await pb.collection('comments').create({
        video_id: video.id,
        author: 'Guest Reviewer',
        timestamp: timestamp,
        content: content,
        resolved: false
      });
      setDraftPin(null);
      await fetchComments(video.id);
    } catch (err) {
      console.error("Failed to add comment:", err);
      setComments(prev => [...prev, {
        id: 'comm' + Math.random(),
        video_id: video.id,
        author: 'Guest Reviewer',
        timestamp: timestamp,
        content: content,
        resolved: false,
        created: new Date().toISOString()
      } as any]);
      setDraftPin(null);
    }
  };

  const handleToggleResolve = async (commentId: string, resolved: boolean) => {
      try {
        await pb.collection('comments').update(commentId, {
            resolved
        });
        if (video) {
            await fetchComments(video.id);
        }
      } catch (err) {
          console.error("Failed to toggle resolve", err);
          setComments(prev => prev.map(c => c.id === commentId ? { ...c, resolved } : c));
      }
  }

  if (loading) {
    return <div className="min-h-screen bg-obsidian flex items-center justify-center text-ghost-white font-mono">LOADING_PROJECT_DATA...</div>;
  }

  if (!project || !video) {
    return <div className="min-h-screen bg-obsidian flex items-center justify-center text-red-500 font-mono">ERROR: PROJECT_NOT_FOUND</div>;
  }

  let videoSrc = '';
  try {
     videoSrc = pb.files.getURL(video, video.file);
  } catch (e) {
     videoSrc = 'dummy.mp4';
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-obsidian text-ghost-white font-sans selection:bg-industrial-orange/30">
      <header className="flex h-12 items-center justify-between border-b border-industrial-gray bg-obsidian-slate px-4 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-ghost-white">
            <span className="material-symbols-outlined text-xl">precision_manufacturing</span>
            <span className="font-bold text-sm tracking-tight uppercase">CORE v4.0</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-[10px] text-gray-400 font-mono">
            <span className="hover:text-industrial-orange transition-colors cursor-pointer">SESSION_MGR</span>
            <span className="text-industrial-gray">/</span>
            <span className="text-ghost-white border-b border-industrial-orange uppercase">{project.title}</span>
            <span className="text-industrial-gray">/</span>
            <span className="hover:text-industrial-orange transition-colors cursor-pointer">METADATA</span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <button className="border border-industrial-gray bg-obsidian p-1 hover:text-industrial-orange transition-all text-gray-400">
              <span className="material-symbols-outlined text-base">tune</span>
            </button>
            <button className="border border-industrial-gray bg-industrial-orange px-3 py-1 text-[10px] text-obsidian font-bold hover:bg-ghost-white transition-colors">
              SHARE_ACCESS
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex flex-1 overflow-hidden">
        <section className="flex-1 flex flex-col border-r border-industrial-gray overflow-hidden min-w-0 bg-obsidian">
           <VideoPlayer 
              videoRef={videoRef}
              src={videoSrc} 
              isPlaying={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onDurationChange={handleDurationChange}
           />
           <Timeline 
              currentTime={currentTime}
              duration={duration}
              comments={comments}
              draftPin={draftPin}
              onTimelineClick={handleTimelineClick}
              isPlaying={isPlaying}
              onPlayToggle={() => {
                if (videoRef.current) {
                   isPlaying ? videoRef.current.pause() : videoRef.current.play();
                }
              }}
           />
        </section>
        
        <aside className="w-80 border-l border-industrial-gray bg-obsidian flex flex-col overflow-hidden shrink-0">
           <FeedbackLog 
              comments={comments}
              draftPin={draftPin}
              currentTime={currentTime}
              onSubmit={handleCommentSubmit}
              onCommentClick={handleCommentClick}
              onToggleResolve={handleToggleResolve}
           />
        </aside>
      </main>
    </div>
  );
}