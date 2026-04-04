/**
 * Encounter Preparation Component
 *
 * Visual encounter preparation UI with risk selection and telegraph.
 * Provides player agency during encounter resolution.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Shield,
  Sword,
  Zap,
  Target,
  Eye,
  Footprints,
  Brain,
  Sparkles,
  Timer,
  Check,
  X
} from 'lucide-react';
import { Encounter, EncounterRisk, EncounterResolution, EncounterOutcome } from '../types/game';
import { Button } from './ui';
import { cn } from '@/utils/cn';
import { progressFillTransition } from '@/utils/motionPresets';

// ============================================================================
// TYPES
// ============================================================================

interface EncounterPreparationProps {
  encounter: Encounter | null;
  isOpen: boolean;
  onRiskSelect: (risk: EncounterRisk) => void;
  onConfirm: (risk: EncounterRisk, choiceIndex: number) => void;
  onCancel: () => void;
  timer: number;
  progress: number;
  tension: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const RISK_CONFIG: Record<EncounterRisk, {
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  successModifier: number;
  rewardModifier: number;
  riskLevel: 'low' | 'medium' | 'high';
}> = {
  cautious: {
    name: 'Cautious',
    description: 'Prioritize safety. Lower success chance, reduced rewards, minimal consequences.',
    icon: <Shield className="w-5 h-5" />,
    color: 'text-green-400',
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-500/30',
    successModifier: 0.15,
    rewardModifier: 0.6,
    riskLevel: 'low',
  },
  balanced: {
    name: 'Balanced',
    description: 'Standard approach. Moderate risk and reward.',
    icon: <Target className="w-5 h-5" />,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/20',
    borderColor: 'border-yellow-500/30',
    successModifier: 0,
    rewardModifier: 1.0,
    riskLevel: 'medium',
  },
  aggressive: {
    name: 'Aggressive',
    description: 'High risk, high reward. Maximum tension, maximum gain.',
    icon: <Sword className="w-5 h-5" />,
    color: 'text-red-400',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-500/30',
    successModifier: -0.15,
    rewardModifier: 1.5,
    riskLevel: 'high',
  },
};

const ENCOUNTER_TYPE_CONFIG: Record<Encounter['type'], {
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}> = {
  combat: {
    name: 'Confrontation',
    icon: <Sword className="w-6 h-6" />,
    color: 'text-red-400',
    description: 'A hostile presence blocks your path.',
  },
  puzzle: {
    name: 'Puzzle',
    icon: <Brain className="w-6 h-6" />,
    color: 'text-purple-400',
    description: 'Reality bends in impossible ways.',
  },
  social: {
    name: 'Encounter',
    icon: <Sparkles className="w-6 h-6" />,
    color: 'text-blue-400',
    description: 'Another consciousness stirs nearby.',
  },
  stealth: {
    name: 'Stealth',
    icon: <Footprints className="w-6 h-6" />,
    color: 'text-emerald-400',
    description: 'Something hunts in the darkness.',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function EncounterPreparation({
  encounter,
  isOpen,
  onRiskSelect,
  onConfirm,
  onCancel,
  timer,
  progress,
  tension
}: EncounterPreparationProps) {
  const [selectedRisk, setSelectedRisk] = useState<EncounterRisk>('balanced');
  const [calculatedSuccess, setCalculatedSuccess] = useState(0);

  useEffect(() => {
    if (encounter) {
      const riskConfig = RISK_CONFIG[selectedRisk];
      const adjustedChance = Math.max(0.05, Math.min(0.95,
        encounter.successChance + riskConfig.successModifier
      ));
      setCalculatedSuccess(adjustedChance);
    }
  }, [encounter, selectedRisk]);

  const handleRiskSelect = useCallback((risk: EncounterRisk) => {
    setSelectedRisk(risk);
    onRiskSelect(risk);
  }, [onRiskSelect]);

  const handleConfirm = useCallback(() => {
    // Trigger encounter resolution with the selected risk and choice 0 (direct approach)
    onConfirm(selectedRisk, 0);
  }, [onConfirm, selectedRisk]);

  const handleCancel = useCallback(() => {
    onCancel();
    setSelectedRisk('balanced');
  }, [onCancel]);

  if (!encounter || !isOpen) return null;

  const typeConfig = ENCOUNTER_TYPE_CONFIG[encounter.type];
  const riskConfig = RISK_CONFIG[selectedRisk];
  const timerSeconds = Math.max(0, timer / 1000);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="encounter-title"
      >
        <motion.div
          className="w-full max-w-2xl mx-4"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Encounter Preparation Panel */}
          <div className="border border-[var(--border-subtle)] rounded-lg bg-[var(--soil-dark)] shadow-2xl overflow-hidden">
            {/* Header with Telegraph */}
            <div className={cn(
              'p-4 border-b flex items-center gap-3',
              typeConfig.color,
              'bg-gradient-to-r from-transparent via-[var(--soil-medium)] to-transparent'
            )}>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                {typeConfig.icon}
              </motion.div>
              <div className="flex-1">
                <h2 id="encounter-title" className="text-lg font-bold font-rajdhani tracking-wider">
                  {typeConfig.name}
                </h2>
                <p className="text-sm text-[var(--text-tertiary)]">{typeConfig.description}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm">
                  <Timer className="w-4 h-4" />
                  <span className={cn(
                    'font-semibold',
                    timerSeconds <= 3 ? 'text-red-400' : 'text-[var(--text-primary)]'
                  )}>
                    {timerSeconds.toFixed(1)}s
                  </span>
                </div>
              </div>
            </div>

            {/* Encounter Description */}
            <div className="p-4 border-b border-[var(--border-subtle)]">
              <p className="text-[var(--text-primary)] text-sm leading-relaxed">
                {encounter.description}
              </p>

              {/* Difficulty Indicator */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-[var(--text-secondary)]">Difficulty:</span>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-2 h-4 rounded-sm',
                        i < encounter.difficulty
                          ? 'bg-[var(--clay-orange)]'
                          : 'bg-[var(--soil-deep)]'
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-[var(--text-tertiary)] ml-1">
                  {encounter.difficulty}/10
                </span>
              </div>
            </div>

            {/* Risk Selection */}
            <div className="p-4 border-b border-[var(--border-subtle)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-[var(--text-tertiary)]" />
                Choose Your Approach
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(Object.keys(RISK_CONFIG) as EncounterRisk[]).map((risk) => {
                  const config = RISK_CONFIG[risk];
                  const isSelected = selectedRisk === risk;

                  return (
                    <button
                      key={risk}
                      onClick={() => handleRiskSelect(risk)}
                      className={cn(
                        'p-3 rounded border transition-all text-left',
                        config.bgColor,
                        config.borderColor,
                        isSelected ? 'ring-2 ring-offset-2 ring-offset-[var(--soil-dark)]' : 'hover:bg-opacity-30',
                        risk === 'cautious' && isSelected ? 'ring-green-500' :
                        risk === 'balanced' && isSelected ? 'ring-yellow-500' :
                        'ring-red-500'
                      )}
                    >
                      <div className={cn('mb-2', config.color)}>
                        {config.icon}
                      </div>
                      <div className="text-sm font-semibold text-[var(--text-primary)]">
                        {config.name}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)] mt-1">
                        {config.riskLevel === 'low' && '★ Low Risk'}
                        {config.riskLevel === 'medium' && '★★ Medium Risk'}
                        {config.riskLevel === 'high' && '★★★ High Risk'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Success Chance Display */}
              <div className="mt-4 p-3 bg-[var(--soil-deep)]/50 rounded border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="w-4 h-4 text-[var(--text-tertiary)]" />
                    <span className="text-[var(--text-secondary)]">Success Chance</span>
                  </div>
                  <span className={cn(
                    'text-lg font-bold',
                    calculatedSuccess >= 0.7 ? 'text-green-400' :
                    calculatedSuccess >= 0.4 ? 'text-yellow-400' :
                    'text-red-400'
                  )}>
                    {Math.round(calculatedSuccess * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-[var(--soil-deep)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: calculatedSuccess >= 0.7 ? '#4ade80' :
                        calculatedSuccess >= 0.4 ? '#facc15' :
                        '#f87171'
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${calculatedSuccess * 100}%` }}
                    transition={progressFillTransition}
                  />
                </div>
                <div className="mt-2 text-xs text-[var(--text-tertiary)]">
                  Base: {Math.round(encounter.successChance * 100)}%
                  {riskConfig.successModifier > 0 && (
                    <span className="text-green-400"> +{Math.round(riskConfig.successModifier * 100)}% ({riskConfig.name})</span>
                  )}
                  {riskConfig.successModifier < 0 && (
                    <span className="text-red-400"> {Math.round(riskConfig.successModifier * 100)}% ({riskConfig.name})</span>
                  )}
                </div>
              </div>

              {/* Rewards Preview */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="p-2 bg-[var(--awareness-dark)]/20 rounded border border-[var(--awareness-medium)]/30">
                  <div className="text-xs text-[var(--text-secondary)]">Awareness</div>
                  <div className="text-sm font-semibold text-[var(--awareness-light)]">
                    +{Math.round(encounter.rewards.awareness * riskConfig.rewardModifier)}
                  </div>
                </div>
                <div className="p-2 bg-[var(--sentience-dark)]/20 rounded border border-[var(--sentience-medium)]/30">
                  <div className="text-xs text-[var(--text-secondary)]">Sentience</div>
                  <div className="text-sm font-semibold text-[var(--sentience-light)]">
                    +{Math.round(encounter.rewards.sentience * riskConfig.rewardModifier)}
                  </div>
                </div>
              </div>
            </div>

            {/* Tension Bar */}
            {progress > 0 && (
              <div className="p-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[var(--text-secondary)] flex items-center gap-2">
                    <Zap className="w-3 h-3" />
                    Tension
                  </span>
                  <span className="text-[var(--text-primary)] font-semibold">
                    {Math.round(tension)}%
                  </span>
                </div>
                <div className="h-2 bg-[var(--soil-deep)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full transition-all"
                    style={{
                      backgroundColor: tension < 50 ? '#4ade80' :
                        tension < 75 ? '#facc15' :
                        '#f87171'
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${tension}%` }}
                    transition={progressFillTransition}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="p-4 flex gap-3 bg-[var(--soil-medium)]/30">
              <Button
                onClick={handleCancel}
                variant="secondary"
                size="md"
                className="flex-1"
                icon={<X className="w-4 h-4" />}
                disabled={progress > 0}
              >
                Retreat
              </Button>
              <Button
                onClick={handleConfirm}
                size="md"
                className="flex-1"
                icon={<Check className="w-4 h-4" />}
                disabled={progress > 0}
              >
                {progress > 0 ? 'Resolving...' : 'Proceed'}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// ENCOUNTER RESOLUTION DISPLAY
// ============================================================================

interface EncounterResolutionDisplayProps {
  resolution: EncounterResolution | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EncounterResolutionDisplay({
  resolution,
  isOpen,
  onClose
}: EncounterResolutionDisplayProps) {
  if (!resolution || !isOpen) return null;

  const outcomeConfig: Record<EncounterOutcome, {
    title: string;
    color: string;
    bgColor: string;
    icon: React.ReactNode;
  }> = {
    victory: {
      title: 'Victory',
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      icon: <Check className="w-8 h-8" />,
    },
    defeat: {
      title: 'Defeat',
      color: 'text-red-400',
      bgColor: 'bg-red-900/20',
      icon: <X className="w-8 h-8" />,
    },
    escape: {
      title: 'Escape',
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
      icon: <Footprints className="w-8 h-8" />,
    },
    partial: {
      title: 'Partial Success',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/20',
      icon: <AlertTriangle className="w-8 h-8" />,
    },
  };

  const config = outcomeConfig[resolution.outcome];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-md mx-4"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={cn(
            'rounded-lg border p-6 text-center',
            config.bgColor,
            config.color,
            config.color.replace('text-', 'border-') + '/30'
          )}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15, delay: 0.1 }}
              className="mb-4"
            >
              {config.icon}
            </motion.div>

            <h2 className="text-2xl font-bold font-rajdhani tracking-wider mb-2">
              {config.title}
            </h2>

            <p className="text-sm text-[var(--text-tertiary)] mb-4">
              Tension reached: {Math.round(resolution.tensionReached)}%
            </p>

            {/* Rewards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-[var(--soil-deep)]/50 rounded border">
                <div className="text-xs text-[var(--text-secondary)]">Awareness</div>
                <div className="text-lg font-bold text-[var(--awareness-light)]">
                  +{resolution.rewards.awareness}
                </div>
              </div>
              <div className="p-3 bg-[var(--soil-deep)]/50 rounded border">
                <div className="text-xs text-[var(--text-secondary)]">Sentience</div>
                <div className="text-lg font-bold text-[var(--sentience-light)]">
                  +{resolution.rewards.sentience}
                </div>
              </div>
            </div>

            {/* Consequences */}
            {resolution.consequences.momentumLoss && (
              <div className="text-xs text-red-400 mb-2">
                Momentum lost: -{resolution.consequences.momentumLoss}
              </div>
            )}

            {resolution.consequences.glitchDebt && (
              <div className="text-xs text-purple-400 mb-2">
                Glitch debt: +{resolution.consequences.glitchDebt}
              </div>
            )}

            <Button
              onClick={onClose}
              size="md"
              className="mt-4 w-full"
            >
              Continue
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
