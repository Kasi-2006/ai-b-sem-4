
export type UserRole = 'User' | 'Admin';

export interface UserProfile {
  id: string;
  username: string;
  role: UserRole;
}

export interface Subject {
  id: string;
  name: string;
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

export type Category = 'Assignments' | 'Notes' | 'Lab Resources';

export type ViewState = 'home' | 'assignments' | 'notes' | 'lab-resources' | 'upload' | 'admin' | 'research';
