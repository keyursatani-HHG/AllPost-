import type {
  ApiErrorBody,
  AuthResponse,
  AuthTokens,
  Page,
  Post,
  PostStatus,
  SocialAccount,
  User,
} from "@/types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

/** Normalised error thrown by the API client. */
export class ApiError extends Error {
  status: number;
  code?: string;
  fieldErrors?: Record<string, string>;

  constructor(
    message: string,
    status: number,
    opts?: { code?: string; fieldErrors?: Record<string, string> }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = opts?.code;
    this.fieldErrors = opts?.fieldErrors;
  }
}

/* ----------------------------- token storage ----------------------------- */

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

/* ------------------------------ core request ------------------------------ */

function parseErrorBody(body: ApiErrorBody | undefined, status: number) {
  if (!body) return new ApiError("Something went wrong. Please try again.", status);

  // FastAPI validation errors come back as an array of {loc, msg, type}
  if (Array.isArray(body.detail)) {
    const fieldErrors: Record<string, string> = {};
    for (const item of body.detail) {
      const field = item.loc?.filter((p) => p !== "body").join(".");
      if (field) fieldErrors[field] = item.msg;
    }
    const first = body.detail[0]?.msg ?? "Validation failed";
    return new ApiError(first, status, { fieldErrors, code: body.code });
  }

  return new ApiError(
    typeof body.detail === "string" ? body.detail : "Request failed",
    status,
    { code: body.code }
  );
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Skip the automatic 401 -> refresh -> retry cycle (used by refresh itself). */
  skipAuthRefresh?: boolean;
}

async function rawRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  // `skipAuthRefresh` is consumed by request(); strip it so it isn't forwarded to fetch().
  const { body, headers, skipAuthRefresh: _skipAuthRefresh, ...rest } = options;
  void _skipAuthRefresh;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      // Send/receive the httpOnly refresh cookie set by the backend.
      credentials: "include",
    });
  } catch {
    throw new ApiError(
      "Cannot reach the server. Check your connection and try again.",
      0,
      { code: "network_error" }
    );
  }

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => undefined) : undefined;

  if (!res.ok) throw parseErrorBody(data as ApiErrorBody, res.status);
  return data as T;
}

/* --------------------- request with transparent refresh -------------------- */

let refreshPromise: Promise<AuthTokens> | null = null;

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await rawRequest<T>(path, options);
  } catch (err) {
    const shouldRetry =
      err instanceof ApiError &&
      err.status === 401 &&
      !options.skipAuthRefresh &&
      accessToken !== null;

    if (!shouldRetry) throw err;

    // De-duplicate concurrent refreshes.
    refreshPromise ??= authApi.refresh().finally(() => {
      refreshPromise = null;
    });

    try {
      const tokens = await refreshPromise;
      setAccessToken(tokens.access_token);
    } catch {
      setAccessToken(null);
      throw err; // original 401
    }

    return rawRequest<T>(path, options);
  }
}

/* --------------------------------- endpoints ------------------------------- */

export const authApi = {
  register: (input: { name: string; email: string; password: string }) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: input,
      skipAuthRefresh: true,
    }),

  login: (input: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: input,
      skipAuthRefresh: true,
    }),

  refresh: () =>
    rawRequest<AuthTokens>("/auth/refresh", {
      method: "POST",
      skipAuthRefresh: true,
    }),

  logout: () =>
    request<void>("/auth/logout", { method: "POST", skipAuthRefresh: true }),

  me: () => request<User>("/auth/me"),

  forgotPassword: (input: { email: string }) =>
    request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: input,
      skipAuthRefresh: true,
    }),

  resetPassword: (input: { token: string; password: string }) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: input,
      skipAuthRefresh: true,
    }),
};

export const postsApi = {
  list: (status?: PostStatus) =>
    request<Page<Post>>(`/posts${status ? `?status=${status}` : ""}`),
  create: (input: { content: string; media_urls?: string[]; hashtags?: string[] }) =>
    request<Post>("/posts", { method: "POST", body: input }),
};

export const scheduleApi = {
  accounts: () => request<SocialAccount[]>("/schedule/accounts"),
  connect: (input: {
    platform: string;
    external_id: string;
    handle: string;
    display_name?: string;
  }) =>
    request<SocialAccount>("/schedule/accounts", { method: "POST", body: input }),
  disconnect: (id: string) =>
    request<void>(`/schedule/accounts/${id}`, { method: "DELETE" }),
  schedule: (input: {
    post_id: string;
    social_account_ids: string[];
    scheduled_at: string;
  }) => request("/schedule", { method: "POST", body: input }),
};

export const mediaApi = {
  upload: async (file: File): Promise<{ url: string; content_type?: string }> => {
    const form = new FormData();
    form.append("file", file);
    let res: Response;
    try {
      res = await fetch(`${API_URL}/media/upload`, {
        method: "POST",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        body: form,
        credentials: "include",
      });
    } catch {
      throw new ApiError("Cannot reach the server.", 0, { code: "network_error" });
    }
    if (!res.ok) {
      const body = await res.json().catch(() => undefined);
      throw parseErrorBody(body as ApiErrorBody, res.status);
    }
    return res.json();
  },
};

/** Absolute URL for a backend-relative media path (e.g. "/uploads/x.png"). */
export function mediaUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return API_URL.replace(/\/api\/v1\/?$/, "") + path;
}

export { request };
