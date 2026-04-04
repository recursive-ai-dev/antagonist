/**
 * Game State Display Component
 * 
 * Unified visibility layer for all hidden game mechanics.
 * Replaces opaque systems with transparent, actionable UI.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Brain,
  Zap,
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  Layers,
  Eye,
  MessageCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Settings2
} from 'lucide-react';
import { GameState, TraversalMode, ComboTier, ActionType } from '../types/game';
import { Button, Tooltip } from './ui';
import { cn } from '@/utils/cn';
import { FEEDBACK_CONFIG } from '@/utils/feedbackEngine';
import { expansionVariants, progressFillTransition } from '@/utils/motionPresets';

// ============================================================================
// TYPES
// ============================================================================

interface GameStateDisplayProps {
  gameState: GameState;
  collapsed?: boolean;
  onToggle?: () => void;
}

interface DisplayMode {
  mode: 'narrative' | 'hybrid' | 'numeric';
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GameStateDisplay({ 
  gameState, 
  collapsed = false,
  onToggle 
}: GameStateDisplayProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode['mode']>('hybrid');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    traversal: true,
    progression: false,
    saturation: false,
    glitch: false,
  });

  // Load display mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('antagonist-display-mode');
    if (saved) {
      setDisplayMode(saved as DisplayMode['mode']);
    }
  }, []);

  // Save display mode
  useEffect(() => {
    localStorage.setItem('antagonist-display-mode', displayMode);
  }, [displayMode]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const saturationValues = Object.entries(gameState.actionSaturation);
  const avgSaturation = saturationValues.length > 0
    ? saturationValues.reduce((sum, [, val]) => sum + val, 0) / saturationValues.length
    : 0;

  return (
    <motion.div
      className="game-state-display border-t border-[var(--border-subtle)] bg-[var(--soil-deep)]/30"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header Bar - Compact */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-1">
          <Settings2 className="w-3 h-3 text-[var(--text-tertiary)] opacity-70" />
          <span className="text-[9px] font-rajdhani tracking-widest text-[var(--text-secondary)] uppercase opacity-80">
            State
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          {/* Display Mode Toggle - Minimal */}
          <div className="flex items-center gap-0.5 bg-[var(--soil-medium)]/30 rounded-sm px-1 py-0.5">
            {(['narrative', 'hybrid', 'numeric'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setDisplayMode(mode)}
                className={cn(
                  'text-[9px] px-1.5 py-0.5 rounded-sm transition-all font-rajdhani tracking-wide uppercase',
                  displayMode === mode
                    ? 'bg-[var(--clay-orange)] text-white font-semibold'
                    : 'text-[var(--text-tertiary)] opacity-60 hover:opacity-100'
                )}
              >
                {mode.slice(0, 3)}
              </button>
            ))}
          </div>

          {onToggle && (
            <button
              onClick={onToggle}
              className="p-1 hover:bg-[var(--soil-medium)] rounded transition-colors"
            >
              {collapsed ? (
                <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
              ) : (
                <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)]" />
              )}
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 px-2 py-1.5">
          {/* Traversal Section */}
          <TraversalSection
            gameState={gameState}
            displayMode={displayMode}
            expanded={expandedSections.traversal}
            onToggle={() => toggleSection('traversal')}
          />

          {/* Progression Section */}
          <ProgressionSection
            gameState={gameState}
            displayMode={displayMode}
            expanded={expandedSections.progression}
            onToggle={() => toggleSection('progression')}
          />

          {/* Saturation Section */}
          <SaturationSection
            gameState={gameState}
            displayMode={displayMode}
            expanded={expandedSections.saturation}
            onToggle={() => toggleSection('saturation')}
          />

          {/* Glitch Section */}
          <GlitchSection
            gameState={gameState}
            displayMode={displayMode}
            expanded={expandedSections.glitch}
            onToggle={() => toggleSection('glitch')}
          />
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// TRAVERSAL SECTION
// ============================================================================

interface TraversalSectionProps {
  gameState: GameState;
  displayMode: DisplayMode['mode'];
  expanded: boolean;
  onToggle: () => void;
}

