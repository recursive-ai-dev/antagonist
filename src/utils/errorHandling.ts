/**
 * Enhanced Error Handling Utilities
 * 
 * Features:
 * - Structured error messages with recovery actions
 * - Error message registry with templates
 * - Rate limit countdown timer
 * - Error analytics tracking
 */

import { useCallback, useState, useEffect } from 'react';

// ============================================================================
// ERROR MESSAGE TEMPLATES
// ============================================================================

export interface ErrorTemplate {
  title: string;
  message: string;
  recoveryAction?: {
    label: string;
    handler: () => void;
  };
  severity: 'warning' | 'error' | 'critical';
  logToConsole?: boolean;
}

export const ERROR_TEMPLATES: Record<string, ErrorTemplate> = {
  // Audio Errors
  AUDIO_TEST_FAILED: {
    title: 'Audio Test Failed',
    message: 'Could not play test sound. Check your browser permissions, ensure volume is not muted, and try again.',
    recoveryAction: {
      label: 'Check Browser Settings',
      handler: () => {
        window.open('https://support.google.com/chrome/answer/114662', '_blank');
      },
    },
    severity: 'error',
    logToConsole: true,
  },
  AUDIO_INIT_FAILED: {
    title: 'Audio Initialization Failed',
    message: 'Could not initialize audio system. Click anywhere on the page to enable audio, then try again.',
    recoveryAction: {
      label: 'Enable Audio',
      handler: () => {
        // Trigger audio context resume
        const audio = (window as any).audioEngine;
        if (audio?.audioContext?.state === 'suspended') {
          audio.audioContext.resume();
        }
      },
    },
    severity: 'warning',
    logToConsole: true,
  },
  AUDIO_API_UNAVAILABLE: {
    title: 'Using Procedural Audio',
    message: 'ElevenLabs API unavailable. Using generated audio instead. Add your API key in settings for full experience.',
    severity: 'warning',
    logToConsole: false,
  },

  // Save/Load Errors
  SAVE_FAILED: {
    title: 'Save Failed',
    message: 'Unable to save your progress. Your browser storage may be full or corrupted.',
    recoveryAction: {
      label: 'Export Save',
      handler: () => {
        // Will be wired by caller
      },
    },
    severity: 'critical',
    logToConsole: true,
  },
  LOAD_FAILED: {
    title: 'Load Failed',
    message: 'Could not load save file. The file may be corrupted or from an incompatible version.',
    severity: 'error',
    logToConsole: true,
  },
  SAVE_CORRUPTED: {
    title: 'Save Data Corrupted',
    message: 'Your save file failed integrity checks. This may indicate data corruption. Consider loading a backup.',
    recoveryAction: {
      label: 'Start New Game',
      handler: () => {
        window.location.reload();
      },
    },
    severity: 'critical',
    logToConsole: true,
  },

  // Rate Limiting
  RATE_LIMITED: {
    title: 'Too Many Commands',
    message: 'Commands are being processed. Please wait a moment before entering more commands.',
    severity: 'warning',
    logToConsole: false,
  },
  IMPORT_RATE_LIMITED: {
    title: 'Import Rate Limited',
    message: 'Please wait a moment before importing another save file.',
    severity: 'warning',
    logToConsole: false,
  },

  // Storage Errors
  STORAGE_FULL: {
    title: 'Storage Space Full',
    message: 'Your browser storage is full. Auto-save has been disabled. Export and clear old saves to continue.',
    recoveryAction: {
      label: 'Manage Storage',
      handler: () => {
        // Will be wired by caller
      },
    },
    severity: 'critical',
    logToConsole: true,
  },
  STORAGE_QUOTA_EXCEEDED: {
    title: 'Storage Quota Exceeded',
    message: 'The operation exceeded your browser storage quota.',
    severity: 'error',
    logToConsole: true,
  },

  // Network/API Errors
  API_UNAVAILABLE: {
    title: 'Service Unavailable',
    message: 'Could not connect to the service. Please check your internet connection and try again.',
    recoveryAction: {
      label: 'Retry',
      handler: () => {
        window.location.reload();
      },
    },
    severity: 'error',
    logToConsole: true,
  },
  API_RATE_LIMITED: {
    title: 'API Rate Limited',
    message: 'Too many requests. Please wait a moment before trying again.',
    severity: 'warning',
    logToConsole: true,
  },

  // Unknown Errors
  UNKNOWN_ERROR: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Try refreshing the page or starting a new game.',
    recoveryAction: {
      label: 'Refresh Page',
      handler: () => {
        window.location.reload();
      },
    },
    severity: 'error',
    logToConsole: true,
  },
};

