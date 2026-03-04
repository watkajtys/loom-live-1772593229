import { useState, useEffect } from 'react';
import { pb } from '../lib/pb';
import { RecordModel } from 'pocketbase';

export function useReviewData(shareToken: string | undefined) {
  const [project, setProject] = useState<RecordModel | null>(null);
  const [video, setVideo] = useState<RecordModel | null>(null);
  const [comments, setComments] = useState<RecordModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shareToken) return;

    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        // Fetch project by share_token
        const projectRecord = await pb.collection('projects').getFirstListItem(`share_token="${shareToken}"`, { requestKey: null });
        if (!isMounted) return;
        setProject(projectRecord);

        // Fetch video for this project (assume latest or single video for now)
        const videoRecord = await pb.collection('videos').getFirstListItem(`project_id="${projectRecord.id}"`, { sort: '-created', requestKey: null });
        if (!isMounted) return;
        setVideo(videoRecord);

        // Fetch comments for this video
        const commentsRecords = await pb.collection('comments').getFullList({
          filter: `video_id="${videoRecord.id}"`,
          sort: 'timecode',
          requestKey: null
        });
        if (!isMounted) return;
        setComments(commentsRecords);

        try {
          // Subscribe to real-time comments
          pb.collection('comments').subscribe('*', function (e) {
            if (e.record.video_id !== videoRecord.id) return;
            
            if (e.action === 'create') {
              setComments((prev) => [...prev, e.record].sort((a, b) => a.timecode - b.timecode));
            } else if (e.action === 'update') {
              setComments((prev) => prev.map(c => c.id === e.record.id ? e.record : c).sort((a, b) => a.timecode - b.timecode));
            } else if (e.action === 'delete') {
              setComments((prev) => prev.filter(c => c.id !== e.record.id));
            }
          });
        } catch (e) {
          console.warn("Could not subscribe to pocketbase events");
        }

      } catch (err) {
        console.error("Error fetching review data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
      pb.collection('comments').unsubscribe('*');
    };
  }, [shareToken]);

  const addComment = async (content: string, timecode: number) => {
    if (!video) return;
    try {
      const newComment = await pb.collection('comments').create({
        video_id: video.id,
        timecode,
        content,
        author_name: "You",
        is_resolved: false
      });
      
      // Optimistic update for UI testing without full realtime server
      setComments((prev) => {
        if (prev.some(c => c.id === newComment.id)) return prev;
        return [...prev, newComment].sort((a, b) => a.timecode - b.timecode);
      });
    } catch (err) {
      console.error("Failed to add comment", err);
    }
  };

  const toggleResolve = async (commentId: string, isResolved: boolean) => {
    try {
      await pb.collection('comments').update(commentId, { is_resolved: isResolved });
    } catch (err) {
      console.error("Failed to toggle resolved status", err);
    }
  };

  return {
    project,
    video,
    comments,
    loading,
    addComment,
    toggleResolve
  };
}