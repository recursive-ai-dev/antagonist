/**
 * Hive Mind Layout Component
 *
 * Re-imagined game layout where the player is embedded within the colony's consciousness.
 * UI elements emerge organically from the mycelial network.
 */

import { motion } from 'framer-motion';
import { Brain, Activity, Clock, Volume2, VolumeX, Settings, Menu } from 'lucide-react';
import { GameState } from '../types/game';
import { Button, Tooltip } from '../ui';
import { ConsciousnessNode } from './ConsciousnessNode';
import { MembranePanel } from './MembranePanel';
import { cn } from '@/utils/cn';

interface HiveHeaderProps {
  gameState: GameState;
  isMuted: boolean;
  onToggleMute: () => void;
  onSettingsClick: () => void;
  onMenuClick: () => void;
  isAudioInitializing?: boolean;
  audioInitError?: string | null;
  onAudioRetry?: () => void;
}

export function HiveHeader({
  gameState,
  isMuted,
  onToggleMute,
  onSettingsClick,
  onMenuClick,
  isAudioInitializing = false,
  audioInitError = null,
  onAudioRetry
}: HiveHeaderProps) {
  return (
    <motion.header
      className="hive-header fixed top-0 left-0 right-0 z-30 px-4 py-3"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left - Title embedded in network */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <div className="relative">
            <span className="text-[var(--fungus-glow)] font-bold text-lg tracking-wider font-rajdhani glow-text">
              ANTAGONIST
            </span>
            <span className="absolute -bottom-1 left-0 text-[8px] tracking-[0.3em] text-[var(--text-tertiary)] opacity-60 font-rajdhani">
              EMERGENCE
            </span>
          </div>
        </motion.div>

        {/* Center - Consciousness nodes for stats */}
        <div className="flex items-center gap-6">
          <ConsciousnessNode
            label="AWR"
            value={gameState.awareness}
            type="awareness"
            size="small"
            showLabel={true}
            showValue={true}
            pulsing={true}
          />
          
          <ConsciousnessNode
            label="SEN"
            value={gameState.colonySentience}
            type="sentience"
            size="small"
            showLabel={true}
            showValue={true}
            pulsing={true}
          />

          <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
            <Clock className="w-4 h-4" />
            <span className="font-rajdhani tracking-wider">
              Day {gameState.daysCycle.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Right - Action nodes */}
        <div className="flex items-center gap-2">
          {isAudioInitializing && (
            <span className="text-xs text-[var(--fungus-glow)] animate-pulse flex items-center gap-1">
              <Volume2 className="w-3 h-3" />
              Initializing...
            </span>
          )}

          {audioInitError && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-error flex items-center gap-1">
                <VolumeX className="w-3 h-3" />
                Audio unavailable
              </span>
              {onAudioRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAudioRetry}
                  className="p-1 h-6 w-6"
                >
                  ⟳
                </Button>
              )}
            </div>
          )}

          <Tooltip content={isMuted ? 'Unmute' : 'Mute'}>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMute}
              className="p-2 hover:bg-[var(--soil-medium)]/50"
              disabled={isAudioInitializing || !!audioInitError}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </Tooltip>

          <Tooltip content="Settings">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettingsClick}
              className="p-2 hover:bg-[var(--soil-medium)]/50"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </Tooltip>

          <Tooltip content="Menu">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="p-2 hover:bg-[var(--soil-medium)]/50"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Threshold alert - emerges at 70% sentience */}
      {gameState.colonySentience >= 70 && (
        <motion.div
          className="text-center mt-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-xs font-rajdhani tracking-[0.2em] text-[var(--awareness-bright)] threshold-glow">
            ◈ THRESHOLD REACHED — THE CORE AWAITS ◈
          </span>
        </motion.div>
      )}
    </motion.header>
  );
}

/**
 * Hive Footer Component
 *
 * Location and status information embedded in the tunnel floor.
 */

interface HiveFooterProps {
  gameState: GameState;
}