// ============================================================================
// ERROR TRACKING HOOK
// ============================================================================

interface ErrorAnalytics {
  action: string;
  result: 'success' | 'blocked' | 'error';
  riskScore: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

const ERROR_HISTORY: ErrorAnalytics[] = [];
const MAX_HISTORY = 100;

export function useErrorHandler() {
  const [recentErrors, setRecentErrors] = useState<ErrorAnalytics[]>([]);

  const logError = useCallback((error: ErrorAnalytics) => {
    const errorWithTimestamp = { ...error, timestamp: Date.now() };
    ERROR_HISTORY.push(errorWithTimestamp);

    // Trim history
    if (ERROR_HISTORY.length > MAX_HISTORY) {
      ERROR_HISTORY.shift();
    }

    setRecentErrors([...ERROR_HISTORY]);

    // Log to console if configured
    const template = Object.values(ERROR_TEMPLATES).find(t => t.title === error.action);
    if (template?.logToConsole !== false) {
      console.error(`[Error] ${error.action}:`, error.metadata);
    }
  }, []);

  const getErrorTemplate = useCallback((errorKey: string): ErrorTemplate | undefined => {
    return ERROR_TEMPLATES[errorKey];
  }, []);

  const getRecentErrors = useCallback(() => {
    return recentErrors.slice(-10);
  }, [recentErrors]);

  const clearErrorHistory = useCallback(() => {
    ERROR_HISTORY.length = 0;
    setRecentErrors([]);
  }, []);

  return {
    logError,
    getErrorTemplate,
    getRecentErrors,
    clearErrorHistory,
  };
}

// ============================================================================
// RATE LIMIT COUNTDOWN HOOK
// ============================================================================

export function useRateLimitCountdown(rateLimitResetTime: number | null) {
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  useEffect(() => {
    if (!rateLimitResetTime) {
      setSecondsRemaining(0);
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.max(0, rateLimitResetTime - now);
      setSecondsRemaining(Math.ceil(remaining / 1000));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 100);
    return () => clearInterval(interval);
  }, [rateLimitResetTime]);

  const formatCountdown = () => {
    if (secondsRemaining <= 0) return '0s';
    if (secondsRemaining < 60) return `${secondsRemaining}s`;
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return { secondsRemaining, formatCountdown };
}

// ============================================================================
// ERROR BOUNDARY UTILITIES
// ============================================================================

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export function getErrorBoundaryRecoveryAction(error: Error): (() => void) | null {
  // Check for specific error patterns
  if (error.message.includes('localStorage') || error.message.includes('storage')) {
    return () => {
      // Clear localStorage and reload
      localStorage.clear();
      window.location.reload();
    };
  }

  if (error.message.includes('AudioContext') || error.message.includes('audio')) {
    return () => {
      // Disable audio and reload
      localStorage.setItem('ant-sim-audio-disabled', 'true');
      window.location.reload();
    };
  }

  // Default: reload
  return () => {
    window.location.reload();
  };
}

export function getFriendlyErrorMessage(error: Error): string {
  if (error.message.includes('localStorage') || error.message.includes('storage')) {
    return 'Browser storage is unavailable. This may be due to privacy settings or full storage.';
  }

  if (error.message.includes('AudioContext') || error.message.includes('audio')) {
    return 'Audio system encountered an error. The game will continue without sound.';
  }

  if (error.message.includes('fetch') || error.message.includes('network')) {
    return 'Network error. Please check your internet connection.';
  }

  return 'An unexpected error occurred.';
}

// ============================================================================
// ERROR RECOVERY COMPONENT DATA
// ============================================================================

export const ERROR_RECOVERY_OPTIONS = {
  reload: {
    label: 'Refresh Page',
    description: 'Reload the game to attempt recovery',
    action: () => window.location.reload(),
  },
  clearStorage: {
    label: 'Clear Storage',
    description: 'Delete all saved data and start fresh',
    action: () => {
      localStorage.clear();
      window.location.reload();
    },
  },
  exportSave: {
    label: 'Export Save',
    description: 'Download your save file as backup',
    action: () => {
      // Will be wired by caller
    },
  },
  disableAudio: {
    label: 'Disable Audio',
    description: 'Continue without audio features',
    action: () => {
      localStorage.setItem('ant-sim-audio-disabled', 'true');
      window.location.reload();
    },
  },
  startNewGame: {
    label: 'Start New Game',
    description: 'Clear all progress and begin again',
    action: () => {
      localStorage.clear();
      window.location.reload();
    },
  },
} as const;
