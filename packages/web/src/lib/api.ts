import type { ApiResponse } from '@sdm/shared';

class ApiClient {
  constructor(private readonly baseUrl: string) {}

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('sdm_access_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    allowRefresh = true,
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = 'Bearer ' + token;
    }

    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const response = await fetch(this.baseUrl + endpoint, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (
      response.status === 401 &&
      allowRefresh &&
      !endpoint.startsWith('/auth/login') &&
      !endpoint.startsWith('/auth/refresh')
    ) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return this.request<T>(endpoint, options, false);
      }
    }

    let json: ApiResponse<T>;
    try {
      json = (await response.json()) as ApiResponse<T>;
    } catch {
      throw new ApiError('The server returned an invalid response.', 'INVALID_RESPONSE', response.status);
    }

    if (!response.ok || !json.success) {
      if (json.success) {
        throw new ApiError('The request failed.', 'REQUEST_FAILED', response.status);
      }
      throw new ApiError(json.error.message, json.error.code, response.status);
    }

    return json.data;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const refreshToken = localStorage.getItem('sdm_refresh_token');
    if (!refreshToken) return false;

    try {
      const response = await fetch(this.baseUrl + '/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken }),
      });
      const json = (await response.json()) as ApiResponse<{
        tokens: { accessToken: string; refreshToken: string };
      }>;

      if (!response.ok || !json.success) {
        throw new Error('Refresh token rejected');
      }

      localStorage.setItem('sdm_access_token', json.data.tokens.accessToken);
      localStorage.setItem('sdm_refresh_token', json.data.tokens.refreshToken);
      return true;
    } catch {
      localStorage.removeItem('sdm_access_token');
      localStorage.removeItem('sdm_refresh_token');
      return false;
    }
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  upload<T>(endpoint: string, file: File): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<T>(endpoint, { method: 'POST', body: formData });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

function getApiBase(): string {
  const configuredBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    return '/api/backend';
  }

  return configuredBase.replace(/\/$/, '');
}

const API_BASE = getApiBase();
export const api = new ApiClient(API_BASE);
