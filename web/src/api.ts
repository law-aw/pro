import type { AdminUser, Department, Notice } from './types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error ?? 'Request failed');
  }

  return response.json();
}

export const api = {
  getSettings: () => request<{ department: Department }>('/api/settings'),
  getPublicNotices: () => request<{ notices: Notice[] }>('/api/notices/public'),
  getPublicNotice: (id: string) => request<{ notice: Notice }>(`/api/notices/public/${id}`),
  login: (email: string, password: string) =>
    request<{ user: AdminUser }>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  me: () => request<{ user: AdminUser }>('/api/auth/me'),
  getNotices: () => request<{ notices: Notice[] }>('/api/notices'),
  createNotice: (formData: FormData) =>
    request<{ notice: Notice }>('/api/notices', { method: 'POST', body: formData }),
  updateNotice: (id: string, formData: FormData) =>
    request<{ notice: Notice }>(`/api/notices/${id}`, { method: 'PUT', body: formData }),
  deleteNotice: (id: string) => request<{ ok: boolean }>(`/api/notices/${id}`, { method: 'DELETE' }),
  updateSettings: (formData: FormData) =>
    request<{ department: Department }>('/api/settings', { method: 'PUT', body: formData }),
  getAdmins: () => request<{ admins: AdminUser[] }>('/api/auth/admins'),
  createAdmin: (email: string, display_name: string, password: string) =>
    request<{ id: number }>('/api/auth/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, display_name, password }),
    }),
  syncPull: () => request<{ ok: boolean; message: string }>('/api/sync/pull', { method: 'POST' }),
  syncStatus: () =>
    request<{ role: string; hubConfigured: boolean; syncHubUrl: string | null; lastSyncAt: string | null }>(
      '/api/sync/status',
    ),
};

export function mediaUrl(path: string | null): string | null {
  if (!path) return null;
  return `/media/${path}`;
}
