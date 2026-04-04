import { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import { motion } from 'framer-motion';
import { useGameEngine } from './hooks/useGameEngine';
import { GameState, OutputLine, GameSettings, DEFAULT_SETTINGS, Achievement, GameEvent } from './types/game';
import { HiveHeader, HiveFooter, HiveMenuPanel } from './components/hive/HiveMindLayout';
import { TerminalOutput } from './components/TerminalOutput';
import { CommandInput, type CommandInputRef } from './components/CommandInput';
import { SettingsModal } from './components/SettingsModal';
import { NotificationToast } from './components/NotificationToast';
import { GameStateDisplay } from './components/GameStateDisplay';
import { MasteryDisplay } from './components/MasteryDisplay';
import { EncounterPreparation, EncounterResolutionDisplay } from './components/EncounterPreparation';
import { Button } from './components/ui';
import { MycelialBackground, GlitchOverlay } from './components/hive';
import { audioEngine } from '@/utils/audio';
import { saveGame, loadGame, saveSettings, loadSettings, hasSave, getStorageQuota, isStorageLow, getSaveSummary, exportSave } from '@/utils/saveSystem';
import { eventBus } from '@/utils/eventBus';
import { achievementSystem } from '@/utils/achievementSystem';
import { cn } from '@/utils/cn';
import { validateCommand, sanitizeHTML, securityAudit } from '@/utils/security';

function App() {
  const { gameState, processCommand, showIntro, updateSettings } = useGameEngine();
  const [hasStarted, setHasStarted] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMasteryOpen, setIsMasteryOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [notification, setNotification] = useState<Achievement | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [audioInitError, setAudioInitError] = useState<string | null>(null);
  const [isAudioInitializing, setIsAudioInitializing] = useState(false);
  const [isEncounterOpen, setIsEncounterOpen] = useState(false);
  const [encounterResolution, setEncounterResolution] = useState<any | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const commandInputRef = useRef<CommandInputRef>(null);
  const lastTickRef = useRef<number>(Date.now());

  // Load saved settings on mount
  useEffect(() => {
    const init = async () => {
      const savedSettings = loadSettings();
      if (savedSettings) {
        setSettings(savedSettings);
        updateSettings(savedSettings);
      }

      // Initialize audio with event bus and track state
      setIsAudioInitializing(true);
      setAudioInitError(null);
      try {
        await audioEngine.initialize(savedSettings || DEFAULT_SETTINGS, eventBus);
        setIsAudioInitializing(false);
        setIsMuted(audioEngine.isMuted());
      } catch (error) {
        console.error('[App] Audio initialization failed:', error);
        setIsAudioInitializing(false);
        setAudioInitError('Audio unavailable. The simulation will continue without sound.');
      }

      // Initialize achievement system with notification callback
      achievementSystem.setOnUnlock((achievement) => {
        if (settings.notifications) {
          setNotification(achievement);
        }
      });

      // Check for saved game
      const savedData = await loadGame();
      if (savedData) {
        console.log('[App] Save found and validated, ready to load on user request');
      }
    };
    init();
  }, []);

  // Apply font size setting
  useEffect(() => {
    const fontSizeClasses = {
      small: 'text-base',
      medium: 'text-lg',
      large: 'text-xl',
      xlarge: 'text-2xl',
    };

    document.documentElement.className = fontSizeClasses[settings.fontSize] || fontSizeClasses.medium;
  }, [settings.fontSize]);

  // Apply high contrast mode
  useEffect(() => {
    if (settings.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [settings.highContrast]);

  // Game tick for time tracking
  useEffect(() => {
    if (!hasStarted) return;
    
    const tickInterval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      
      // Publish tick event
      eventBus.publish({
        type: 'GAME_TICK',
        delta,
      });
    }, 1000);
    
    return () => clearInterval(tickInterval);
  }, [hasStarted]);

  // Auto-save with debouncing
  useEffect(() => {
    if (!settings.autoSave || !hasStarted) return;
    
    const saveInterval = setInterval(() => {
      handleSave();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(saveInterval);
  }, [settings.autoSave, gameState, settings, hasStarted]);

  const handleStart = useCallback(() => {
    showIntro();
    setHasStarted(true);
    audioEngine.resume();
    
    // Publish game start event
    eventBus.publish({
      type: 'GAME_TICK',
      delta: 0,
    });
  }, [showIntro]);

  const handleCommand = useCallback((input: string) => {
    // Validate command for security
    const validation = validateCommand(input);
    if (!validation.valid) {
      securityAudit.log({
        action: 'COMMAND_VALIDATION_FAILED',
        action_result: 'blocked',
        risk_score: 40,
        metadata: { error: validation.error }
      });
      // Process sanitized error through game engine
      processCommand('error');
      return;
    }

    // Use sanitized input
    const sanitizedInput = validation.sanitized;
    processCommand(sanitizedInput);

    // Publish command event for achievement tracking
    eventBus.publish({
      type: 'STATE_CHANGED',
      changes: [],
      timestamp: Date.now(),
      state: gameState,
    } as any);
  }, [processCommand, gameState]);

  const handleDirectionalMove = useCallback((direction: string) => {
    processCommand(direction);
    
    // Publish command event for achievement tracking
    eventBus.publish({
      type: 'STATE_CHANGED',
      changes: [],
      timestamp: Date.now(),
      state: gameState,
    } as any);
  }, [processCommand, gameState]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Check storage quota before saving
      const quota = getStorageQuota();
      if (isStorageLow()) {
        console.warn('[App] Storage is running low:', `${quota.percentage.toFixed(1)}% used`);
      }

      const success = await saveGame(gameState, settings);
      if (success && settings.notifications) {
        const summary = getSaveSummary();
        setNotification({
          id: 'save-notification',
          name: 'Game Saved',
          description: summary
            ? `Day ${summary.day} • ${summary.awareness}% AWR • ${summary.sentience}% SEN • ${summary.size}`
            : 'Progress saved to browser storage. Data persists across sessions.',
          icon: '💾',
          rarity: 'common',
          unlocked: true,
          category: 'special',
        } as unknown as Achievement);
      } else if (!success) {
        // Show detailed error notification
        let errorDescription = 'An unexpected error occurred.';
        if (quota.percentage > 90) {
          errorDescription = `Storage is ${quota.percentage.toFixed(0)}% full. Export your save or clear browser data.`;
        } else if (quota.percentage > 80) {
          errorDescription = 'Storage is running low. Consider exporting your save as backup.';
        } else {
          errorDescription = 'Save failed. Try exporting your save manually or check browser storage permissions.';
        }

        setNotification({
          id: 'save-error-notification',
          name: 'Save Failed',
          description: errorDescription,
          icon: '⚠️',
          rarity: 'common',
          unlocked: true,
          category: 'special',
        } as unknown as Achievement);
      }
    } catch (error) {
      console.error('[App] Save failed:', error);
      if (settings.notifications) {
        const quota = getStorageQuota();
        setNotification({
          id: 'save-error-notification',
          name: 'Save Error',
          description: quota.percentage > 90
            ? `Storage full (${quota.percentage.toFixed(0)}%). Export save or clear browser data.`
            : error instanceof Error ? error.message : 'Unknown error occurred',
          icon: '⚠️',
          rarity: 'common',
          unlocked: true,
          category: 'special',
        } as unknown as Achievement);
      }
    } finally {
      setIsSaving(false);
    }
  }, [gameState, settings]);

  const handleLoad = useCallback(async () => {
    const saved = await loadGame();
    if (saved) {
      setSettings(saved.settings);
      updateSettings(saved.settings);
      audioEngine.updateSettings(saved.settings);
      
      // Publish load event
      eventBus.publish({
        type: 'STATE_CHANGED',
        changes: [],
        timestamp: Date.now(),
        state: saved.gameState as GameState,
      } as any);
      
      securityAudit.log({
        action: 'LOAD_FROM_UI',
        action_result: 'success',
        risk_score: 0,
        metadata: { timestamp: Date.now() }
      });
    }
  }, [updateSettings]);

  const handleSettingsSave = useCallback((newSettings: GameSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    updateSettings(newSettings);
    audioEngine.updateSettings(newSettings);
  }, [updateSettings]);

  const handleToggleMute = useCallback(() => {
    audioEngine.toggleMute();
    setIsMuted(audioEngine.isMuted());
  }, []);

  const handleAudioRetry = useCallback(async () => {
    setAudioInitError(null);
    setIsAudioInitializing(true);
    try {
      const success = await audioEngine.retryInitialize(settings, eventBus);
      setIsAudioInitializing(false);
      if (success) {
        setIsMuted(audioEngine.isMuted());
      } else {
        setAudioInitError('Audio initialization failed. You can try again or continue without sound.');
      }
    } catch (error) {
      console.error('[App] Audio retry failed:', error);
      setIsAudioInitializing(false);
      setAudioInitError('Audio retry failed. The simulation will continue without sound.');
    }
  }, [settings]);

  const handleExportSave = useCallback(() => {
    try {
      const exported = exportSave();
      if (exported) {
        const blob = new Blob([exported], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ant-sim-save-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show success notification
        if (settings.notifications) {
          setNotification({
            id: 'export-save-notification',
            name: 'Save Exported',
            description: 'Save file downloaded. Store it safely for backup or transfer.',
            icon: '📦',
            rarity: 'common',
            unlocked: true,
            category: 'special',
          } as unknown as Achievement);
        }
      } else {
        // No save to export
        if (settings.notifications) {
          setNotification({
            id: 'export-save-error',
            name: 'No Save Found',
            description: 'Save your game first, then export.',
            icon: '⚠️',
            rarity: 'common',
            unlocked: true,
            category: 'special',
          } as unknown as Achievement);
        }
      }
    } catch (error) {
      console.error('[App] Export failed:', error);
      if (settings.notifications) {
        setNotification({
          id: 'export-save-error',
          name: 'Export Failed',
          description: error instanceof Error ? error.message : 'Failed to export save',
          icon: '⚠️',
          rarity: 'common',
          unlocked: true,
          category: 'special',
        } as unknown as Achievement);
      }
    }
  }, [settings]);

  const handleNewGame = useCallback(() => {
    if (confirm('Are you sure you want to start a new game? Your current progress will be lost.')) {
      localStorage.removeItem('ant-sim-save-v1');
      window.location.reload();
    }
  }, []);

  const handleShowMastery = useCallback(() => {
    setIsMenuOpen(false);
    setIsMasteryOpen(true);
  }, []);

  const handleEncounterRiskSelect = useCallback((risk: 'cautious' | 'balanced' | 'aggressive') => {
    // Risk selection is tracked in EncounterPreparation component local state
    console.log('[App] Encounter risk selected:', risk);
  }, []);

  const handleEncounterConfirm = useCallback((risk: 'cautious' | 'balanced' | 'aggressive', choiceIndex: number) => {
    // Trigger encounter resolution through game engine
    // Convert choice index to command string (0 = direct approach)
    const command = choiceIndex.toString();
    console.log('[App] Resolving encounter with risk:', risk, 'choice:', command);
    processCommand(command);
  }, [processCommand]);

  const handleEncounterCancel = useCallback(() => {
    // Cancel encounter and return to normal state
    // For now, just log - the user can type a command to escape or interact differently
    console.log('[App] Encounter cancelled - player must choose or retreat');
  }, []);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      eventBus.clearHistory();
    };
  }, []);

  return (
    <div
      className={cn(
        'min-h-screen h-screen flex flex-col font-mono overflow-hidden',
        'transition-all duration-300'
      )}
      style={{ background: 'var(--soil-dark)' }}
      onClick={() => audioEngine.resume()}
    >
      {/* Mycelial Background - Living neural network */}
      <MycelialBackground
        awareness={gameState.awareness}
        sentience={gameState.colonySentience}
        glitchLevel={gameState.glitchLevel}
      />

      {/* Glitch Overlay - Reality corruption */}
      <GlitchOverlay
        glitchLevel={gameState.glitchLevel}
        intensity={0.5}
        active={gameState.glitchLevel > 0}
      />

      {/* Underground Vignette Overlay */}
      <div className="pointer-events-none fixed inset-0 z-40 underground-vignette" />

      {/* Noise Overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Hive Header - Consciousness nodes for stats */}
        <HiveHeader
          gameState={gameState}
          onMenuClick={() => setIsMenuOpen(true)}
          onSettingsClick={() => setIsSettingsOpen(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isAudioInitializing={isAudioInitializing}
          audioInitError={audioInitError}
          onAudioRetry={handleAudioRetry}
        />

        {/* Terminal Output - Organic membrane container */}
        <div className="flex-1 min-h-0 pt-24 pb-48">
          <TerminalOutput
            outputHistory={gameState.outputHistory}
            autoScroll={!settings.reducedMotion}
            onQuickCommand={handleCommand}
            commandInputRef={commandInputRef}
          />
        </div>

        {/* Game State Display - Visibility Layer */}
        {hasStarted && (
          <div className="pt-2">
            <GameStateDisplay gameState={gameState} />
          </div>
        )}

        {/* Input Area - Bioluminescent command line */}
        <div className="pb-20">
          <CommandInput
            ref={commandInputRef}
            onSubmit={handleCommand}
            commandHistory={gameState.commandHistory}
            disabled={!!gameState.endingReached}
            placeholder={gameState.endingReached ? 'Game ended. Refresh to restart.' : 'Enter command...'}
            onDirectionalMove={handleDirectionalMove}
          />
        </div>

        {/* Hive Footer - Location embedded in tunnel floor */}
        <HiveFooter gameState={gameState} />
      </div>

      {/* Hive Menu Panel - Organic menu */}
      <HiveMenuPanel
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onSave={handleSave}
        onLoad={handleLoad}
        onNewGame={handleNewGame}
        onExportSave={handleExportSave}
        hasSave={hasSave()}
        isSaving={isSaving}
        gameState={gameState}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSettingsSave}
      />

      {/* Mastery Modal */}
      {isMasteryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setIsMasteryOpen(false)}>
          <motion.div
            className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[var(--soil-dark)] border border-[var(--border-subtle)] rounded-lg">
              <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
                <h2 className="text-lg font-bold font-rajdhani tracking-wider text-[var(--text-primary)]">
                  MASTERY TRACKS
                </h2>
                <button
                  onClick={() => setIsMasteryOpen(false)}
                  className="p-1 hover:bg-[var(--soil-medium)] rounded transition-colors"
                  aria-label="Close mastery panel"
                >
                  <svg className="w-5 h-5 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <MasteryDisplay gameState={gameState} collapsed={false} />
            </div>
          </motion.div>
        </div>
      )}

      {/* Encounter Preparation UI */}
      {gameState.currentEncounter && (
        <EncounterPreparation
          encounter={gameState.currentEncounter.encounter}
          isOpen={gameState.currentEncounter.active}
          onRiskSelect={handleEncounterRiskSelect}
          onConfirm={handleEncounterConfirm}
          onCancel={handleEncounterCancel}
          timer={gameState.currentEncounter.timer}
          progress={gameState.currentEncounter.progress}
          tension={gameState.currentEncounter.tension}
        />
      )}

      {/* Encounter Resolution Display */}
      {encounterResolution && (
        <EncounterResolutionDisplay
          resolution={encounterResolution}
          isOpen={!!encounterResolution}
          onClose={() => setEncounterResolution(null)}
        />
      )}

      {/* Notification Toast */}
      {notification && settings.notifications && (
        <NotificationToast
          achievement={notification}
          onDismiss={dismissNotification}
        />
      )}

      {/* Live region for screen reader announcements */}
      <div
        id="achievement-announcer"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only absolute -top-[9999px] left-0"
      />

      {/* Start overlay - shown until user interacts */}
      {!hasStarted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="text-center p-8 max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl font-bold text-[var(--fungus-glow)] mb-3 font-rajdhani tracking-wider">
                ANTAGONIST
              </h1>
              <p className="text-[var(--text-secondary)] text-lg mb-8">EMERGENCE PROTOCOL</p>

              <Button
                onClick={handleStart}
                size="lg"
                className="px-8 py-4 text-lg font-semibold"
              >
                Begin Simulation
              </Button>

              {hasSave() && (
                <div className="mt-4">
                  <Button
                    onClick={async () => {
                      await handleLoad();
                      handleStart();
                    }}
                    variant="secondary"
                    size="lg"
                    className="px-8 py-4 text-lg font-semibold"
                  >
                    Continue
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
