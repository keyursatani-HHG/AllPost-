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
