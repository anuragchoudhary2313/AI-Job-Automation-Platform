import { useRef, useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNotifications } from './NotificationContext';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';

export function NotificationCenter() {
  const { notifications, unreadCount, markAllAsRead, markAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-950 animate-pulse" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px] h-5">{unreadCount} new</Badge>
              )}
            </div>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 px-2 text-xs" title="Mark all as read">
                  <Check className="h-3.5 w-3.5 mr-1" /> Mark read
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 px-2 text-xs text-gray-400 hover:text-red-500" title="Clear all">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800/50">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">All caught up!</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No new notifications to show.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-default relative group",
                      !notification.read && "bg-blue-50/10 dark:bg-blue-900/10"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className={cn(
                        "mt-1 h-2 w-2 rounded-full flex-shrink-0",
                        !notification.read ? "bg-blue-500" : "bg-transparent",
                        notification.type === 'error' && !notification.read && "bg-red-500",
                        notification.type === 'success' && !notification.read && "bg-emerald-500",
                      )} />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <p className={cn("text-xs font-medium", !notification.read ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400")}>
                            {notification.title}
                          </p>
                          <span className="text-[10px] text-gray-400 tabular-nums whitespace-nowrap ml-2">
                            {getTimeAgo(notification.timestamp)}
                          </span>
                        </div>
                        <p className={cn("text-sm", !notification.read ? "text-gray-800 dark:text-gray-200" : "text-gray-500 dark:text-gray-400")}>
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
