export interface Department {
  id: number;
  university_name: string;
  department_name: string;
  accent_color: string;
  logo_path: string | null;
  updated_at: string;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: 'normal' | 'pinned' | 'urgent';
  status: 'draft' | 'published';
  audience: 'all' | 'staff' | 'students' | 'postgraduate';
  location: string | null;
  event_start: string | null;
  event_end: string | null;
  image_path: string | null;
  attachment_path: string | null;
  publish_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: number;
  email: string;
  display_name: string;
}
