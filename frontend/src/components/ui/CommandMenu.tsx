import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Terminal,
  Users,
  Settings,
  Search,
  Moon,
  Sun,
  Play
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/user-theme';
import { Button } from './Button';

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

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2 text-gray-500 dark:text-gray-400"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-gray-50 px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <span className="text-xs">Ctrl K</span>
        </kbd>
      </Button>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Global Command Menu"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => {
          // Prevent close on click inside
          e.stopPropagation();
        }}
      >
        {/* Backdrop */}
        <div className="fixed inset-0 -z-10 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

        <div className="flex items-center border-b border-gray-100 dark:border-gray-800 px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Command.Input
            placeholder="Type a command or search..."
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white"
          />
        </div>

        <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
          <Command.Empty className="py-6 text-center text-sm text-gray-500">No results found.</Command.Empty>

          <Command.Group heading={<span className="text-xs font-medium text-gray-500 px-2 my-2 block">Navigation</span>}>
            <Command.Item
              onSelect={() => runCommand(() => navigate('/'))}
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-gray-100 aria-selected:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:aria-selected:bg-gray-800 dark:aria-selected:text-gray-50 transition-colors"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigate('/jobs'))}
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-gray-100 aria-selected:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:aria-selected:bg-gray-800 dark:aria-selected:text-gray-50 transition-colors"
            >
              <Briefcase className="mr-2 h-4 w-4" />
              <span>Jobs</span>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigate('/resumes'))}
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-gray-100 aria-selected:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:aria-selected:bg-gray-800 dark:aria-selected:text-gray-50 transition-colors"
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>Resumes</span>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigate('/logs'))}
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-gray-100 aria-selected:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:aria-selected:bg-gray-800 dark:aria-selected:text-gray-50 transition-colors"
            >
              <Terminal className="mr-2 h-4 w-4" />
              <span>Logs</span>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigate('/team'))}
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-gray-100 aria-selected:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:aria-selected:bg-gray-800 dark:aria-selected:text-gray-50 transition-colors"
            >
              <Users className="mr-2 h-4 w-4" />
              <span>Team</span>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => navigate('/settings'))}
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-gray-100 aria-selected:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:aria-selected:bg-gray-800 dark:aria-selected:text-gray-50 transition-colors"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Command.Item>
          </Command.Group>

          <Command.Separator className="my-1 h-px bg-gray-100 dark:bg-gray-800" />

          <Command.Group heading={<span className="text-xs font-medium text-gray-500 px-2 my-2 block">Actions</span>}>
            <Command.Item
              onSelect={() => runCommand(() => console.log('Start Bot'))}
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-gray-100 aria-selected:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:aria-selected:bg-gray-800 dark:aria-selected:text-gray-50 transition-colors"
            >
              <Play className="mr-2 h-4 w-4 text-green-500" />
              <span>Start Bot Engine</span>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-gray-100 aria-selected:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:aria-selected:bg-gray-800 dark:aria-selected:text-gray-50 transition-colors"
            >
              {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              <span>Toggle Theme</span>
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command.Dialog>
    </>
  );
}
