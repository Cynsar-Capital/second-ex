import { v4 as uuidv4 } from 'uuid';

export interface FieldTemplate {
  field_key: string;
  field_label: string;
  field_type: 'text' | 'textarea' | 'date' | 'url' | 'email' | 'select' | 'checkbox';
  placeholder?: string;
  options?: string[]; // For select fields
  required?: boolean;
}

export interface SectionTemplate {
  section_key: string;
  title: string;
  description?: string;
  fields: FieldTemplate[];
}

// Work Experience section template
export const workExperienceTemplate: SectionTemplate = {
  section_key: 'work_experience',
  title: 'Work Experience',
  description: 'Share your professional journey and career highlights',
  fields: [
    {
      field_key: 'company_name',
      field_label: 'Company Name',
      field_type: 'text',
      placeholder: 'e.g. Acme Corporation',
      required: true,
    },
    {
      field_key: 'job_title',
      field_label: 'Job Title',
      field_type: 'text',
      placeholder: 'e.g. Senior Software Engineer',
      required: true,
    },
    {
      field_key: 'start_date',
      field_label: 'Start Date',
      field_type: 'date',
      required: true,
    },
    {
      field_key: 'end_date',
      field_label: 'End Date',
      field_type: 'date',
      placeholder: 'Leave blank if current position',
    },
    {
      field_key: 'description',
      field_label: 'Description',
      field_type: 'textarea',
      placeholder: 'Describe your responsibilities and achievements',
    },
    {
      field_key: 'location',
      field_label: 'Location',
      field_type: 'text',
      placeholder: 'e.g. San Francisco, CA',
    },
  ],
};

// Education section template
export const educationTemplate: SectionTemplate = {
  section_key: 'education',
  title: 'Education',
  description: 'Share your academic background and qualifications',
  fields: [
    {
      field_key: 'institution',
      field_label: 'Institution',
      field_type: 'text',
      placeholder: 'e.g. Stanford University',
      required: true,
    },
    {
      field_key: 'degree',
      field_label: 'Degree',
      field_type: 'text',
      placeholder: 'e.g. Bachelor of Science in Computer Science',
      required: true,
    },
    {
      field_key: 'start_date',
      field_label: 'Start Date',
      field_type: 'date',
      required: true,
    },
    {
      field_key: 'end_date',
      field_label: 'End Date',
      field_type: 'date',
      placeholder: 'Leave blank if currently studying',
    },
    {
      field_key: 'description',
      field_label: 'Description',
      field_type: 'textarea',
      placeholder: 'Describe your studies, achievements, and activities',
    },
    {
      field_key: 'gpa',
      field_label: 'GPA',
      field_type: 'text',
      placeholder: 'e.g. 3.8/4.0',
    },
  ],
};

// Projects section template
export const projectsTemplate: SectionTemplate = {
  section_key: 'projects',
  title: 'Projects',
  description: 'Showcase your notable projects and accomplishments',
  fields: [
    {
      field_key: 'project_name',
      field_label: 'Project Name',
      field_type: 'text',
      placeholder: 'e.g. Personal Portfolio Website',
      required: true,
    },
    {
      field_key: 'role',
      field_label: 'Your Role',
      field_type: 'text',
      placeholder: 'e.g. Lead Developer',
    },
    {
      field_key: 'start_date',
      field_label: 'Start Date',
      field_type: 'date',
    },
    {
      field_key: 'end_date',
      field_label: 'End Date',
      field_type: 'date',
      placeholder: 'Leave blank if ongoing',
    },
    {
      field_key: 'description',
      field_label: 'Description',
      field_type: 'textarea',
      placeholder: 'Describe the project, your contributions, and outcomes',
      required: true,
    },
    {
      field_key: 'project_url',
      field_label: 'Project URL',
      field_type: 'url',
      placeholder: 'e.g. https://github.com/yourusername/project',
    },
  ],
};

// Skills section template
export const skillsTemplate: SectionTemplate = {
  section_key: 'skills',
  title: 'Skills',
  description: 'Highlight your technical and professional skills',
  fields: [
    {
      field_key: 'skill_category',
      field_label: 'Skill Category',
      field_type: 'text',
      placeholder: 'e.g. Programming Languages, Design Tools, Soft Skills',
      required: true,
    },
    {
      field_key: 'skills_list',
      field_label: 'Skills',
      field_type: 'textarea',
      placeholder: 'List your skills, separated by commas',
      required: true,
    },
    {
      field_key: 'proficiency_level',
      field_label: 'Proficiency Level',
      field_type: 'select',
      options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    },
  ],
};

// Certifications section template
export const certificationsTemplate: SectionTemplate = {
  section_key: 'certifications',
  title: 'Certifications',
  description: 'List your professional certifications and credentials',
  fields: [
    {
      field_key: 'certification_name',
      field_label: 'Certification Name',
      field_type: 'text',
      placeholder: 'e.g. AWS Certified Solutions Architect',
      required: true,
    },
    {
      field_key: 'issuing_organization',
      field_label: 'Issuing Organization',
      field_type: 'text',
      placeholder: 'e.g. Amazon Web Services',
      required: true,
    },
    {
      field_key: 'issue_date',
      field_label: 'Issue Date',
      field_type: 'date',
      required: true,
    },
    {
      field_key: 'expiration_date',
      field_label: 'Expiration Date',
      field_type: 'date',
      placeholder: 'Leave blank if no expiration',
    },
    {
      field_key: 'credential_id',
      field_label: 'Credential ID',
      field_type: 'text',
      placeholder: 'e.g. ABC123XYZ',
    },
    {
      field_key: 'credential_url',
      field_label: 'Credential URL',
      field_type: 'url',
      placeholder: 'e.g. https://www.credential.net/abc123xyz',
    },
  ],
};