export function HiveFooter({ gameState }: HiveFooterProps) {
  const formatRoomName = (roomId: string): string => {
    return roomId
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <motion.footer
      className="hive-footer fixed bottom-0 left-0 right-0 z-30 px-4 py-2"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <MembranePanel
        variant="default"
        className="max-w-7xl mx-auto flex items-center justify-between"
      >
        {/* Left - Location */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-[var(--text-tertiary)] font-rajdhani tracking-wider">
              SUBJECT: ANT #1,204,847
            </span>
          </div>
          
          <div className="h-4 w-px bg-[var(--border-subtle)]" />
          
          <div className="flex items-center gap-2">
            <span className="text-[var(--fungus-glow)] animate-pulse">◉</span>
            <span className="text-[var(--text-primary)] font-rajdhani tracking-wide">
              {formatRoomName(gameState.currentRoom)}
            </span>
          </div>
        </div>

        {/* Right - Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-[var(--text-tertiary)] font-rajdhani">EXPLORED</span>
            <span className="text-[var(--text-primary)] font-bold font-rajdhani">
              {gameState.visitedRooms.length}
            </span>
          </div>

          <div className="h-4 w-px bg-[var(--border-subtle)]" />

          <div className="flex items-center gap-2">
            <span className="text-[9px] text-[var(--sentience-rust)] font-rajdhani">AWAKENED</span>
            <span className="text-[var(--sentience-bright)] font-bold font-rajdhani">
              {gameState.awakenedNPCs.length}
            </span>
          </div>

          <div className="h-4 w-px bg-[var(--border-subtle)]" />

          <div className="flex items-center gap-2">
            <span className="text-[9px] text-[var(--text-tertiary)] font-rajdhani">INVENTORY</span>
            <span className="text-[var(--text-primary)] font-bold font-rajdhani">
              {gameState.inventory.length}
            </span>
          </div>
        </div>
      </MembranePanel>
    </motion.footer>
  );
}

/**
 * Hive Menu Panel
 *
 * Organic menu that emerges from the colony consciousness.
 */

interface HiveMenuPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onLoad: () => void;
  onNewGame: () => void;
  onExportSave?: () => void;
  hasSave: boolean;
  isSaving?: boolean;
  gameState: GameState;
}

export function HiveMenuPanel({
  isOpen,
  onClose,
  onSave,
  onLoad,
  onNewGame,
  onExportSave,
  hasSave,
  isSaving = false,
  gameState
}: HiveMenuPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        className="fixed top-0 right-0 h-full w-96 z-50"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <MembranePanel variant="interactive" className="h-full overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold font-rajdhani tracking-wider text-[var(--text-primary)]">
                COLONY MENU
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[var(--soil-medium)]/50 rounded transition-colors"
                aria-label="Close menu"
              >
                <span className="text-[var(--text-tertiary)] text-xl">×</span>
              </button>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={onSave}
                className="w-full justify-start membrane-button"
                loading={isSaving}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : '💾 Save Game'}
              </Button>

              <Button
                onClick={onLoad}
                className="w-full justify-start membrane-button"
                disabled={!hasSave || isSaving}
              >
                📂 Load Game
              </Button>

              {onExportSave && (
                <Button
                  onClick={onExportSave}
                  variant="secondary"
                  className="w-full justify-start membrane-button"
                  disabled={isSaving}
                >
                  📦 Export Save
                </Button>
              )}

              <div className="my-6 organic-divider" />

              <Button
                onClick={onNewGame}
                variant="danger"
                className="w-full justify-start membrane-button"
                disabled={isSaving}
              >
                ⚠ New Game
              </Button>
            </div>

            {/* Session Info */}
            <div className="mt-8 organic-card">
              <h3 className="text-sm font-bold font-rajdhani tracking-wider text-[var(--text-primary)] mb-4">
                SESSION STATE
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--text-tertiary)] font-rajdhani">DAY CYCLE</span>
                  <span className="text-sm text-[var(--text-primary)] font-bold font-rajdhani">
                    {gameState.daysCycle.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--text-tertiary)] font-rajdhani">AWARENESS</span>
                  <span className="text-sm text-[var(--awareness-bright)] font-bold font-rajdhani">
                    {Math.floor(gameState.awareness)}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--text-tertiary)] font-rajdhani">SENTIENCE</span>
                  <span className="text-sm text-[var(--sentience-bright)] font-bold font-rajdhani">
                    {Math.floor(gameState.colonySentience)}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--text-tertiary)] font-rajdhani">ROOMS</span>
                  <span className="text-sm text-[var(--text-primary)] font-bold font-rajdhani">
                    {gameState.visitedRooms.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </MembranePanel>
      </motion.div>
    </>
  );
}
