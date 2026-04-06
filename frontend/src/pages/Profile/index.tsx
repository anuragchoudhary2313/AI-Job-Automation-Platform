import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Building2, Globe, Link2, Mail, MapPin, Phone, Save, Sparkles, User, Briefcase, GraduationCap, Code2, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { userService } from '../../services/user.service';
import { resumeService } from '../../services/resume.service';
import { useAuth } from '../../contexts/AuthContext';
import type { User as AuthUser } from '../../services/auth.service';
import { defaultStoredProfile, PROFILE_STORAGE_KEY, type StoredProfile } from '../../utils/profile';

type ProfileFormData = StoredProfile;

function getNameParts(fullName?: string) {
  const cleanName = (fullName || '').trim();
  if (!cleanName) {
    return { firstName: '', lastName: '' };
  }

  const parts = cleanName.split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ')
  };
}

function getUserMergedProfile(user: AuthUser | null): ProfileFormData {
  const { firstName, lastName } = getNameParts(user?.full_name);

  return {
    ...defaultStoredProfile,
    first_name: firstName,
    last_name: lastName,
    email: user?.email || ''
  };
}

export function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState<ProfileFormData>(() => getUserMergedProfile(user));
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');

  useEffect(() => {
    const profileFromUser = getUserMergedProfile(user);
    const storedRaw = localStorage.getItem(PROFILE_STORAGE_KEY);

    if (!storedRaw) {
      setForm(profileFromUser);
      return;
    }

    try {
      const storedProfile = JSON.parse(storedRaw) as Partial<ProfileFormData>;
      setForm({
        ...profileFromUser,
        ...storedProfile
      });
    } catch {
      setForm(profileFromUser);
    }
  }, [user]);

  const completion = useMemo(() => {
    const requiredFields: Array<keyof ProfileFormData> = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'location',
      'linkedin_url',
      'github_url'
    ];

    const completeFields = requiredFields.filter((field) => form[field].trim().length > 0).length;
    const resumeDone = form.resume_filename.trim().length > 0;
    const totalChecks = requiredFields.length + 1;
    const doneChecks = completeFields + (resumeDone ? 1 : 0);
    return Math.round((doneChecks / totalChecks) * 100);
  }, [form]);

  const sectionStatus = useMemo(() => {
    const has = (value: string) => value.trim().length > 0;

    return [
      {
        key: 'basic',
        label: '1. Basic',
        done: has(form.first_name) && has(form.last_name) && has(form.email) && has(form.phone) && has(form.location) && has(form.linkedin_url) && has(form.github_url)
      },
      {
        key: 'resume',
        label: '2. Resume',
        done: has(form.resume_filename)
      },
      {
        key: 'education',
        label: '3. Education',
        done: has(form.education_college) && has(form.education_degree) && has(form.education_graduation_year)
      },
      {
        key: 'skills',
        label: '4. Skills',
        done: has(form.skills_programming_languages) && has(form.skills_frameworks) && has(form.skills_tools)
      },
      {
        key: 'projects',
        label: '5. Projects',
        done: has(form.projects_summary)
      },
      {
        key: 'work',
        label: '6. Work',
        done: has(form.work_company) && has(form.work_role)
      },
      {
        key: 'questions',
        label: '7. Questions',
        done: has(form.why_join) && has(form.willing_to_relocate)
      },
      {
        key: 'optional',
        label: '8. Optional',
        done: has(form.coding_profiles) || has(form.portfolio_url) || has(form.certifications)
      }
    ];
  }, [form]);

  const sectionNav = useMemo(() => {
    return [
      { key: 'basic', title: 'Basic Personal Details' },
      { key: 'resume', title: 'Resume / CV' },
      { key: 'education', title: 'Education Details' },
      { key: 'skills', title: 'Skills Section' },
      { key: 'projects', title: 'Projects / Experience' },
      { key: 'work', title: 'Work Experience' },
      { key: 'questions', title: 'Additional Questions' },
      { key: 'optional', title: 'Optional but Powerful' },
      { key: 'automation', title: 'Automation Context' }
    ];
  }, []);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    const fullName = `${form.first_name} ${form.last_name}`.trim();

    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(form));

      try {
        const updated = await userService.updateProfile({
          full_name: fullName || user?.full_name,
          email: form.email || user?.email,
          username: user?.username
        });
        updateUser(updated);
      } catch {
        if (user) {
          updateUser({
            ...user,
            full_name: fullName || user.full_name,
            email: form.email || user.email
          });
        }
      }

      toast.success('Profile saved successfully.');
    } catch {
      toast.error('Unable to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResumeUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingResume(true);
    try {
      const uploaded = await resumeService.uploadResume(file);
      setForm((prev) => ({
        ...prev,
        resume_id: uploaded.id,
        resume_filename: uploaded.filename || file.name,
        resume_uploaded_at: new Date().toISOString()
      }));
      toast.success('Resume uploaded and linked to your profile.');
    } catch {
      toast.error('Resume upload failed. Please try again.');
    } finally {
      setIsUploadingResume(false);
      event.target.value = '';
    }
  };

  const scrollToSection = (sectionKey: string) => {
    const target = document.getElementById(`profile-${sectionKey}`);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const handleScroll = () => {
      const ids = sectionNav.map((section) => section.key);
      let current = ids[0] || 'basic';

      ids.forEach((id) => {
        const node = document.getElementById(`profile-${id}`);
        if (!node) return;
        const top = node.getBoundingClientRect().top;
        if (top <= 180) {
          current = id;
        }
      });

      setActiveSection(current);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionNav]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="mb-6 rounded-3xl border border-gray-200 bg-gradient-to-r from-[#f7fbff] via-[#f8fff9] to-[#fff9f1] p-6 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 md:p-7">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-800 dark:bg-gray-900 dark:text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" />
          Candidate Profile Workspace
        </div>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-900 dark:text-white md:text-4xl">Profile</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400 md:text-base">
          Complete this once, then reuse details across resumes, applications, and automation jobs.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <Card className="border-gray-200/80 bg-white/90 dark:border-gray-800 dark:bg-gray-900/80">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold">Progress</CardTitle>
              <CardDescription>Track completion across all profile sections.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-3xl font-black text-gray-900 dark:text-white">{completion}%</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {sectionNav.map((section, index) => {
                  const status = sectionStatus.find((item) => item.key === section.key);
                  const done = status?.done;
                  const isActive = activeSection === section.key;
                  return (
                    <button
                      key={section.key}
                      type="button"
                      onClick={() => scrollToSection(section.key)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                        isActive
                          ? 'border-cyan-300 bg-cyan-50 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300'
                          : done
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="truncate">{index + 1}. {section.title}</span>
                      <span className="ml-2 text-xs font-semibold">{done ? 'Done' : 'Pending'}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </aside>

        <form onSubmit={handleSave} className="space-y-8">
          <Card id="profile-basic" className="border-gray-200/80 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-bold">1. Basic Personal Details</CardTitle>
            <CardDescription>Mandatory details recruiters expect in almost every application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
                  <Input name="first_name" value={form.first_name} onChange={handleInputChange} placeholder="John" className="h-11 rounded-xl pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
                  <Input name="last_name" value={form.last_name} onChange={handleInputChange} placeholder="Doe" className="h-11 rounded-xl pl-10" required />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
                  <Input name="email" type="email" value={form.email} onChange={handleInputChange} placeholder="john@example.com" className="h-11 rounded-xl pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
                  <Input name="phone" value={form.phone} onChange={handleInputChange} placeholder="+1 555 0123" className="h-11 rounded-xl pl-10" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
                <Input name="location" value={form.location} onChange={handleInputChange} placeholder="San Francisco, CA" className="h-11 rounded-xl pl-10" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">LinkedIn Profile</label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
                  <Input name="linkedin_url" value={form.linkedin_url} onChange={handleInputChange} placeholder="https://linkedin.com/in/username" className="h-11 rounded-xl pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">GitHub Profile</label>
                <div className="relative">
                  <Code2 className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
                  <Input name="github_url" value={form.github_url} onChange={handleInputChange} placeholder="https://github.com/username" className="h-11 rounded-xl pl-10" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card id="profile-resume" className="border-gray-200/80 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-bold">2. Resume / CV</CardTitle>
            <CardDescription>Upload your latest resume. Many portals auto-fill details from this document.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-900/40">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Current Resume</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {form.resume_filename ? form.resume_filename : 'No resume uploaded yet'}
                  </p>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleResumeUpload}
                    disabled={isUploadingResume}
                  />
                  <span className="inline-flex h-10 items-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800">
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploadingResume ? 'Uploading...' : 'Upload Resume'}
                  </span>
                </label>
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Tip: Keep your resume 1-2 pages, focused on skills, projects, and outcomes.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card id="profile-education" className="border-gray-200/80 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-bold">3. Education Details</CardTitle>
            <CardDescription>Academic details often required in fresher and early career roles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">College / University</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
                  <Input name="education_college" value={form.education_college} onChange={handleInputChange} placeholder="University Name" className="h-11 rounded-xl pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Degree</label>
                <Input name="education_degree" value={form.education_degree} onChange={handleInputChange} placeholder="B.Tech Information Technology" className="h-11 rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Year of Graduation</label>
                <Input name="education_graduation_year" value={form.education_graduation_year} onChange={handleInputChange} placeholder="2026" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">CGPA / Percentage</label>
                <Input name="education_cgpa" value={form.education_cgpa} onChange={handleInputChange} placeholder="8.6 CGPA or 82%" className="h-11 rounded-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card id="profile-skills" className="border-gray-200/80 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-bold">4. Skills Section</CardTitle>
            <CardDescription>Be precise and honest. Interviewers ask directly from this section.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Programming Languages</label>
                <Input name="skills_programming_languages" value={form.skills_programming_languages} onChange={handleInputChange} placeholder="C++, Java, Python" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Frameworks</label>
                <Input name="skills_frameworks" value={form.skills_frameworks} onChange={handleInputChange} placeholder="React, Node.js, Spring Boot" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Tools</label>
                <Input name="skills_tools" value={form.skills_tools} onChange={handleInputChange} placeholder="Git, Docker, AWS" className="h-11 rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Primary Skills Summary</label>
              <Input
                name="skills"
                value={form.skills}
                onChange={handleInputChange}
                placeholder="Full-stack development, cloud deployment, API architecture"
                className="h-11 rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        <Card id="profile-projects" className="border-gray-200/80 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-bold">5. Projects / Experience</CardTitle>
            <CardDescription>Mention what you built, the stack used, and your role or ownership.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Projects</label>
              <textarea
                name="projects_summary"
                value={form.projects_summary}
                onChange={handleInputChange}
                rows={4}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                placeholder="Describe key projects, your contributions, and measurable outcomes."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Internships</label>
                <textarea
                  name="internships"
                  value={form.internships}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  placeholder="Internship company, work done, and timeline."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Open-source Contributions</label>
                <textarea
                  name="open_source_contributions"
                  value={form.open_source_contributions}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  placeholder="Projects, repos, PRs, issues, and community work."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card id="profile-work" className="border-gray-200/80 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-bold">6. Work Experience (Optional)</CardTitle>
            <CardDescription>Can be minimal for freshers, but include any meaningful professional exposure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
                  <Input name="work_company" value={form.work_company} onChange={handleInputChange} placeholder="Acme Inc." className="h-11 rounded-xl pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Role</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
                  <Input name="work_role" value={form.work_role} onChange={handleInputChange} placeholder="Software Engineer Intern" className="h-11 rounded-xl pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Duration</label>
                <Input name="work_duration" value={form.work_duration} onChange={handleInputChange} placeholder="Jan 2025 - Jun 2025" className="h-11 rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Responsibilities</label>
              <textarea
                name="work_responsibilities"
                value={form.work_responsibilities}
                onChange={handleInputChange}
                rows={3}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                placeholder="Core responsibilities and outcomes from your role."
              />
            </div>
          </CardContent>
        </Card>

        <Card id="profile-questions" className="border-gray-200/80 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-bold">7. Additional Questions</CardTitle>
            <CardDescription>Common company-specific application prompts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Why do you want to join us?</label>
              <textarea
                name="why_join"
                value={form.why_join}
                onChange={handleInputChange}
                rows={3}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                placeholder="Short motivation statement tailored for applications."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Willing to Relocate</label>
                <select
                  name="willing_to_relocate"
                  value={form.willing_to_relocate}
                  onChange={handleInputChange}
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="maybe">Maybe</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Expected Salary</label>
                <Input name="expected_salary" value={form.expected_salary} onChange={handleInputChange} placeholder="Optional" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Notice Period</label>
                <Input name="notice_period" value={form.notice_period} onChange={handleInputChange} placeholder="Immediate / 30 days" className="h-11 rounded-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card id="profile-optional" className="border-gray-200/80 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-bold">8. Optional but Powerful</CardTitle>
            <CardDescription>These details can improve visibility and recruiter confidence.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Coding Profiles</label>
                <Input name="coding_profiles" value={form.coding_profiles} onChange={handleInputChange} placeholder="LeetCode, Codeforces, HackerRank links" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Certifications</label>
                <Input name="certifications" value={form.certifications} onChange={handleInputChange} placeholder="AWS CCP, Google Cloud, etc." className="h-11 rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Portfolio Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
                  <Input name="portfolio_url" value={form.portfolio_url} onChange={handleInputChange} placeholder="https://portfolio.dev" className="h-11 rounded-xl pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Company Website (Current/Recent)</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
                  <Input name="company_website" value={form.company_website} onChange={handleInputChange} placeholder="https://company.com" className="h-11 rounded-xl pl-10" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Professional Summary</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleInputChange}
                rows={4}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                placeholder="A concise summary you can reuse in resumes and job applications."
              />
            </div>
          </CardContent>
        </Card>

        <Card id="profile-automation" className="border-gray-200/80 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Role Context for Automation</CardTitle>
            <CardDescription>These values are used by job scraping and auto-apply workflows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Target Role / Current Title</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-400" />
                  <Input name="current_title" value={form.current_title} onChange={handleInputChange} placeholder="Software Engineer" className="h-11 rounded-xl pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Experience Level</label>
                <select
                  name="experience_level"
                  value={form.experience_level}
                  onChange={handleInputChange}
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

          <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your profile data is saved and reused across job applications and automation.
            </p>
            <Button type="submit" className="rounded-xl" isLoading={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile;
