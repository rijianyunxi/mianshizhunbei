export type PostStatus = "draft" | "published" | "archived";

export type Author = {
  name: string;
  role?: string;
  avatar?: string;
};

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  tags: string[];
  author: Author;
  status: PostStatus;
  publishedAt: string;
  updatedAt: string;
  readingTime: string;
  views: number;
  comments: number;
};

export type AnalyticsSummary = {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  archivedPosts: number;
  totalViews: number;
  totalComments: number;
  publishFrequency: string;
  monthlyTrend: Array<{
    label: string;
    posts: number;
    views: number;
  }>;
};
