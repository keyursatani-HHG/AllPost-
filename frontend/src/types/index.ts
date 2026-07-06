/** Shared domain types mirrored from the FastAPI backend schemas. */

export type Role = "owner" | "admin" | "editor" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar_url?: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

/** Standardised error envelope returned by the backend. */
export interface ApiErrorBody {
  detail:
    | string
    | { msg: string; type?: string; loc?: (string | number)[] }[];
  code?: string;
}

export interface SocialAccount {
  id: string;
  platform: string;
  handle: string;
  display_name?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
}

export type PostStatus =
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "archived";

export interface Post {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[];
  hashtags: string[];
  status: PostStatus;
  created_at: string;
  updated_at: string;
}

export interface Page<T> {
  items: T[];
  meta: { page: number; page_size: number; total: number; total_pages: number };
}

export interface CalendarItem {
  id: string;
  post_id: string;
  scheduled_at: string;
  published_at?: string | null;
  status: PostStatus | "queued" | "canceled";
  content: string;
  platform: string;
  handle: string;
  has_media: boolean;
  url?: string | null;
}

export interface CalendarNote {
  id: string;
  note_date: string; // YYYY-MM-DD
  content: string;
}

export interface TopPost {
  post_id: string;
  content: string;
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
  published_at?: string | null;
  url?: string | null;
}

export interface AnalyticsSummary {
  total_posts: number;
  total_impressions: number;
  total_reach: number;
  total_engagement: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  average_engagement_rate: number;
  by_platform: { platform: string; impressions: number; reach: number; engagement: number }[];
  top_posts: TopPost[];
}
