import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, ChevronRight, Sparkles } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#f8f5ef]"
      style={{ fontFamily: '"Space Grotesk", "Manrope", "Segoe UI", sans-serif' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(255,122,26,0.22),transparent_34%),radial-gradient(circle_at_88%_8%,rgba(0,160,255,0.24),transparent_28%),radial-gradient(circle_at_70%_85%,rgba(16,185,129,0.18),transparent_32%)]" />
      <motion.div
        className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#ff7a1a]/25 blur-3xl"
        animate={{ x: [0, 18, -8, 0], y: [0, -14, 12, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-[#0091ff]/25 blur-3xl"
        animate={{ x: [0, -14, 10, 0], y: [0, 15, -9, 0] }}
        transition={{ duration: 14.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_520px] lg:px-8">
        <motion.aside
          className="hidden rounded-3xl border border-[#171717]/10 bg-white/70 p-10 shadow-[0_30px_70px_-35px_rgba(0,0,0,0.28)] backdrop-blur lg:block"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        >
          <div className="mb-10 inline-flex items-center gap-3 rounded-2xl bg-[#171717] px-4 py-3 text-white">
            <Bot className="h-6 w-6" />
            <span className="text-sm font-bold uppercase tracking-[0.14em]">AI Job Automation</span>
          </div>
          <h1 className="text-4xl font-extrabold leading-tight text-[#171717]">
            Applications on autopilot.
            <span className="block bg-[linear-gradient(90deg,#ff5e00,#ff9800,#00a0ff)] bg-clip-text text-transparent">
              Your career in focus.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-[#171717]/70">
            Log in and keep your search momentum. Match faster, apply smarter, and track everything
            from one clear dashboard.
          </p>
          <div className="mt-8 space-y-3 text-sm text-[#171717]/75">
            <p className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#ff7a1a]" />Smart role matching and scoring</p>
            <p className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#ff7a1a]" />Automated application workflows</p>
            <p className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#ff7a1a]" />Unified follow-up tracking</p>
          </div>
        </motion.aside>

        <motion.div
          className="w-full"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.62, ease: 'easeOut' }}
        >
          <div className="overflow-hidden rounded-3xl border border-[#171717]/10 bg-white/82 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="border-b border-[#171717]/10 px-6 py-5 sm:px-8">
              <Link to="/" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.14em] text-[#171717]/60 transition hover:text-[#171717]">
                Back to home
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#171717]">
                {title}
              </h2>
              <p className="mt-2 text-sm text-[#171717]/65">
                {subtitle}
              </p>
            </div>

            <div className="px-6 py-7 sm:px-8">
              {children}
            </div>

            <div className="border-t border-[#171717]/10 bg-[#171717]/[0.03] px-6 py-4 text-center text-xs text-[#171717]/65 sm:px-8">
              Secured by <span className="font-semibold text-[#171717]">AI Job Automation</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
