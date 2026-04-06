import { Mail, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { EmailAutomation } from '../Dashboard/components/EmailAutomation';

export default function EmailCampaigns() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-[#f0f4ff] via-[#f8fbff] to-[#fff9f0] p-5 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 md:p-7">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-blue-200/35 blur-3xl dark:bg-blue-900/30" />
        <div className="absolute -bottom-14 left-8 h-44 w-44 rounded-full bg-indigo-200/30 blur-3xl dark:bg-indigo-900/20" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700 dark:border-blue-800 dark:bg-gray-900 dark:text-blue-300">
              <Mail className="h-3.5 w-3.5" />
              Cold HR Mail
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white md:text-4xl">Email Campaigns</h1>
            <p className="mt-2 max-w-xl text-sm text-gray-600 dark:text-gray-400 md:text-base">
              Send personalized cold outreach emails to HR teams at companies with open positions. Auto-prefilled from your profile and job context.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:w-auto sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white/80 p-3 dark:border-gray-700 dark:bg-gray-900/70">
              <p className="text-xs text-gray-500 dark:text-gray-400">Feature</p>
              <p className="mt-1 text-lg font-bold text-blue-600 dark:text-blue-400">HR Auto-Scrape</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white/80 p-3 dark:border-gray-700 dark:bg-gray-900/70">
              <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
              <p className="mt-1 inline-flex items-center gap-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Active
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap gap-3">
          <Button className="rounded-xl" variant="outline">
            Learn Best Practices
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Email Automation Form */}
      <div>
        <EmailAutomation />
      </div>

      {/* Tips Section */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-2xl">📋</span> Preload from Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 dark:text-gray-400">
            Click the mail icon on any job in the Jobs page to auto-fill company, role, and HR email instantly.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-2xl">⚡</span> Profile Prefilled
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 dark:text-gray-400">
            Your name, skills, portfolio link, and other details are auto-populated from your profile. Edit as needed.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-2xl">🔍</span> HR Email Lookup
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 dark:text-gray-400">
            We scrape company websites to find HR contact emails. If no email is found, you can enter it manually.
          </CardContent>
        </Card>
      </section>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🚀</span> Workflow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
              <span className="text-sm font-bold text-blue-700 dark:text-blue-400">1</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Select a job</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Browse the Jobs page and click the mail icon on any listing.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
              <span className="text-sm font-bold text-blue-700 dark:text-blue-400">2</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Auto-filled form</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Company, role, and HR email auto-populate. Your profile details fill in skills and portfolio.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
              <span className="text-sm font-bold text-blue-700 dark:text-blue-400">3</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Review &amp; send</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Review the pre-filled details, attach your resume, and hit Send.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
