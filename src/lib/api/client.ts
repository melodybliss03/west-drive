import { ApiEnvelope, ApiErrorEnvelope, ApiHttpError, AuthTokens } from "@/lib/api/types";

type AuthHandlers = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  refreshTokens: (refreshToken: string) => Promise<AuthTokens>;
  onTokens: (tokens: AuthTokens) => void;
  onAuthFailure: () => void;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

let authHandlers: AuthHandlers | null = null;
let refreshPromise: Promise<string | null> | null = null;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseEnvelope<T>(json: unknown, statusCode: number): T {
  if (!isObject(json) || !("status" in json)) {
    throw new ApiHttpError("Réponse API invalide", statusCode);
  }

  const envelope = json as ApiEnvelope<T>;

  if (envelope.status === "error") {
    const err = envelope as ApiErrorEnvelope;
    throw new ApiHttpError(err.message || "Erreur API", err.code || statusCode, err.data);
  }

  return envelope.data;
}

async function refreshAccessToken(): Promise<string | null> {
  if (!authHandlers) return null;

  if (!refreshPromise) {
    const refreshToken = authHandlers.getRefreshToken();
    if (!refreshToken) return null;

    refreshPromise = authHandlers
      .refreshTokens(refreshToken)
      .then((tokens) => {
        authHandlers?.onTokens(tokens);
        return tokens.accessToken;
      })
      .catch(() => {
        authHandlers?.onAuthFailure();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export function configureApiAuth(handlers: AuthHandlers): void {
  authHandlers = handlers;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
  isFormData?: boolean;
  retry401?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = "GET",
    body,
    auth = false,
    isFormData = false,
    retry401 = true,
  } = options;

  const headers: HeadersInit = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const accessToken = authHandlers?.getAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
  });

  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiHttpError("Erreur HTTP sans payload", response.status);
    }
  }

  if (response.status === 401 && auth && retry401) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      return apiRequest<T>(path, { ...options, retry401: false });
    }
  }

  if (!response.ok) {
    if (json) {
      return parseEnvelope<T>(json, response.status);
    }

    throw new ApiHttpError("Erreur HTTP", response.status);
  }

  return parseEnvelope<T>(json, response.status);
}
