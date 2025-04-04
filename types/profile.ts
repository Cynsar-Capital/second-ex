// Define work experience item type
export interface WorkExperience {
  position: string;
  company: string;
  years: string;
}

// Define the Profile type
export interface ProfileData {
  id: string;
  updated_at?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  website?: string;
  bio?: string;
  email?: string;
  is_admin?: boolean;
  profile_sections?: {
    [key: string]: any;
  } | null;
  custom_fields?: {
    [key: string]: any;
  } | null;
}

export interface ProfileSection {
  title: string;
  fields: ProfileField[];
}

export interface ProfileField {
  label: string;
  value: string;
  type: 'text' | 'url' | 'email' | 'date' | 'textarea';
}
