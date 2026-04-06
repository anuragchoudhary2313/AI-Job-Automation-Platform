export const PROFILE_STORAGE_KEY = 'jobauto.profile';

export type StoredProfile = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  location: string;
  github_url: string;
  current_title: string;
  experience_level: string;
  company_name: string;
  company_website: string;
  linkedin_url: string;
  portfolio_url: string;
  resume_id: string;
  resume_filename: string;
  resume_uploaded_at: string;
  education_college: string;
  education_degree: string;
  education_graduation_year: string;
  education_cgpa: string;
  skills: string;
  skills_programming_languages: string;
  skills_frameworks: string;
  skills_tools: string;
  projects_summary: string;
  internships: string;
  open_source_contributions: string;
  work_company: string;
  work_role: string;
  work_duration: string;
  work_responsibilities: string;
  why_join: string;
  willing_to_relocate: string;
  expected_salary: string;
  notice_period: string;
  coding_profiles: string;
  certifications: string;
  bio: string;
};

export const defaultStoredProfile: StoredProfile = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  location: '',
  github_url: '',
  current_title: '',
  experience_level: 'mid',
  company_name: '',
  company_website: '',
  linkedin_url: '',
  portfolio_url: '',
  resume_id: '',
  resume_filename: '',
  resume_uploaded_at: '',
  education_college: '',
  education_degree: '',
  education_graduation_year: '',
  education_cgpa: '',
  skills: '',
  skills_programming_languages: '',
  skills_frameworks: '',
  skills_tools: '',
  projects_summary: '',
  internships: '',
  open_source_contributions: '',
  work_company: '',
  work_role: '',
  work_duration: '',
  work_responsibilities: '',
  why_join: '',
  willing_to_relocate: '',
  expected_salary: '',
  notice_period: '',
  coding_profiles: '',
  certifications: '',
  bio: ''
};

export function getStoredProfile(): Partial<StoredProfile> | null {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as Partial<StoredProfile>;
  } catch {
    return null;
  }
}

export function getProfileFullName(profile: Partial<StoredProfile> | null): string {
  if (!profile) return '';
  return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
}

export function buildProfileResumeContext(profile: Partial<StoredProfile> | null): string {
  if (!profile) {
    return '';
  }

  const fullName = getProfileFullName(profile);
  const lines = [
    fullName ? `Name: ${fullName}` : '',
    profile.current_title ? `Title: ${profile.current_title}` : '',
    profile.location ? `Location: ${profile.location}` : '',
    profile.email ? `Email: ${profile.email}` : '',
    profile.phone ? `Phone: ${profile.phone}` : '',
    profile.education_degree ? `Degree: ${profile.education_degree}` : '',
    profile.education_college ? `College: ${profile.education_college}` : '',
    profile.education_graduation_year ? `Graduation Year: ${profile.education_graduation_year}` : '',
    profile.skills_programming_languages ? `Programming Languages: ${profile.skills_programming_languages}` : '',
    profile.skills_frameworks ? `Frameworks: ${profile.skills_frameworks}` : '',
    profile.skills_tools ? `Tools: ${profile.skills_tools}` : '',
    profile.skills ? `Skills: ${profile.skills}` : '',
    profile.projects_summary ? `Projects: ${profile.projects_summary}` : '',
    profile.work_role ? `Work Role: ${profile.work_role}` : '',
    profile.work_company ? `Work Company: ${profile.work_company}` : '',
    profile.bio ? `Summary: ${profile.bio}` : '',
    profile.linkedin_url ? `LinkedIn: ${profile.linkedin_url}` : '',
    profile.github_url ? `GitHub: ${profile.github_url}` : '',
    profile.portfolio_url ? `Portfolio: ${profile.portfolio_url}` : ''
  ].filter(Boolean);

  if (lines.length === 0) {
    return '';
  }

  return lines.join('\n');
}
