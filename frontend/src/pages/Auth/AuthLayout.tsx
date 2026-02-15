import React from 'react';
import { Bot } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-950 relative overflow-hidden transition-colors duration-500">
      {/* Ambient Background Gradients */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-20 w-96 h-96 bg-indigo-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="z-10 w-full max-w-md p-4">
        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="p-3 bg-blue-600/10 rounded-xl mb-4 group">
                <Bot className="w-10 h-10 text-blue-600 dark:text-blue-500 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center tracking-tight">
                {title}
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                {subtitle}
              </p>
            </div>
            {children}
          </div>
          <div className="px-8 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-200/50 dark:border-gray-800/50 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Secured by <span className="font-semibold text-blue-600 dark:text-blue-500">AI Job Automation</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
