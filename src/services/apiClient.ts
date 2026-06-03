import axios, { AxiosError, AxiosHeaders, AxiosRequestConfig } from 'axios';

const BASE_URL = 'https://backend-rent-a-car.onrender.com';

interface RetryConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

function getStoredToken(): string | null {
  return localStorage.getItem('accessToken');
}

function setStoredToken(token: string) {
  localStorage.setItem('accessToken', token);
}

function clearStoredAuth() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('company_id');
  localStorage.removeItem('role');
  localStorage.removeItem('email');
}

function extractAccessToken(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;

  const maybeToken = (obj: Record<string, unknown>) => {
    if (typeof obj.accessToken === 'string') return obj.accessToken;
    if (typeof obj.access_token === 'string') return obj.access_token;
    return null;
  };

  const top = maybeToken(data as Record<string, unknown>);
  if (top) return top;

  const record = data as Record<string, unknown>;
  if (record.data && typeof record.data === 'object') {
    const nested = maybeToken(record.data as Record<string, unknown>);
    if (nested) return nested;

    const deeper = (record.data as Record<string, unknown>).user;
    if (deeper && typeof deeper === 'object') {
      const userToken = maybeToken(deeper as Record<string, unknown>);
      if (userToken) return userToken;
    }
  }

  return null;
}

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  // Keep regular API calls token-based. Using credentials globally can trigger CORS network errors.
  withCredentials: false,
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? new AxiosHeaders();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshingPromise: Promise<string | null> | null = null;

function shouldAttemptRefresh(error: AxiosError): boolean {
  const status = error.response?.status;
  if (status === 401) return true;
  if (status !== 403) return false;

  const data = error.response?.data as
    | { message?: unknown; error?: unknown }
    | string
    | undefined;

  const message =
    typeof data === 'string'
      ? data
      : typeof data?.message === 'string'
        ? data.message
        : typeof data?.error === 'string'
          ? data.error
          : '';

  return /token|jwt|expired|unauthori(s|z)ed/i.test(message);
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshingPromise) {
    refreshingPromise = (async () => {
      try {
        const res = await axios.post(
          `${BASE_URL}/api/auth/refresh-token`,
          {},
          { withCredentials: true, timeout: 10000 }
        );
        const newToken = extractAccessToken(res.data);
        if (newToken) {
          setStoredToken(newToken);
          return newToken;
        }
      } catch {
        // Fall through and clear auth.
      }
      clearStoredAuth();
      return null;
    })().finally(() => {
      refreshingPromise = null;
    });
  }

  return refreshingPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;

    if (!original || !shouldAttemptRefresh(error) || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    const newToken = await refreshAccessToken();
    if (!newToken) {
      return Promise.reject(error);
    }

    original.headers = original.headers ?? new AxiosHeaders();
    original.headers.Authorization = `Bearer ${newToken}`;
    return apiClient(original);
  }
);

export default apiClient;
