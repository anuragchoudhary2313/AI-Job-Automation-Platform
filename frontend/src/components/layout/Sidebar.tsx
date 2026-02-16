import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard, Briefcase, FileText, Settings, Shield, Terminal, Users,
  ChevronLeft, LogOut
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from '../ui/Tooltip';
import { useFeatures } from '../../contexts/FeatureContext';
import { useAuth } from '../../contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Resumes', href: '/resumes', icon: FileText },
  { name: 'Logs', href: '/logs', icon: Terminal },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Admin', href: '/admin', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const { isEnabled } = useFeatures();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize from localStorage or default to false
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Persist state
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  // Keyboard shortcut (Cmd/Ctrl + B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setCollapsed((prev: boolean) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.div
      className="hidden md:flex flex-col h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 relative z-10"
      initial={false}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} // smooth ease-out-quart
    >
      {/* Brand */}
      <div className="h-16 flex items-center px-4 border-b border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
        <div className="flex items-center gap-3">
          <Link to="/">
            <motion.div
              layout
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20"
            >
              <span className="text-white font-bold text-xl">A</span>
            </motion.div>
          </Link>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="font-bold text-xl tracking-tight text-gray-900 dark:text-white whitespace-nowrap"
              >
                JobAuto
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>


      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full p-1.5 shadow-sm hover:shadow-md transition-all z-20 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 dark:hover:border-gray-700 hover:scale-110 active:scale-95"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronLeft className="h-3 w-3" />
        </motion.div>
      </button>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {navigation.filter(item => {
          if (item.name === 'Team') return isEnabled('teams');
          if (item.name === 'Admin') return isEnabled('admin_panel');
          return true;
        }).map((item) => {
          const isActive = location.pathname === item.href;
          const linkContent = (
            <Link
              to={item.href}
              className={cn(
                'group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden',
                isActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
                collapsed && "justify-center px-0 py-3"
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 flex-shrink-0 transition-colors duration-200',
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300',
                  !collapsed && "mr-3"
                )}
                aria-hidden="true"
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="truncate"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Click Ripple Effect (Optional visual touch) */}
              {isActive && (
                <motion.div
                  layoutId="active-nav-bg"
                  className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 z-[-1] rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              {/* Active Indicator Line for Collapsed State */}
              {isActive && collapsed && (
                <motion.div
                  layoutId="active-nav-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-blue-600 rounded-r-full"
                />
              )}
            </Link>
          );

          return collapsed ? (
            <Tooltip key={item.name} content={item.name} side="right">
              {linkContent}
            </Tooltip>
          ) : (
            <div key={item.name}>{linkContent}</div>
          );
        })}
      </div>

      {/* Footer / User Profile */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
        <div className={cn(
          "flex items-center rounded-xl p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer overflow-hidden relative",
          collapsed ? "justify-center" : "gap-3"
        )}>
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-inner ring-2 ring-white dark:ring-gray-950">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 overflow-hidden"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email || 'Premium Plan'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!collapsed && (
              <motion.button
                onClick={handleLogout}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
