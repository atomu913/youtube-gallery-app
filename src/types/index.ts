export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  shareToken: string;
  createdAt: Date;
}

export interface Video {
  id: string;
  userId: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  thumbnailUrl: string;
  tags: string[];
  createdAt: Date;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  shareToken: string;
  createdAt: Date;
}
