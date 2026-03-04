import React, { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useReviewData } from '../hooks/useReviewData';
import { MediaCanvas } from '../components/MediaCanvas';
import { Timeline } from '../components/Timeline';
import { FeedbackDrawer } from '../components/FeedbackDrawer';

export function ReviewPage() {
  const { share_token } = useParams<{ share_token: string }>();
  const { project, video, comments, loading, addComment, toggleResolve } = useReviewData(share_token);

  const videoRef = useRef<HTMLVideoElement>(null);
  const feedbackInputRef = useRef<HTMLTextAreaElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [pendingCommentTime, setPendingCommentTime] = useState<number | null>(null);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setPendingCommentTime(null);
    }
  };

  const handleTimelineClick = (time: number) => {
    setIsPlaying(false);
    setPendingCommentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleCommentClick = (timecode: number) => {
    setIsPlaying(false);
    setPendingCommentTime(null); // Just snap to timecode, maybe don't start pending comment automatically
    if (videoRef.current) {
      videoRef.current.currentTime = timecode;
      setCurrentTime(timecode);
    }
  };

  const handleAddComment = (content: string, timecode: number) => {
    addComment(content, timecode);
    setPendingCommentTime(null);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 bg-obsidian">
        Loading...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 bg-obsidian">
        Project not found.
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* Left Side: Media Canvas */}
      <section className="flex-1 flex flex-col relative bg-obsidian overflow-hidden">
        <MediaCanvas 
          video={video}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onTimeUpdate={setCurrentTime}
          onDurationChange={setDuration}
          videoRef={videoRef}
        />
        <Timeline 
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          comments={comments}
          onPlayPause={handlePlayPause}
          onTimelineClick={handleTimelineClick}
          onMarkerClick={handleCommentClick}
        />
      </section>

      {/* Right Side: Feedback Drawer */}
      <FeedbackDrawer 
        comments={comments}
        currentTime={currentTime}
        pendingCommentTime={pendingCommentTime}
        onAddComment={handleAddComment}
        onToggleResolve={toggleResolve}
        onCommentClick={handleCommentClick}
        inputRef={feedbackInputRef}
      />
    </div>
  );
}