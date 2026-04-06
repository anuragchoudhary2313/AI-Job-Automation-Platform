import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import * as Dialog from '@radix-ui/react-dialog';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Settings,
  User,
  Shield,
  Search,
  Moon,
  Sun,
  Play,
  Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/user-theme';
import { Button } from './Button';
import apiClient, { getErrorMessage } from '../../lib/api';
import { toast } from './Toast';

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const handleStartBotEngine = async () => {
    const toastId = 'command-start-bot';
    toast.loading('Starting bot engine...', { id: toastId });

    try {
      await apiClient.post('/agent/multi-apply', {
        keyword: 'Software Engineer',
        location: 'Remote',
        limit: 5
      });
      toast.success('Bot engine started successfully.', { id: toastId });
      navigate('/jobs');
    } catch (error) {
      toast.error(getErrorMessage(error), { id: toastId });
    }
  };

  const commandItemClass = 'relative flex cursor-pointer select-none items-center rounded-xl px-2.5 py-2 text-sm text-gray-700 outline-none transition-colors hover:bg-gray-100/80 aria-selected:bg-gradient-to-r aria-selected:from-cyan-50 aria-selected:to-blue-50 aria-selected:text-cyan-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:text-gray-200 dark:hover:bg-gray-800/70 dark:aria-selected:from-cyan-900/35 dark:aria-selected:to-blue-900/35 dark:aria-selected:text-cyan-200';

  return (
    <>
      <Button
        variant="outline"
        className="group relative h-9 w-9 rounded-xl border-gray-200/90 bg-white/90 p-0 text-gray-500 shadow-sm transition-all hover:border-cyan-200 hover:bg-cyan-50/80 hover:text-cyan-700 dark:border-gray-800 dark:bg-gray-900/80 dark:text-gray-400 dark:hover:border-cyan-900/60 dark:hover:bg-cyan-900/20 dark:hover:text-cyan-300 xl:h-10 xl:w-64 xl:justify-between xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <div className="inline-flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span className="hidden xl:inline-flex text-sm">Search commands</span>
        </div>
        <kbd className="pointer-events-none hidden h-6 select-none items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-1.5 font-mono text-[10px] font-semibold tracking-wide text-gray-500 xl:inline-flex dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          Ctrl K
        </kbd>
      </Button>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Global Command Menu"
        className="fixed top-1/2 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-b from-white to-slate-50 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200 dark:border-gray-700 dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 dark:ring-white/10"
        onClick={(e) => {
          // Prevent close on click inside
          e.stopPropagation();
        }}
      >
        <Dialog.Title className="sr-only">Global Command Menu</Dialog.Title>
        <Dialog.Description className="sr-only">
          Search for navigation shortcuts and quick actions.
        </Dialog.Description>

        {/* Backdrop */}
        <div className="fixed inset-0 -z-10 bg-slate-950/55 backdrop-blur-sm" onClick={() => setOpen(false)} />

        <div className="border-b border-gray-100 px-4 py-2.5 dark:border-gray-700">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-300">Command Palette</p>
            <kbd className="h-5 rounded-md border border-gray-200 bg-white px-1.5 font-mono text-[10px] font-semibold text-gray-500 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-300">Esc</kbd>
          </div>

          <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-3 shadow-sm dark:border-gray-600 dark:bg-slate-900">
            <Search className="mr-2 h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-300" />
          <Command.Input
            placeholder="Type a command or search..."
            className="flex h-10 w-full rounded-md bg-transparent py-1.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
          </div>
        </div>

        <Command.List className="max-h-[340px] overflow-y-auto overflow-x-hidden p-2.5">
          <Command.Empty className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No results found.</Command.Empty>

          <Command.Group heading={<span className="px-2 pb-1 pt-0.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-300">Navigation</span>}>
            <Command.Item
              onSelect={() => runCommand(() => navigate('/'))}
              className={commandItemClass}
            >
              <span className="mr-2 inline-flex h-6.5 w-6.5 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 dark:border-gray-600 dark:bg-slate-900 dark:text-gray-300">
                <LayoutDashboard className="h-4 w-4" />
              </span>
              <span>Dashboard</span>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigate('/jobs'))}
              className={commandItemClass}
            >
              <span className="mr-2 inline-flex h-6.5 w-6.5 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 dark:border-gray-600 dark:bg-slate-900 dark:text-gray-300">
                <Briefcase className="h-4 w-4" />
              </span>
              <span>Jobs</span>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigate('/resumes'))}
              className={commandItemClass}
            >
              <span className="mr-2 inline-flex h-6.5 w-6.5 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 dark:border-gray-600 dark:bg-slate-900 dark:text-gray-300">
                <FileText className="h-4 w-4" />
              </span>
              <span>Resumes</span>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigate('/email-campaigns'))}
              className={commandItemClass}
            >
              <span className="mr-2 inline-flex h-6.5 w-6.5 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 dark:border-gray-600 dark:bg-slate-900 dark:text-gray-300">
                <Mail className="h-4 w-4" />
              </span>
              <span>Email Campaigns</span>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigate('/settings'))}
              className={commandItemClass}
            >
              <span className="mr-2 inline-flex h-6.5 w-6.5 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 dark:border-gray-600 dark:bg-slate-900 dark:text-gray-300">
                <Settings className="h-4 w-4" />
              </span>
              <span>Settings</span>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigate('/profile'))}
              className={commandItemClass}
            >
              <span className="mr-2 inline-flex h-6.5 w-6.5 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 dark:border-gray-600 dark:bg-slate-900 dark:text-gray-300">
                <User className="h-4 w-4" />
              </span>
              <span>Profile</span>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigate('/admin'))}
              className={commandItemClass}
            >
              <span className="mr-2 inline-flex h-6.5 w-6.5 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 dark:border-gray-600 dark:bg-slate-900 dark:text-gray-300">
                <Shield className="h-4 w-4" />
              </span>
              <span>Admin</span>
            </Command.Item>
          </Command.Group>

          <Command.Separator className="my-1.5 h-px bg-gray-100 dark:bg-gray-700" />

          <Command.Group heading={<span className="px-2 pb-1 pt-0.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-300">Actions</span>}>
            <Command.Item
              onSelect={() => runCommand(() => {
                void handleStartBotEngine();
              })}
              className={commandItemClass}
            >
              <span className="mr-2 inline-flex h-6.5 w-6.5 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800/60 dark:bg-emerald-900/25 dark:text-emerald-300">
                <Play className="h-4 w-4" />
              </span>
              <span>Start Bot Engine</span>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
              className={commandItemClass}
            >
              <span className="mr-2 inline-flex h-6.5 w-6.5 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 dark:border-gray-600 dark:bg-slate-900 dark:text-gray-300">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </span>
              <span>Toggle Theme</span>
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command.Dialog>
    </>
  );
}
