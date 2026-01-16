import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Video, UserProfile } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, ExternalLink, Loader2 } from 'lucide-react';

export default function SharedGalleryPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [videos, setVideos] = useState<Video[]>([]);
  const [ownerName, setOwnerName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSharedGallery() {
      if (!shareToken) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const usersQuery = query(
          collection(db, 'users'),
          where('shareToken', '==', shareToken)
        );
        const usersSnapshot = await getDocs(usersQuery);

        if (usersSnapshot.empty) {
          setError('Gallery not found');
          setLoading(false);
          return;
        }

        const userData = usersSnapshot.docs[0].data() as UserProfile;
        setOwnerName(userData.displayName || 'User');

        const videosQuery = query(
          collection(db, 'videos'),
          where('userId', '==', userData.uid)
        );
        const videosSnapshot = await getDocs(videosQuery);

        const videosData: Video[] = [];
        videosSnapshot.forEach((doc) => {
          const data = doc.data();
          videosData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          } as Video);
        });

        videosData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setVideos(videosData);
      } catch (err) {
        console.error('Error fetching shared gallery:', err);
        setError('Failed to load gallery');
      } finally {
        setLoading(false);
      }
    }

    fetchSharedGallery();
  }, [shareToken]);

  const filteredVideos = videos.filter((video) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = video.title.toLowerCase().includes(query);
    const tagMatch = video.tags.some((tag) => tag.toLowerCase().includes(query));
    return titleMatch || tagMatch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">
            {ownerName}'s YouTube Gallery
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by title or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredVideos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">
              {videos.length === 0
                ? 'This gallery is empty.'
                : 'No videos match your search.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
              <Card key={video.id} className="overflow-hidden group">
                <a
                  href={video.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="relative aspect-video">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="p-2 bg-white rounded-full">
                        <ExternalLink className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </a>
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
    </div>
  );
}
