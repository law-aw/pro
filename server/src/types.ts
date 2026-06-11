export type Role = 'edge' | 'hub';

export interface Department {
  id: number;
  university_name: string;
  department_name: string;
  accent_color: string;
  logo_path: string | null;
  updated_at: string;
}

export interface AdminUser {
  id: number;
  email: string;
  display_name: string;
  password_hash: string;
  active: number;
  created_at: string;
  last_login: string | null;
}

export type NoticePriority = 'normal' | 'pinned' | 'urgent';
export type NoticeStatus = 'draft' | 'published';
export type NoticeAudience = 'all' | 'staff' | 'students' | 'postgraduate';

export interface Notice {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: NoticePriority;
  status: NoticeStatus;
  audience: NoticeAudience;
  location: string | null;
  event_start: string | null;
  event_end: string | null;
  image_path: string | null;
  attachment_path: string | null;
  publish_at: string;
  expires_at: string | null;
  created_by_id: number | null;
  updated_by_id: number | null;
  created_at: string;
  updated_at: string;
  version: number;
  deleted: number;
}

export interface SyncMeta {
  key: string;
  value: string;
}

export interface SyncAdminUser {
  email: string;
  display_name: string;
  password_hash: string;
  active: number;
  created_at: string;
}

export interface SyncBundle {
  version: number;
  department: Department;
  notices: Notice[];
  admins: SyncAdminUser[];
  media: { filename: string; base64: string }[];
}
