/**
 * Notification Toast Component - UPGRADED
 * 
 * Enhanced with:
 * - Structured error messages with recovery actions
 * - Severity levels (info, success, warning, error, achievement)
 * - Auto-dismiss with pause on hover/focus
 * - Screen reader announcements
 * - Queue management for multiple notifications
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X, Trophy, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useReducedMotion } from '@/hooks/useAccessibility';
import { toastVariants } from '@/utils/motionPresets';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error' | 'achievement';

export interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  action?: NotificationAction;
  duration?: number; // ms, 0 = no auto-dismiss
  icon?: React.ReactNode;
}

interface NotificationToastProps {
  notification: NotificationData;
  onDismiss: (id: string) => void;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const SEVERITY_CONFIG: Record<NotificationSeverity, {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  defaultDuration: number;
}> = {
  info: {
    icon: <Info className="w-5 h-5" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-500/30',
    defaultDuration: 5000,
  },
  success: {
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'text-green-400',
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-500/30',
    defaultDuration: 4000,
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/20',
    borderColor: 'border-yellow-500/30',
    defaultDuration: 6000,
  },
  error: {
    icon: <AlertCircle className="w-5 h-5" />,
    color: 'text-red-400',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-500/30',
    defaultDuration: 8000, // Longer for errors so users can read recovery steps
  },
  achievement: {
    icon: <Trophy className="w-5 h-5" />,
    color: 'text-[var(--rarity-legendary)]',
    bgColor: 'bg-[var(--rarity-legendary)]/10',
    borderColor: 'border-[var(--rarity-legendary)]/40',
    defaultDuration: 6000,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function NotificationToast({ notification, onDismiss }: NotificationToastProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef<number>(Date.now());
  const pausedTimeRef = useRef<number>(0);
  const prefersReducedMotion = useReducedMotion();

  const config = SEVERITY_CONFIG[notification.severity];
  const duration = notification.duration ?? config.defaultDuration;
  const noAutoDismiss = duration === 0;

  const pause = useCallback(() => {
    if (noAutoDismiss) return;
    setIsPaused(true);
    pausedTimeRef.current = Date.now();
  }, [noAutoDismiss]);

  const resume = useCallback(() => {
    if (noAutoDismiss) return;
    const elapsed = Date.now() - pausedTimeRef.current;
    setIsPaused(false);
    startTimeRef.current += elapsed;
  }, [noAutoDismiss]);

  const handleDismiss = useCallback(() => {
    onDismiss(notification.id);
  }, [onDismiss, notification.id]);

  // Auto-dismiss timer
  useEffect(() => {
    if (noAutoDismiss || isPaused) return;

    const checkTimeout = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, duration - elapsed);
      const progressPercent = (remaining / duration) * 100;
      setProgress(progressPercent);

      if (remaining === 0) {
        handleDismiss();
      }
    }, 50);

    return () => clearInterval(checkTimeout);
  }, [noAutoDismiss, isPaused, duration, handleDismiss]);

  return (
    <motion.div
      className={cn(
        'w-full sm:w-96 rounded-lg border shadow-lg overflow-hidden',
        config.bgColor,
        config.borderColor
      )}
      variants={toastVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      role="alert"
      aria-live={notification.severity === 'error' ? 'assertive' : 'polite'}
      aria-label={`${notification.severity}: ${notification.title}`}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className={cn('flex-shrink-0', config.color)} aria-hidden="true">
          {notification.icon || config.icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] font-rajdhani tracking-wide">
            {notification.title}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
            {notification.message}
          </p>

          {/* Action Button */}
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className={cn(
                'mt-3 text-xs font-medium px-3 py-1.5 rounded transition-colors',
                notification.action.variant === 'primary'
                  ? 'bg-[var(--clay-orange)] text-[var(--text-primary)] hover:bg-[var(--clay-orange)]/80'
                  : 'bg-[var(--soil-medium)] text-[var(--text-secondary)] hover:bg-[var(--soil-light)]'
              )}
            >
              {notification.action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className={cn(
            'flex-shrink-0 p-1 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--clay-orange)]',
            config.color,
            'hover:bg-[var(--soil-medium)]/50'
          )}
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar (only for auto-dismissing toasts) */}
      {!noAutoDismiss && (
        <div className="h-1 bg-[var(--soil-deep)]/50">
          <motion.div
            className={cn('h-full rounded-full', config.color.replace('text-', 'bg-'))}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: 'linear' }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Dismissal timer"
          />
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// NOTIFICATION QUEUE MANAGER
// ============================================================================

interface UseNotificationQueueReturn {
  notifications: NotificationData[];
  addNotification: (notification: Omit<NotificationData, 'id'>) => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
}

export function useNotificationQueue(): UseNotificationQueueReturn {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const notificationIdRef = useRef(0);

  const addNotification = useCallback((notification: Omit<NotificationData, 'id'>) => {
    const id = `notification-${Date.now()}-${notificationIdRef.current++}`;
    setNotifications(prev => [...prev, { ...notification, id }]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods for different severity levels
  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAll,
  };
}

// ============================================================================
// NOTIFICATION CONTAINER
// ============================================================================

interface NotificationContainerProps {
  notifications: NotificationData[];
  onDismiss: (id: string) => void;
}

export function NotificationContainer({ notifications, onDismiss }: NotificationContainerProps) {
  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-h-[80vh] overflow-y-auto"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      <AnimatePresence>
        {notifications.map(notification => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// ERROR MESSAGE TEMPLATES
// ============================================================================

export const ERROR_TEMPLATES = {
  audioTestFailed: {
    title: 'Audio Test Failed',
    message: 'Could not play test sound. Check your browser permissions, ensure volume is not muted, and try again.',
    severity: 'error' as NotificationSeverity,
    action: { label: 'Retry', onClick: () => window.location.reload() },
  },
  saveFailed: {
    title: 'Save Failed',
    message: 'Unable to save your progress. Your game data may be corrupted. Consider exporting your save as a backup.',
    severity: 'error' as NotificationSeverity,
    action: { label: 'Export Save', onClick: () => {} }, // Will be wired by caller
  },
  loadFailed: {
    title: 'Load Failed',
    message: 'Could not load save file. The file may be corrupted or from an incompatible version.',
    severity: 'error' as NotificationSeverity,
  },
  rateLimited: {
    title: 'Too Many Commands',
    message: 'Commands are being processed. Please wait a moment before entering more commands.',
    severity: 'warning' as NotificationSeverity,
    duration: 3000,
  },
  audioFallback: {
    title: 'Using Procedural Audio',
    message: 'ElevenLabs API unavailable. Using generated audio instead. Import your API key in settings for full experience.',
    severity: 'info' as NotificationSeverity,
    duration: 6000,
  },
  storageLow: {
    title: 'Storage Space Low',
    message: 'Your browser storage is nearly full. Consider exporting and clearing old saves to free up space.',
    severity: 'warning' as NotificationSeverity,
    action: { label: 'Manage Saves', onClick: () => {} },
  },
} as const;
