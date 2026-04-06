import { useEffect, useState } from 'react';
import { useLocation, Outlet, Navigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar, sidebarNavigation } from './Sidebar';
import { ThemeToggle } from '../ui/ThemeToggle';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { NotificationProvider } from '../notifications/NotificationContext';
import { Menu, LogOut, Compass } from 'lucide-react';
import { Button } from '../ui/Button';
import { CommandMenu } from '../ui/CommandMenu';
import { Breadcrumbs } from './Breadcrumbs';
import { useAuth } from '../../contexts/AuthContext';
import { useFeatures } from '../../contexts/FeatureContext';
import { cn } from '../../lib/utils';

export function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isLoading: loading } = useAuth();
  const { isEnabled } = useFeatures();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Dynamic Page Title
  useEffect(() => {
    const path = location.pathname;
    const title = path === '/' ? 'Dashboard' : path.slice(1).charAt(0).toUpperCase() + path.slice(1).slice(1).replace(/-/g, ' ');
    document.title = `${title} | JobAuto`;
  }, [location]);

  const currentPageLabel = location.pathname === '/'
    ? 'Dashboard'
    : location.pathname
      .replace(/^\//, '')
      .split('/')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '))
      .join(' / ');

  // Check authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }



  return (
    <NotificationProvider>
      <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-950 font-sans antialiased text-gray-900 dark:text-gray-100 selection:bg-blue-100 dark:selection:bg-blue-900/30">

        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.aside
              initial={{ x: -320, opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0.9 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              drag="x"
              dragDirectionLock
              dragConstraints={{ left: -320, right: 0 }}
              dragElastic={0.08}
              onDragEnd={(_, info) => {
                if (info.offset.x < -70 || info.velocity.x < -500) {
                  setMobileMenuOpen(false);
                }
              }}
              className="fixed left-0 top-0 z-50 flex h-full w-[290px] flex-col border-r border-gray-200/80 bg-gradient-to-b from-white via-slate-50/70 to-white shadow-xl dark:border-gray-800 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 md:hidden"
            >
              <div className="pointer-events-none absolute -right-2 top-1/2 z-10 -translate-y-1/2">
                <div className="flex h-16 w-2 items-center justify-center rounded-full border border-gray-200/80 bg-white/95 shadow-sm dark:border-gray-700 dark:bg-gray-900/95">
                  <motion.div
                    className="h-8 w-1 rounded-full bg-gray-300 dark:bg-gray-600"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
              </div>

              <div className="border-b border-gray-200/60 px-4 py-4 dark:border-gray-800/60">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <span className="text-white font-bold text-xl">A</span>
                  </div>
                  <div>
                    <p className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">JobAuto</p>
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">Automation Hub</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-5 px-3 space-y-2">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">Main Menu</p>
                {sidebarNavigation.filter((item) => {
                  if (item.name === 'Admin') return isEnabled('admin_panel');
                  return true;
                }).map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'group flex items-center rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden border',
                        isActive
                          ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 dark:border-blue-900/70 dark:from-blue-900/30 dark:to-indigo-900/20 dark:text-blue-300 shadow-sm'
                          : 'border-transparent text-gray-600 dark:text-gray-400 hover:border-gray-200 hover:bg-white dark:hover:border-gray-700 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-100'
                      )}
                    >
                      <item.icon className={cn('h-5 w-5 mr-3', isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400')} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="border-t border-gray-200/80 dark:border-gray-800 p-4">
                <div className="flex items-center rounded-2xl border border-gray-200/80 bg-white/90 p-2 gap-3 dark:border-gray-800 dark:bg-gray-900/80 overflow-hidden relative">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-inner ring-2 ring-white dark:ring-gray-950">
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {user?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email || 'user@jobauto.app'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="mt-2 flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white py-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-red-900/60 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                  aria-label="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5 mr-2" />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">

          {/* Top Navbar */}
          <header className="sticky top-0 z-30 border-b border-gray-100/80 bg-white/80 px-3 py-2 backdrop-blur-md transition-all duration-300 supports-[backdrop-filter]:bg-opacity-60 dark:border-gray-800 dark:bg-gray-950/80 md:px-6">
            <div className="flex h-14 items-center justify-between gap-3 rounded-2xl border border-gray-200/80 bg-white/90 px-3 shadow-sm dark:border-gray-800 dark:bg-gray-900/80 md:px-4">

              {/* Mobile Menu Trigger */}
              <div className="flex items-center gap-3 md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(true)}
                  className="h-9 w-9 rounded-xl border border-gray-200/90 bg-white/90 text-gray-500 shadow-sm transition-all hover:border-cyan-200 hover:bg-cyan-50/80 hover:text-cyan-700 dark:border-gray-800 dark:bg-gray-900/80 dark:text-gray-400 dark:hover:border-cyan-900/60 dark:hover:bg-cyan-900/20 dark:hover:text-cyan-300"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <p className="font-bold text-base tracking-tight">JobAuto</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">{currentPageLabel}</p>
                </div>
              </div>

              {/* Desktop Breadcrumb */}
              <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-900/20 dark:text-cyan-300">
                  <Compass className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">Workspace</p>
                  <div className="truncate">
                    <Breadcrumbs />
                  </div>
                </div>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-2 rounded-xl border border-gray-200/80 bg-gray-50/80 px-2 py-1 dark:border-gray-800 dark:bg-gray-900/70 md:gap-2.5">
                <CommandMenu />
                <ThemeToggle />
                <NotificationCenter />
              </div>
            </div>
          </header>

          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-black/20 p-4 md:p-8 scroll-smooth will-change-transform">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="max-w-7xl mx-auto space-y-8"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>

        </div>
      </div>
    </NotificationProvider>
  );
}
