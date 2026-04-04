/**
 * Auto-Save Indicator Component
 * 
 * Features:
 * - Visual indicator for auto-save status
 * - Manual save confirmation toast
 * - Storage quota warning
 * - Save integrity checker
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Check, AlertTriangle, HardDrive } from 'lucide-react';
import { cn } from '@/utils/cn';
import { getStorageQuota, isStorageLow, isStorageFull } from '@/utils/saveSystem';
import { useNotificationQueue, NotificationData, ERROR_TEMPLATES } from './NotificationToast';

// ============================================================================
// TYPES
// ============================================================================

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutoSaveIndicatorProps {
  enabled: boolean;
  lastSaveTime?: number;
  onSaveRequest?: () => Promise<boolean>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AutoSaveIndicator({ enabled, lastSaveTime, onSaveRequest }: AutoSaveIndicatorProps) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [nextSaveIn, setNextSaveIn] = useState<number>(0);
  const [storageQuota, setStorageQuota] = useState<{ percentage: number; available: number }>({ percentage: 0, available: 0 });
  const { addNotification } = useNotificationQueue();

  const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes

  // Calculate time until next auto-save
  useEffect(() => {
    if (!enabled || !lastSaveTime) return;

    const updateCountdown = () => {
      const elapsed = Date.now() - lastSaveTime;
      const remaining = Math.max(0, AUTO_SAVE_INTERVAL - elapsed);
      setNextSaveIn(Math.ceil(remaining / 1000));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [enabled, lastSaveTime]);

  // Check storage quota periodically
  useEffect(() => {
    const checkStorage = () => {
      const quota = getStorageQuota();
      setStorageQuota({ percentage: quota.percentage, available: quota.available });

      if (isStorageFull()) {
        addNotification({
          title: 'Storage Full',
          message: 'Browser storage is full. Auto-save disabled. Export and clear old saves.',
          severity: 'error',
          action: { label: 'Manage Saves', onClick: () => {} }, // Will be wired by parent
        });
      } else if (isStorageLow()) {
        addNotification({
          ...ERROR_TEMPLATES.storageLow,
          action: {
            label: 'Manage Saves',
            onClick: () => {}, // Will be wired by parent
          },
        });
      }
    };

    checkStorage();
    const interval = setInterval(checkStorage, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [addNotification]);

  // Show save confirmation
  useEffect(() => {
    if (status === 'saved') {
      const timer = setTimeout(() => {
        setStatus('idle');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Handle manual save request
  const handleManualSave = useCallback(async () => {
    if (!onSaveRequest) return;

    setStatus('saving');
    const success = await onSaveRequest();
    setStatus(success ? 'saved' : 'error');

    if (success) {
      addNotification({
        title: 'Game Saved',
        message: 'Your progress has been saved successfully.',
        severity: 'success',
        duration: 3000,
      });
    } else {
      addNotification(ERROR_TEMPLATES.saveFailed);
    }
  }, [onSaveRequest, addNotification]);

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Storage warning color
  const getStorageColor = () => {
    if (storageQuota.percentage > 95) return 'text-red-400';
    if (storageQuota.percentage > 80) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="flex items-center gap-4">
      {/* Auto-Save Status */}
      <AnimatePresence mode="wait">
        {enabled && (
          <motion.div
            key="auto-save"
            className="flex items-center gap-2 text-sm"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            role="status"
            aria-live="polite"
            aria-label={status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved' : `Next save in ${formatTime(nextSaveIn)}`}
          >
            {status === 'saving' && (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  aria-hidden="true"
                >
                  <Save className="w-4 h-4 text-[var(--clay-orange)]" />
                </motion.div>
                <span className="text-[var(--clay-orange)]">Saving...</span>
              </>
            )}

            {status === 'saved' && (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Saved</span>
              </>
            )}

            {status === 'error' && (
              <>
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-red-400">Save Failed</span>
              </>
            )}

            {status === 'idle' && lastSaveTime && (
              <>
                <Save className="w-4 h-4 text-[var(--text-tertiary)]" />
                <span className="text-[var(--text-tertiary)]">
                  Next save in {formatTime(nextSaveIn)}
                </span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Storage Quota Indicator */}
      <div
        className="flex items-center gap-1.5 text-xs"
        title={`${storageQuota.percentage.toFixed(1)}% storage used`}
      >
        <HardDrive className={cn('w-3.5 h-3.5', getStorageColor())} aria-hidden="true" />
        <span className={cn('font-medium', getStorageColor())}>
          {storageQuota.percentage.toFixed(0)}%
        </span>
      </div>

      {/* Manual Save Button */}
      {onSaveRequest && (
        <button
          onClick={handleManualSave}
          disabled={status === 'saving'}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--clay-orange)]',
            status === 'saving'
              ? 'bg-[var(--soil-medium)] text-[var(--text-tertiary)] cursor-not-allowed'
              : 'bg-[var(--clay-orange)]/20 text-[var(--clay-orange)] hover:bg-[var(--clay-orange)]/30'
          )}
          aria-label="Save game manually"
        >
          Save Now
        </button>
      )}
    </div>
  );
}

// ============================================================================
// SAVE CONFIRMATION TOAST
// ============================================================================

interface SaveConfirmationToastProps {
  isOpen: boolean;
  onClose: () => void;
  saveTime?: number;
  saveSize?: string;
}

export function SaveConfirmationToast({ isOpen, onClose, saveTime, saveSize }: SaveConfirmationToastProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-50"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      role="status"
      aria-live="polite"
    >
      <div className="bg-[var(--success)]/20 border border-[var(--success)]/50 rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Check className="w-5 h-5 text-[var(--success)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Game Saved</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {saveTime ? `Saved at ${new Date(saveTime).toLocaleTimeString()}` : ''}
              {saveSize && ` • ${saveSize}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1 rounded hover:bg-[var(--success)]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--success)]"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-[var(--success)]" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// STORAGE QUOTA WARNING MODAL CONTENT
// ============================================================================

interface StorageWarningContentProps {
  onExport: () => void;
  onClearOldSaves: () => void;
}

export function StorageWarningContent({ onExport, onClearOldSaves }: StorageWarningContentProps) {
  const quota = getStorageQuota();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-yellow-400">
        <AlertTriangle className="w-6 h-6" />
        <h3 className="text-lg font-semibold">Storage Space Low</h3>
      </div>

      <p className="text-sm text-[var(--text-secondary)]">
        Your browser storage is {quota.percentage.toFixed(1)}% full ({(quota.used / 1024 / 1024).toFixed(2)} MB used).
        When storage is full, auto-save will be disabled and you may lose progress.
      </p>

      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--text-primary)]">Recommended actions:</p>
        <ul className="text-sm text-[var(--text-secondary)] space-y-1 list-disc list-inside">
          <li>Export your save as a backup</li>
          <li>Clear old save history if available</li>
          <li>Clear browser data for other sites</li>
        </ul>
      </div>

      <div className="flex gap-3 pt-4 border-t border-[var(--border-subtle)]">
        <button
          onClick={onExport}
          className="flex-1 px-4 py-2 bg-[var(--clay-orange)] text-[var(--text-primary)] rounded font-medium hover:bg-[var(--clay-orange)]/90 transition-colors"
        >
          Export Save
        </button>
        <button
          onClick={onClearOldSaves}
          className="flex-1 px-4 py-2 bg-[var(--soil-medium)] text-[var(--text-secondary)] rounded font-medium hover:bg-[var(--soil-light)] transition-colors"
        >
          Clear Old Saves
        </button>
      </div>
    </div>
  );
}
