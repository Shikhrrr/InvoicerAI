// Central API client with automatic token attachment, refresh rotation, and error normalization

export interface ApiErrorResponse {
  detail?: string | Array<{ loc: string[]; msg: string; type: string }>;
  message?: string;
  [key: string]: any;
}

export class ApiError extends Error {
  status: number;
  data: ApiErrorResponse;

  constructor(status: number, data: ApiErrorResponse) {
    const message =
      typeof data.detail === 'string'
        ? data.detail
        : Array.isArray(data.detail)
        ? data.detail.map((d) => d.msg).join(', ')
        : data.message || `Request failed with status ${status}`;
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let accessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string | null) => void) {
  refreshSubscribers.push(callback);
}

// In Vite development, proxies forward /auth, /invoices, /tasks, /chat, etc. to http://127.0.0.1:8000
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Necessary to send the HttpOnly refresh_token cookie
    });

    if (!res.ok) {
      setAccessToken(null);
      return null;
    }

    const data = await res.json();
    setAccessToken(data.access_token);
    return data.access_token;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  retryOn401?: boolean;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, retryOn401 = true, headers = {}, ...rest } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const requestHeaders = new Headers(headers);

  if (!skipAuth && accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  // Ensure credentials included so cookies (refresh token, etc.) work smoothly
  const fetchOptions: RequestInit = {
    ...rest,
    headers: requestHeaders,
    credentials: 'include',
  };

  let response: Response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (err: any) {
    throw new ApiError(0, {
      message: 'Network error or backend is unavailable. Please check your connection.',
    });
  }

  // Handle 401 Unauthorized for access token expiration (except on auth endpoints)
  if (response.status === 401 && retryOn401 && !endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/register') && !endpoint.startsWith('/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;
      onRefreshed(newToken);

      if (newToken) {
        requestHeaders.set('Authorization', `Bearer ${newToken}`);
        const retryRes = await fetch(url, { ...fetchOptions, headers: requestHeaders });
        return handleResponse<T>(retryRes);
      }
    } else {
      // Wait for existing refresh operation
      return new Promise<T>((resolve, reject) => {
        addRefreshSubscriber(async (newToken) => {
          if (!newToken) {
            return reject(new ApiError(401, { message: 'Session expired. Please log in again.' }));
          }
          requestHeaders.set('Authorization', `Bearer ${newToken}`);
          try {
            const retryRes = await fetch(url, { ...fetchOptions, headers: requestHeaders });
            resolve(await handleResponse<T>(retryRes));
          } catch (error) {
            reject(error);
          }
        });
      });
    }
  }

  return handleResponse<T>(response);
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return null as unknown as T;
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  let data: any;
  try {
    data = isJson ? await response.json() : await response.text();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new ApiError(response.status, typeof data === 'object' ? data : { message: data });
  }

  return data as T;
}