// Publications section template
export const publicationsTemplate: SectionTemplate = {
  section_key: 'publications',
  title: 'Publications',
  description: 'Share your research papers, articles, and other publications',
  fields: [
    {
      field_key: 'title',
      field_label: 'Title',
      field_type: 'text',
      placeholder: 'e.g. "Machine Learning Applications in Finance"',
      required: true,
    },
    {
      field_key: 'authors',
      field_label: 'Authors',
      field_type: 'text',
      placeholder: 'e.g. John Doe, Jane Smith',
      required: true,
    },
    {
      field_key: 'publication_date',
      field_label: 'Publication Date',
      field_type: 'date',
      required: true,
    },
    {
      field_key: 'publisher',
      field_label: 'Publisher/Journal',
      field_type: 'text',
      placeholder: 'e.g. IEEE Transactions on Neural Networks',
    },
    {
      field_key: 'description',
      field_label: 'Abstract/Description',
      field_type: 'textarea',
      placeholder: 'Brief summary of the publication',
    },
    {
      field_key: 'publication_url',
      field_label: 'URL',
      field_type: 'url',
      placeholder: 'Link to the publication',
    },
  ],
};

// Volunteer Experience section template
export const volunteerTemplate: SectionTemplate = {
  section_key: 'volunteer_experience',
  title: 'Volunteer Experience',
  description: 'Highlight your community service and volunteer work',
  fields: [
    {
      field_key: 'organization',
      field_label: 'Organization',
      field_type: 'text',
      placeholder: 'e.g. Red Cross',
      required: true,
    },
    {
      field_key: 'role',
      field_label: 'Role',
      field_type: 'text',
      placeholder: 'e.g. Volunteer Coordinator',
      required: true,
    },
    {
      field_key: 'start_date',
      field_label: 'Start Date',
      field_type: 'date',
      required: true,
    },
    {
      field_key: 'end_date',
      field_label: 'End Date',
      field_type: 'date',
      placeholder: 'Leave blank if currently volunteering',
    },
    {
      field_key: 'description',
      field_label: 'Description',
      field_type: 'textarea',
      placeholder: 'Describe your responsibilities and impact',
    },
    {
      field_key: 'location',
      field_label: 'Location',
      field_type: 'text',
      placeholder: 'e.g. New York, NY',
    },
  ],
};

// Awards and Honors section template
export const awardsTemplate: SectionTemplate = {
  section_key: 'awards',
  title: 'Awards & Honors',
  description: 'Showcase your recognition and achievements',
  fields: [
    {
      field_key: 'award_name',
      field_label: 'Award Name',
      field_type: 'text',
      placeholder: 'e.g. Employee of the Year',
      required: true,
    },
    {
      field_key: 'issuer',
      field_label: 'Issuing Organization',
      field_type: 'text',
      placeholder: 'e.g. Acme Corporation',
      required: true,
    },
    {
      field_key: 'date',
      field_label: 'Date Received',
      field_type: 'date',
      required: true,
    },
    {
      field_key: 'description',
      field_label: 'Description',
      field_type: 'textarea',
      placeholder: 'Describe the award and why you received it',
    },
  ],
};

// Custom Bio section template
export const bioTemplate: SectionTemplate = {
  section_key: 'bio',
  title: 'About Me',
  description: 'Tell your story and share what makes you unique',
  fields: [
    {
      field_key: 'bio',
      field_label: 'Biography',
      field_type: 'textarea',
      placeholder: 'Share your professional journey, interests, and aspirations',
      required: true,
    },
    {
      field_key: 'interests',
      field_label: 'Interests & Hobbies',
      field_type: 'textarea',
      placeholder: 'What do you enjoy doing outside of work?',
    },
    {
      field_key: 'fun_fact',
      field_label: 'Fun Fact',
      field_type: 'text',
      placeholder: 'Share something interesting about yourself',
    },
  ],
};

// All templates in a single array for easy access
export const allSectionTemplates: SectionTemplate[] = [
  workExperienceTemplate,
  educationTemplate,
  projectsTemplate,
  skillsTemplate,
  certificationsTemplate,
  publicationsTemplate,
  volunteerTemplate,
  awardsTemplate,
  bioTemplate,
];

// Function to get a template by its key
export function getTemplateByKey(key: string): SectionTemplate | undefined {
  return allSectionTemplates.find(template => template.section_key === key);
}

// Function to create a new section from a template
export function createSectionFromTemplate(
  templateKey: string, 
  profileId: string
): { section: any, fields: any[] } | null {
  const template = getTemplateByKey(templateKey);
  
  if (!template) return null;
  
  // Create the section
  const section = {
    id: uuidv4(),
    profile_id: profileId,
    title: template.title,
    section_key: template.section_key,
    display_order: 0, // This will be updated when saved
  };
  
  // Create the fields
  const fields = template.fields.map((field, index) => ({
    id: uuidv4(),
    section_id: section.id,
    field_key: field.field_key,
    field_label: field.field_label,
    field_type: field.field_type,
    field_value: '',
    display_order: index,
  }));
  
  return { section, fields };
}
