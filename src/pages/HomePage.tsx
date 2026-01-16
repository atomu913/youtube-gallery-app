import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Video } from '@/types';
import { extractYoutubeVideoId, getYoutubeThumbnailUrl } from '@/lib/youtube';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Search, Share2, LogOut, ExternalLink, Trash2, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoTags, setNewVideoTags] = useState('');
  const [error, setError] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'videos'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const videosData: Video[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        videosData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        } as Video);
      });
      videosData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setVideos(videosData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const filteredVideos = videos.filter((video) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = video.title.toLowerCase().includes(query);
    const tagMatch = video.tags.some((tag) => tag.toLowerCase().includes(query));
    return titleMatch || tagMatch;
  });

  async function handleAddVideo(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const videoId = extractYoutubeVideoId(newVideoUrl);
    if (!videoId) {
      setError('Invalid YouTube URL');
      return;
    }

    const tags = newVideoTags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    try {
      await addDoc(collection(db, 'videos'), {
        userId: currentUser?.uid,
        youtubeUrl: newVideoUrl,
        youtubeVideoId: videoId,
        title: newVideoTitle || `Video ${videoId}`,
        thumbnailUrl: getYoutubeThumbnailUrl(videoId),
        tags: tags,
        createdAt: new Date(),
      });

      setNewVideoUrl('');
      setNewVideoTitle('');
      setNewVideoTags('');
      setIsAddDialogOpen(false);
    } catch (err) {
      setError('Failed to add video');
      console.error(err);
    }
  }

  async function handleDeleteVideo(videoId: string) {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      await deleteDoc(doc(db, 'videos', videoId));
    } catch (err) {
      console.error('Failed to delete video:', err);
    }
  }

  function handleEditVideo(video: Video) {
    setEditingVideo(video);
    setNewVideoTitle(video.title);
    setNewVideoTags(video.tags.join(', '));
    setIsEditDialogOpen(true);
  }

  async function handleUpdateVideo(e: React.FormEvent) {
    e.preventDefault();
    if (!editingVideo) return;

    const tags = newVideoTags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    try {
      await updateDoc(doc(db, 'videos', editingVideo.id), {
        title: newVideoTitle,
        tags: tags,
      });

      setEditingVideo(null);
      setNewVideoTitle('');
      setNewVideoTags('');
      setIsEditDialogOpen(false);
    } catch (err) {
      console.error('Failed to update video:', err);
    }
  }

  function handleShare() {
    if (userProfile?.shareToken) {
      const url = `${window.location.origin}/share/${userProfile.shareToken}`;
      setShareUrl(url);
      setIsShareDialogOpen(true);
    }
  }

  async function handleCopyShareUrl() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">YouTube Gallery</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {userProfile?.displayName || currentUser?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by title or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Video
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Video</DialogTitle>
                <DialogDescription>
                  Enter a YouTube URL to add a video to your gallery.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddVideo} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="url">YouTube URL</Label>
                  <Input
                    id="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Video title"
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    placeholder="music, tutorial, gaming"
                    value={newVideoTags}
                    onChange={(e) => setNewVideoTags(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">Add Video</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {filteredVideos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">
              {videos.length === 0
                ? 'No videos yet. Add your first video!'
                : 'No videos match your search.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
              <Card key={video.id} className="overflow-hidden group">
                <div className="relative aspect-video">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <a
                      href={video.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white rounded-full hover:bg-gray-100"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                    <button
                      onClick={() => handleEditVideo(video)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteVideo(video.id)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 text-red-600"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-900 truncate mb-2">
                    {video.title}
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {video.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Gallery</DialogTitle>
            <DialogDescription>
              Share this URL with others to let them view your video collection.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input value={shareUrl} readOnly />
            <Button onClick={handleCopyShareUrl}>
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Video</DialogTitle>
            <DialogDescription>
              Update the title and tags for this video.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateVideo} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                placeholder="Video title"
                value={newVideoTitle}
                onChange={(e) => setNewVideoTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags (comma separated)</Label>
              <Input
                id="edit-tags"
                placeholder="music, tutorial, gaming"
                value={newVideoTags}
                onChange={(e) => setNewVideoTags(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
