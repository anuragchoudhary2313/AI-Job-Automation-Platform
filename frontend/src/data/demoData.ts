/**
 * Demo data for showcase mode
 */

export const demoJobs = [
  {
    id: '1',
    title: 'Senior Software Engineer',
    company: 'Google',
    location: 'Mountain View, CA',
    salary: '$180,000 - $250,000',
    status: 'applied',
    appliedAt: '2024-01-15T10:30:00Z',
    source: 'LinkedIn',
    matchScore: 95,
  },
  {
    id: '2',
    title: 'Full Stack Developer',
    company: 'Meta',
    location: 'Menlo Park, CA',
    salary: '$160,000 - $220,000',
    status: 'interview',
    appliedAt: '2024-01-14T14:20:00Z',
    source: 'Indeed',
    matchScore: 92,
  },
  {
    id: '3',
    title: 'Frontend Engineer',
    company: 'Netflix',
    location: 'Los Gatos, CA',
    salary: '$150,000 - $200,000',
    status: 'offer',
    appliedAt: '2024-01-13T09:15:00Z',
    source: 'Company Website',
    matchScore: 88,
  },
  {
    id: '4',
    title: 'Backend Engineer',
    company: 'Amazon',
    location: 'Seattle, WA',
    salary: '$170,000 - $230,000',
    status: 'rejected',
    appliedAt: '2024-01-12T16:45:00Z',
    source: 'LinkedIn',
    matchScore: 85,
  },
  {
    id: '5',
    title: 'DevOps Engineer',
    company: 'Microsoft',
    location: 'Redmond, WA',
    salary: '$155,000 - $210,000',
    status: 'applied',
    appliedAt: '2024-01-11T11:00:00Z',
    source: 'Glassdoor',
    matchScore: 90,
  },
  {
    id: '6',
    title: 'Product Engineer',
    company: 'Apple',
    location: 'Cupertino, CA',
    salary: '$165,000 - $225,000',
    status: 'interview',
    appliedAt: '2024-01-10T13:30:00Z',
    source: 'LinkedIn',
    matchScore: 93,
  },
];

export const demoStats = {
  totalApplications: 156,
  activeApplications: 42,
  interviews: 12,
  offers: 3,
  responseRate: 27,
  avgResponseTime: 5.2,
};

export const demoChartData = [
  { date: 'Jan 1', applications: 12, responses: 3 },
  { date: 'Jan 8', applications: 18, responses: 5 },
  { date: 'Jan 15', applications: 25, responses: 7 },
  { date: 'Jan 22', applications: 32, responses: 9 },
  { date: 'Jan 29', applications: 28, responses: 8 },
  { date: 'Feb 5', applications: 35, responses: 11 },
  { date: 'Feb 12', applications: 41, responses: 14 },
];

export const demoLogs = [
  {
    id: '1',
    timestamp: '2024-01-15T10:30:00Z',
    type: 'success',
    message: 'Successfully applied to Senior Software Engineer at Google',
  },
  {
    id: '2',
    timestamp: '2024-01-15T10:28:00Z',
    type: 'success',
    message: 'Resume generated for Google application',
  },
  {
    id: '3',
    timestamp: '2024-01-15T10:25:00Z',
    type: 'info',
    message: 'Found 15 new matching jobs',
  },
  {
    id: '4',
    timestamp: '2024-01-15T10:20:00Z',
    type: 'success',
    message: 'Email sent to recruiter at Meta',
  },
  {
    id: '5',
    timestamp: '2024-01-15T10:15:00Z',
    type: 'warning',
    message: 'Rate limit reached, waiting 60 seconds',
  },
  {
    id: '6',
    timestamp: '2024-01-15T10:10:00Z',
    type: 'success',
    message: 'Bot automation started',
  },
];

export const demoResumes = [
  {
    id: '1',
    title: 'Software Engineer - Google',
    company: 'Google',
    createdAt: '2024-01-15T10:28:00Z',
    status: 'generated',
  },
  {
    id: '2',
    title: 'Full Stack Developer - Meta',
    company: 'Meta',
    createdAt: '2024-01-14T14:18:00Z',
    status: 'generated',
  },
  {
    id: '3',
    title: 'Frontend Engineer - Netflix',
    company: 'Netflix',
    createdAt: '2024-01-13T09:12:00Z',
    status: 'generated',
  },
];

export const demoUser = {
  id: 'demo-user',
  name: 'Demo User',
  email: 'demo@example.com',
  avatar: '👤',
  plan: 'Professional',
};
