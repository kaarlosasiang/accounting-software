const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000/api/v1";

const buildUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

type ApiError = {
  message?: string;
  error?: string;
};

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  let payload: ApiError | T | undefined;

  try {
    payload = (await response.json()) as T;
  } catch {
    // ignore - no body returned
  }

  if (!response.ok) {
    const message =
      (payload as ApiError)?.message ||
      (payload as ApiError)?.error ||
      response.statusText ||
      "Request failed";
    throw new Error(message);
  }

  return (payload as T) ?? ({} as T);
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
};

export type AuthResponse = {
  token: string | null;
  user: AuthUser;
  redirect?: boolean;
  url?: string;
};