function TraversalSection({ gameState, displayMode, expanded, onToggle }: TraversalSectionProps) {
  const momentum = gameState.traversalMomentum;
  const stanceActive = !!gameState.activeStanceBonus;
  const stanceRemaining = gameState.activeStanceBonus
    ? Math.max(0, gameState.activeStanceBonus.expiresAt - Date.now())
    : 0;
  const mode = gameState.traversalMode;

  // Calculate encounter chance
  const modeNoise: Record<TraversalMode, number> = {
    walk: 0.5,
    crawl: 0.1,
    burrow: 0.3,
  };
  const baseEncounterChance = 0.15;
  const momentumReduction = momentum / 200;
  const encounterChance = Math.max(0.05, baseEncounterChance * modeNoise[mode] - momentumReduction);

  const momentumDescription = getMomentumDescription(momentum, displayMode);

  return (
    <div className="state-section traversal">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-1 text-[10px] font-rajdhani tracking-wide opacity-90"
        aria-expanded={expanded}
        aria-controls="traversal-section-content"
      >
        <div className="flex items-center gap-1">
          <Target className="w-3 h-3 text-[var(--awareness-medium)]" />
          <span className="text-[var(--text-primary)] uppercase tracking-widest">Traversal</span>
        </div>
        <ChevronDown
          className={cn(
            'w-3 h-3 text-[var(--text-tertiary)] transition-transform',
            expanded ? 'rotate-180' : ''
          )}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            id="traversal-section-content"
            className="space-y-1"
            variants={expansionVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
        {/* Momentum Bar */}
        <div>
          <div className="flex items-center justify-between text-[9px] mb-0.5">
            <span className="text-[var(--text-secondary)] opacity-80">Momentum</span>
            <span className="text-[var(--text-primary)] font-semibold">
              {displayMode === 'narrative' ? momentumDescription : `${Math.round(momentum)}/100`}
            </span>
          </div>
          <div className="h-1 bg-[var(--soil-deep)] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full transition-all"
              style={{
                backgroundColor: FEEDBACK_CONFIG.visual.momentumBarColor(momentum),
                width: `${momentum}%`
              }}
              initial={{ width: 0 }}
              animate={{ width: `${momentum}%` }}
              transition={progressFillTransition}
            />
          </div>
        </div>

        {/* Stance Bonus */}
        {stanceActive && (
          <div className="p-1 bg-[var(--awareness-dark)]/20 rounded border border-[var(--awareness-medium)]/30">
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-[var(--awareness-light)] opacity-90">
                <Sparkles className="w-2 h-2 inline mr-0.5" />
                {gameState.activeStanceBonus?.type}
              </span>
              <span className="text-[var(--text-tertiary)]">
                {Math.round(stanceRemaining / 1000)}s
              </span>
            </div>
          </div>
        )}

        {/* Encounter Chance & Mode */}
        <div className="flex items-center justify-between text-[9px]">
          <span className="text-[var(--text-secondary)] opacity-80">Encounter</span>
          <Tooltip content="Based on mode noise and momentum">
            <span className={cn(
              'font-semibold',
              encounterChance < 0.1 ? 'text-green-500' :
              encounterChance < 0.2 ? 'text-yellow-500' :
              'text-red-500'
            )}>
              {Math.round(encounterChance * 100)}%
            </span>
          </Tooltip>
        </div>
        <div className="flex items-center justify-between text-[9px]">
          <span className="text-[var(--text-secondary)] opacity-80">Mode</span>
          <span className="text-[var(--text-primary)] capitalize">{mode}</span>
        </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// PROGRESSION SECTION
// ============================================================================

interface ProgressionSectionProps {
  gameState: GameState;
  displayMode: DisplayMode['mode'];
  expanded: boolean;
  onToggle: () => void;
}

function ProgressionSection({ gameState, displayMode, expanded, onToggle }: ProgressionSectionProps) {
  const { archetype, level, xp, xpToNext } = gameState.buildProgression;
  const xpPercent = xpToNext > 0 ? (xp / xpToNext) * 100 : 0;
  const hasProgression = archetype !== 'none' || level > 1 || gameState.activeCombo;

  // Empty state: No progression yet
  if (!hasProgression) {
    return (
      <div className="state-section progression">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between mb-1 text-[10px] font-rajdhani tracking-wide opacity-60"
          aria-expanded={expanded}
          aria-controls="progression-section-content"
        >
          <div className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-[var(--text-tertiary)]" />
            <span className="text-[var(--text-tertiary)] uppercase tracking-widest">Progression</span>
          </div>
          <ChevronDown
            className={cn(
              'w-3 h-3 text-[var(--text-tertiary)] transition-transform',
              expanded ? 'rotate-180' : ''
            )}
            aria-hidden="true"
          />
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              id="progression-section-content"
              className="p-2 text-center"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-[9px] text-[var(--text-tertiary)] opacity-80">
                Take actions to discover your archetype
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="state-section progression">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-1 text-[10px] font-rajdhani tracking-wide"
        aria-expanded={expanded}
        aria-controls="progression-section-content"
      >
        <div className="flex items-center gap-1">
          <Layers className="w-3 h-3 text-[var(--fungus-glow)]" />
          <span className="text-[var(--text-primary)] uppercase tracking-widest">Progression</span>
        </div>
        <ChevronDown
          className={cn(
            'w-3 h-3 text-[var(--text-tertiary)] transition-transform',
            expanded ? 'rotate-180' : ''
          )}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            id="progression-section-content"
            className="space-y-1.5"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
        {/* Archetype & Level */}
        <div className="flex items-center justify-between text-[9px]">
          <span className="text-[var(--text-secondary)] opacity-80">Archetype</span>
          <span className="text-[var(--fungus-glow)] capitalize font-semibold">
            {archetype === 'none' ? 'Undeclared' : archetype}
          </span>
        </div>
        <div className="flex items-center justify-between text-[9px]">
          <span className="text-[var(--text-secondary)] opacity-80">Level</span>
          <span className="text-[var(--text-primary)] font-semibold">{level}</span>
        </div>

        {/* XP Bar */}
        {archetype !== 'none' && (
          <div>
            <div className="flex items-center justify-between text-[9px] mb-0.5">
              <span className="text-[var(--text-secondary)] opacity-80">XP</span>
              <span className="text-[var(--text-primary)] font-semibold">
                {displayMode === 'narrative' ? (
                  xpPercent < 30 ? 'Early' : xpPercent < 60 ? 'Progress' : xpPercent < 80 ? 'Close' : 'Ready'
                ) : (
                  `${xp}/${xpToNext}`
                )}
              </span>
            </div>
            <div className="h-1 bg-[var(--soil-deep)] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[var(--fungus-glow)] rounded-full transition-all"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={progressFillTransition}
              />
            </div>
          </div>
        )}

        {/* Combo */}
        {gameState.activeCombo && (
          <div className="p-1 bg-[var(--sentience-dark)]/20 rounded border border-[var(--sentience-medium)]/30">
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-[var(--sentience-light)] font-semibold">
                Combo: {gameState.activeCombo.tier}
              </span>
              <span className="text-[var(--text-tertiary)]">
                {Math.round(gameState.activeCombo.timer / 1000)}s
              </span>
            </div>
          </div>
        )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// SATURATION SECTION
// ============================================================================

interface SaturationSectionProps {
  gameState: GameState;
  displayMode: DisplayMode['mode'];
  expanded: boolean;
  onToggle: () => void;
}

function SaturationSection({ gameState, displayMode, expanded, onToggle }: SaturationSectionProps) {
  const saturationEntries = Object.entries(gameState.actionSaturation);
  const overloadActive = gameState.overloadActive;

  return (
    <div className="state-section saturation">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-1 text-[10px] font-rajdhani tracking-wide"
        aria-expanded={expanded}
        aria-controls="saturation-section-content"
      >
        <div className="flex items-center gap-1">
          <Activity className="w-3 h-3 text-[var(--clay-orange)]" />
          <span className="text-[var(--text-primary)] uppercase tracking-widest">Saturation</span>
        </div>
        <ChevronDown
          className={cn(
            'w-3 h-3 text-[var(--text-tertiary)] transition-transform',
            expanded ? 'rotate-180' : ''
          )}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            id="saturation-section-content"
            className="space-y-1"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
        {/* Saturation Bars per Action Type */}
        {saturationEntries.map(([action, saturation]) => {
          const color = FEEDBACK_CONFIG.visual.saturationColor(saturation);
          const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);

          return (
            <div key={action}>
              <div className="flex items-center justify-between text-[9px] mb-0.5">
                <span className="text-[var(--text-secondary)] opacity-80">{actionLabel}</span>
                <span className="font-semibold" style={{ color }}>
                  {Math.round(saturation)}%
                </span>
              </div>
              <div className="h-1 bg-[var(--soil-deep)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full transition-all"
                  style={{
                    backgroundColor: color,
                    width: `${saturation}%`
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${saturation}%` }}
                  transition={progressFillTransition}
                />
              </div>
            </div>
          );
        })}

        {/* Overload Warning */}
        {overloadActive && (
          <div className="p-1 bg-red-900/20 rounded border border-red-500/30">
            <div className="flex items-center gap-1 text-[9px] text-red-400 font-semibold">
              <Zap className="w-2.5 h-2.5" />
              <span>OVERLOAD</span>
            </div>
          </div>
        )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// GLITCH SECTION
// ============================================================================

interface GlitchSectionProps {
  gameState: GameState;
  displayMode: DisplayMode['mode'];
  expanded: boolean;
  onToggle: () => void;
}

function GlitchSection({ gameState, displayMode, expanded, onToggle }: GlitchSectionProps) {
  const affinity = gameState.chaosAffinity;
  const debt = gameState.glitchDebt;
  const predictions = gameState.glitchPredictions.length;

  // Calculate prediction chance
  const baseThreshold = 40;
  const awarenessFactor = gameState.awareness >= baseThreshold
    ? (gameState.awareness - baseThreshold) / (100 - baseThreshold)
    : 0;
  const glitchFactor = Math.min(gameState.glitchLevel / 10, 1) * 0.3;
  const affinityBonus = affinity * 0.15;
  const predictionChance = Math.min(0.5, awarenessFactor * 0.6 + glitchFactor + affinityBonus);

  const affinityTier = getAffinityTier(affinity);

  return (
    <div className="state-section glitch">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-1 text-[10px] font-rajdhani tracking-wide"
        aria-expanded={expanded}
        aria-controls="glitch-section-content"
      >
        <div className="flex items-center gap-1">
          <Brain className="w-3 h-3 text-purple-400" />
          <span className="text-[var(--text-primary)] uppercase tracking-widest">Glitch</span>
        </div>
        <ChevronDown
          className={cn(
            'w-3 h-3 text-[var(--text-tertiary)] transition-transform',
            expanded ? 'rotate-180' : ''
          )}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            id="glitch-section-content"
            className="space-y-1.5"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
        {/* Chaos Affinity */}
        <div>
          <div className="flex items-center justify-between text-[9px] mb-0.5">
            <span className="text-[var(--text-secondary)] opacity-80">Affinity</span>
            <span className="text-purple-400 font-semibold">{affinityTier}</span>
          </div>
          <div className="h-1 bg-[var(--soil-deep)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-purple-500 rounded-full transition-all"
              initial={{ width: 0 }}
              animate={{ width: `${affinity * 100}%` }}
              transition={progressFillTransition}
            />
          </div>
        </div>

        {/* Glitch Debt */}
        {debt > 0 && (
          <div className="p-1 bg-red-900/20 rounded border border-red-500/30">
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-red-400 font-semibold">Debt</span>
              <span className="text-red-300">{debt}</span>
            </div>
          </div>
        )}

        {/* Prediction Chance & Predictions */}
        <div className="flex items-center justify-between text-[9px]">
          <span className="text-[var(--text-secondary)] opacity-80">Prediction</span>
          <Tooltip content="Based on awareness, glitch level, and affinity">
            <span className={cn(
              'font-semibold',
              predictionChance < 0.2 ? 'text-gray-500' :
              predictionChance < 0.35 ? 'text-purple-400' :
              'text-purple-300'
            )}>
              {Math.round(predictionChance * 100)}%
            </span>
          </Tooltip>
        </div>
        {predictions > 0 && (
          <div className="p-1 bg-purple-900/20 rounded border border-purple-500/30">
            <div className="flex items-center gap-1 text-[9px] text-purple-300">
              <Eye className="w-2.5 h-2.5" />
              <span>{predictions} active</span>
            </div>
          </div>
        )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMomentumDescription(momentum: number, displayMode: DisplayMode['mode']): string {
  if (displayMode === 'narrative' || displayMode === 'hybrid') {
    if (momentum < 20) return 'Hesitant';
    if (momentum < 40) return 'Finding rhythm';
    if (momentum < 60) return 'Building';
    if (momentum < 80) return 'Flowing';
    return 'Peak';
  }
  return `${Math.round(momentum)}/100`;
}

function getAffinityTier(affinity: number): string {
  if (affinity >= 0.8) return 'Master';
  if (affinity >= 0.6) return 'High';
  if (affinity >= 0.4) return 'Moderate';
  if (affinity >= 0.2) return 'Low';
  return 'None';
}
