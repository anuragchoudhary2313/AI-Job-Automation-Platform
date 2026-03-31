import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock3,
  Gauge,
  Mail,
  Shield,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';

const Landing = () => {
  const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0 },
  };

  const features = [
    {
      icon: Gauge,
      title: 'Autopilot Applications',
      copy: 'Queue matched roles and let automation apply while you focus on interviews.',
    },
    {
      icon: Target,
      title: 'Precision Matching',
      copy: 'Filter by skills, experience, and location so every application is intentional.',
    },
    {
      icon: Briefcase,
      title: 'Pipeline Visibility',
      copy: 'Track status, responses, and next actions in one practical command center.',
    },
  ];

  const trustedBy = ['Globex', 'Northstar Labs', 'PixelForge', 'Blue Orbit', 'TalentRise', 'Velocity Hiring'];

  const workflow = [
    {
      step: '01',
      title: 'Set Your Search Rules',
      copy: 'Define title, location, experience level, and remote preference in under two minutes.',
    },
    {
      step: '02',
      title: 'Auto-Discover Matched Roles',
      copy: 'The engine scrapes and ranks openings based on your profile and application strategy.',
    },
    {
      step: '03',
      title: 'One-Click Save and Apply',
      copy: 'Review suggestions, save relevant jobs, and send tailored applications with confidence.',
    },
    {
      step: '04',
      title: 'Track Every Outcome',
      copy: 'Monitor replies, interview stages, and conversion rates from one clean dashboard.',
    },
  ];

  const planCards = [
    {
      name: 'Starter',
      price: '$0',
      period: '/month',
      note: 'For testing the workflow',
      items: ['Up to 25 tracked applications', 'Basic job matching', 'Email notifications'],
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      note: 'For active job seekers',
      items: ['Unlimited tracked applications', 'Automation queue and smart scoring', 'Interview analytics and insights'],
      highlighted: true,
    },
    {
      name: 'Career+',
      price: '$79',
      period: '/month',
      note: 'For high-volume applications',
      items: ['Team-grade reporting exports', 'Priority support and onboarding', 'Custom workflow tuning'],
    },
  ];

  const faqs = [
    {
      q: 'Do you submit applications automatically?',
      a: 'You control approval. The system prepares and queues high-match applications, and you decide what goes out.',
    },
    {
      q: 'Can I filter by remote, hybrid, or onsite?',
      a: 'Yes. You can combine location mode, job type, and experience to keep results focused.',
    },
    {
      q: 'How long are scraped jobs stored?',
      a: 'Recently scraped opportunities stay available in a dedicated section for at least seven days.',
    },
    {
      q: 'Is my account data secure?',
      a: 'All sessions are authenticated, and personal account data is handled using secure backend controls.',
    },
  ];

  return (
    <div
      className="min-h-screen bg-[#f8f5ef] text-[#171717]"
      style={{ fontFamily: '"Space Grotesk", "Manrope", "Segoe UI", sans-serif' }}
    >
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,102,0,0.18),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(0,145,255,0.2),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(25,191,122,0.18),transparent_32%)]" />
        <motion.div
          className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-[#ff7a1a]/30 blur-3xl"
          animate={{ x: [0, 26, -10, 0], y: [0, -20, 18, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -right-20 top-12 h-72 w-72 rounded-full bg-[#0091ff]/25 blur-3xl"
          animate={{ x: [0, -20, 12, 0], y: [0, 18, -16, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
          <header className="mb-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#171717] text-white">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#171717]/60">AI Job Automation</p>
                <p className="text-xs text-[#171717]/50">Career acceleration engine</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="rounded-full border border-[#171717]/20 px-5 py-2 text-sm font-semibold transition hover:border-[#171717]/40"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-[#171717] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#2b2b2b]"
              >
                Start free
              </Link>
            </div>
          </header>

          <motion.div
            className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.12 } },
            }}
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.7, ease: 'easeOut' }}>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#171717]/15 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em]">
                <Sparkles className="h-4 w-4 text-[#ff7a1a]" />
                Built for active job seekers
              </div>
              <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                Land better roles with
                <span className="block bg-[linear-gradient(90deg,#ff5e00,#ff9600,#00a0ff)] bg-clip-text text-transparent">
                  a smarter application rhythm
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-[#171717]/70">
                Search, score, and submit applications with automation that still feels human.
                Build momentum every day, not just when you find time.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#171717] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
                >
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/demo"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#171717]/20 bg-white/80 px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-[#171717]/40"
                >
                  Explore live demo
                </Link>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="relative"
            >
              <div className="rounded-3xl border border-[#171717]/10 bg-white/80 p-6 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.25)] backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#171717]/50">Today at a glance</p>
                <div className="mt-5 space-y-4">
                  <motion.div
                    className="rounded-2xl bg-[#171717] p-4 text-white"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <p className="text-xs uppercase tracking-[0.12em] text-white/70">Applications sent</p>
                    <p className="mt-2 text-3xl font-bold">42</p>
                    <p className="text-sm text-white/80">+13 from yesterday</p>
                  </motion.div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-[#ffefe2] p-4">
                      <p className="text-xs uppercase tracking-[0.1em] text-[#8f4d12]">Replies</p>
                      <p className="mt-1 text-2xl font-bold text-[#4a2a10]">8</p>
                    </div>
                    <div className="rounded-2xl bg-[#e6f4ff] p-4">
                      <p className="text-xs uppercase tracking-[0.1em] text-[#0f4f8f]">Interviews</p>
                      <p className="mt-1 text-2xl font-bold text-[#0c3158]">3</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <motion.div
          className="mb-14 rounded-3xl border border-[#171717]/10 bg-white/80 px-6 py-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.12em] text-[#171717]/50">
            Trusted by job seekers from teams at
          </p>
          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-3 lg:grid-cols-6">
            {trustedBy.map((brand) => (
              <div key={brand} className="rounded-xl border border-[#171717]/8 bg-[#f8f5ef] px-3 py-3 text-sm font-semibold text-[#171717]/70">
                {brand}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="grid gap-5 md:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.title}
                variants={fadeUp}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="rounded-3xl border border-[#171717]/10 bg-white/85 p-6 shadow-sm"
              >
                <div className="mb-4 inline-flex rounded-xl bg-[#171717] p-2.5 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#171717]/68">{feature.copy}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <motion.article
            className="rounded-3xl border border-[#171717]/10 bg-white/80 p-7"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55 }}
          >
            <h2 className="text-3xl font-extrabold">How it works</h2>
            <p className="mt-3 text-sm text-[#171717]/66">
              A practical loop designed for consistency, not guesswork.
            </p>
            <div className="mt-6 space-y-4">
              {workflow.map((item) => (
                <div key={item.step} className="rounded-2xl border border-[#171717]/10 bg-[#f8f5ef] p-4">
                  <div className="mb-2 inline-flex rounded-full bg-[#171717] px-2.5 py-1 text-xs font-bold text-white">
                    {item.step}
                  </div>
                  <p className="font-bold">{item.title}</p>
                  <p className="mt-1 text-sm text-[#171717]/65">{item.copy}</p>
                </div>
              ))}
            </div>
          </motion.article>

          <motion.article
            className="rounded-3xl border border-[#171717]/10 bg-white/80 p-7"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, delay: 0.06 }}
          >
            <h2 className="text-3xl font-extrabold">Everything in one place</h2>
            <p className="mt-3 text-sm text-[#171717]/66">
              Replace scattered spreadsheets and reminders with one clear operating panel.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#171717]/10 p-4">
                <BarChart3 className="h-5 w-5 text-[#0f4f8f]" />
                <p className="mt-2 font-semibold">Analytics Dashboard</p>
                <p className="mt-1 text-sm text-[#171717]/65">See response rates by role, company, and week.</p>
              </div>
              <div className="rounded-2xl border border-[#171717]/10 p-4">
                <Clock3 className="h-5 w-5 text-[#8f4d12]" />
                <p className="mt-2 font-semibold">Smart Follow-Ups</p>
                <p className="mt-1 text-sm text-[#171717]/65">Never miss recruiter replies or pending actions.</p>
              </div>
              <div className="rounded-2xl border border-[#171717]/10 p-4">
                <Mail className="h-5 w-5 text-[#0f4f8f]" />
                <p className="mt-2 font-semibold">Outreach Templates</p>
                <p className="mt-1 text-sm text-[#171717]/65">Generate concise and relevant recruiter messages.</p>
              </div>
              <div className="rounded-2xl border border-[#171717]/10 p-4">
                <Shield className="h-5 w-5 text-[#8f4d12]" />
                <p className="mt-2 font-semibold">Secure Access</p>
                <p className="mt-1 text-sm text-[#171717]/65">Protected login and role-aware backend controls.</p>
              </div>
            </div>
          </motion.article>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <motion.div
          className="rounded-3xl border border-[#171717]/10 bg-white/82 p-7"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55 }}
        >
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-extrabold">Plans for every search pace</h2>
              <p className="mt-2 text-sm text-[#171717]/66">Start free, then scale when your interview pipeline grows.</p>
            </div>
            <Link to="/register" className="text-sm font-semibold text-[#171717] underline underline-offset-4">
              View full plan details
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {planCards.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-5 ${plan.highlighted ? 'border-[#171717] bg-[#171717] text-white' : 'border-[#171717]/10 bg-[#f8f5ef]'}`}
              >
                <p className={`text-sm font-bold uppercase tracking-[0.1em] ${plan.highlighted ? 'text-white/75' : 'text-[#171717]/55'}`}>{plan.name}</p>
                <p className="mt-3 text-4xl font-extrabold">
                  {plan.price}
                  <span className={`text-base font-medium ${plan.highlighted ? 'text-white/70' : 'text-[#171717]/55'}`}>{plan.period}</span>
                </p>
                <p className={`mt-2 text-sm ${plan.highlighted ? 'text-white/78' : 'text-[#171717]/62'}`}>{plan.note}</p>
                <div className="mt-4 space-y-2">
                  {plan.items.map((item) => (
                    <p key={item} className={`flex items-start gap-2 text-sm ${plan.highlighted ? 'text-white/88' : 'text-[#171717]/68'}`}>
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.article
            className="rounded-3xl border border-[#171717]/10 bg-white/80 p-7"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55 }}
          >
            <h2 className="text-3xl font-extrabold">What users say</h2>
            <div className="mt-6 space-y-4">
              <blockquote className="rounded-2xl border border-[#171717]/10 bg-[#f8f5ef] p-4">
                <p className="text-sm leading-relaxed text-[#171717]/74">
                  "I was applying inconsistently before. Now I run a weekly rhythm and track every stage clearly."
                </p>
                <p className="mt-3 text-sm font-semibold">Aarav S. · Product Analyst</p>
              </blockquote>
              <blockquote className="rounded-2xl border border-[#171717]/10 bg-[#f8f5ef] p-4">
                <p className="text-sm leading-relaxed text-[#171717]/74">
                  "The role filtering and save-to-apply flow helped me stop wasting time on low-fit positions."
                </p>
                <p className="mt-3 text-sm font-semibold">Nisha K. · Frontend Developer</p>
              </blockquote>
            </div>
          </motion.article>

          <motion.article
            className="rounded-3xl border border-[#171717]/10 bg-white/80 p-7"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, delay: 0.06 }}
          >
            <h2 className="text-3xl font-extrabold">Built for modern hiring channels</h2>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-[#171717]/10 bg-[#f8f5ef] p-4">
                <Building2 className="h-5 w-5" />
                <p className="text-sm text-[#171717]/72">Company careers pages</p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-[#171717]/10 bg-[#f8f5ef] p-4">
                <Briefcase className="h-5 w-5" />
                <p className="text-sm text-[#171717]/72">Public job boards</p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-[#171717]/10 bg-[#f8f5ef] p-4">
                <Users className="h-5 w-5" />
                <p className="text-sm text-[#171717]/72">Recruiter outreach workflows</p>
              </div>
            </div>
          </motion.article>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <motion.div
          className="rounded-3xl border border-[#171717]/10 bg-white/82 p-7"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55 }}
        >
          <h2 className="text-3xl font-extrabold">Frequently asked questions</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <article key={faq.q} className="rounded-2xl border border-[#171717]/10 bg-[#f8f5ef] p-4">
                <p className="font-semibold">{faq.q}</p>
                <p className="mt-2 text-sm text-[#171717]/67">{faq.a}</p>
              </article>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="border-y border-[#171717]/10 bg-[#171717] py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.h2
            className="text-3xl font-extrabold sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Make every application count
          </motion.h2>
          <motion.p
            className="mx-auto mt-4 max-w-2xl text-white/70"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.08 }}
          >
            Join professionals using AI Job Automation to run a disciplined search and turn effort
            into interviews.
          </motion.p>
          <motion.div
            className="mt-8 flex justify-center"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.16 }}
          >
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-[#171717] transition hover:-translate-y-0.5"
            >
              Start your free account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-4 py-8 text-sm text-[#171717]/55 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p>© {new Date().getFullYear()} AI Job Automation</p>
          <p>Built to help you spend less time applying and more time interviewing.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
