
export type UserRole = 'User' | 'Admin';

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  rollNo?: string;
  role: UserRole;
}

export interface Subject {
  id: string;
  name: string;
  category: 'Assignments' | 'Notes' | 'Lab Resources';
  created_at: string;
}

export interface AcademicFile {
  id: string;
  subject_id: string;
  category: 'Assignments' | 'Notes' | 'Lab Resources';
  file_name: string;
  file_url: string;
  uploaded_at: string;
  student_name: string;
  roll_no: string;
  user_email?: string;
  unit_no?: string;
}

export interface CheckoutLog {
  id: string;
  file_id: string;
  file_name: string;
  category: string;
  timestamp: string;
  user_role: string;
}

export interface Report {
  id: string;
  description: string;
  reported_by: string;
  status: 'Open' | 'Resolved';
  timestamp: string;
}

export interface Announcement {
  id: string;
  message: string;
  type: 'info' | 'alert' | 'success';
  is_active: boolean;
  created_at: string;
}

export type Category = 'Assignments' | 'Notes' | 'Lab Resources';

export type ViewState = 'home' | 'assignments' | 'notes' | 'lab-resources' | 'admin';
