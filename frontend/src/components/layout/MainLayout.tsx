import { useEffect, useState } from 'react';
import { useLocation, Outlet, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from '../ui/ThemeToggle';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { NotificationProvider } from '../notifications/NotificationContext';
import { Menu } from 'lucide-react';
import { Button } from '../ui/Button';
import { CommandMenu } from '../ui/CommandMenu';
import { Breadcrumbs } from './Breadcrumbs';
import { Toaster } from '../ui/Toast';
import { useAuth } from '../../hooks/useAuth';

export function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, loading } = useAuth();

  // Dynamic Page Title
  useEffect(() => {
    const path = location.pathname;
    const title = path === '/' ? 'Dashboard' : path.slice(1).charAt(0).toUpperCase() + path.slice(1).slice(1).replace(/-/g, ' ');
    document.title = `${title} | JobAuto`;
  }, [location]);

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

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">

          {/* Top Navbar */}
          <header className="h-16 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 z-30 transition-all duration-300 supports-[backdrop-filter]:bg-opacity-60 sticky top-0">

            {/* Mobile Menu Trigger */}
            <div className="flex items-center gap-3 md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <span className="font-bold text-lg tracking-tight">JobAuto</span>
            </div>

            {/* Breadcrumb */}
            <div className="hidden md:block">
              <Breadcrumbs />
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              <CommandMenu />
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block" />
              <ThemeToggle />
              <NotificationCenter />
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
        <Toaster />
      </div>
    </NotificationProvider>
  );
}
