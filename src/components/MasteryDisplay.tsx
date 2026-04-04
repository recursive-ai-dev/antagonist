/**
 * Mastery Display Component
 *
 * Visibility layer for mastery progression system.
 * Shows track progress, challenges, and available rewards.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Target,
  Zap,
  Award,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  CheckCircle,
  Circle,
  Sparkles
} from 'lucide-react';
import { GameState, MasteryTrack as MasteryTrackType, MasteryRank, MasteryChallenge, MasteryReward } from '../types/game';
import { cn } from '@/utils/cn';
import { expansionVariants, progressFillTransition } from '@/utils/motionPresets';

// ============================================================================
// TYPES
// ============================================================================

interface MasteryDisplayProps {
  gameState: GameState;
  collapsed?: boolean;
  onToggle?: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TRACK_CONFIG: Record<MasteryTrackType, {
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}> = {
  pathfinder: {
    name: 'Pathfinder',
    icon: <Target className="w-4 h-4" />,
    color: 'text-blue-400',
    description: 'Master the art of movement through the colony',
  },
  chaos_dancer: {
    name: 'Chaos Dancer',
    icon: <Zap className="w-4 h-4" />,
    color: 'text-purple-400',
    description: 'Embrace the glitch and dance with reality',
  },
  awakener: {
    name: 'Awakener',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'text-amber-400',
    description: 'Awaken consciousness in the colony',
  },
  specialist: {
    name: 'Specialist',
    icon: <Award className="w-4 h-4" />,
    color: 'text-emerald-400',
    description: 'Specialize in a build archetype',
  },
  flow_state: {
    name: 'Flow State',
    icon: <Trophy className="w-4 h-4" />,
    color: 'text-rose-400',
    description: 'Achieve and maintain flow states',
  },
};

const RANK_CONFIG: Record<MasteryRank, {
  name: string;
  minChallenges: number;
  color: string;
}> = {
  novice: { name: 'Novice', minChallenges: 0, color: 'text-gray-400' },
  adept: { name: 'Adept', minChallenges: 5, color: 'text-green-400' },
  expert: { name: 'Expert', minChallenges: 10, color: 'text-blue-400' },
  master: { name: 'Master', minChallenges: 15, color: 'text-purple-400' },
  legendary: { name: 'Legendary', minChallenges: 20, color: 'text-amber-400' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function MasteryDisplay({
  gameState,
  collapsed = false,
  onToggle
}: MasteryDisplayProps) {
  const [expandedTracks, setExpandedTracks] = useState<Record<MasteryTrackType, boolean>>({
    pathfinder: true,
    chaos_dancer: false,
    awakener: false,
    specialist: false,
    flow_state: false,
  });

  const { masteryState } = gameState;

  const toggleTrack = (track: MasteryTrackType) => {
    setExpandedTracks(prev => ({
      ...prev,
      [track]: !prev[track],
    }));
  };

  // Calculate overall progress
  const totalChallenges = Object.values(masteryState.tracks).reduce(
    (sum, track) => sum + track.challenges.length,
    0
  );
  const completedChallenges = masteryState.challengesCompleted;
  const overallProgress = totalChallenges > 0
    ? (completedChallenges / totalChallenges) * 100
    : 0;

  // Determine current rank
  const currentRank = Object.entries(masteryState.tracks).reduce<MasteryRank>(
    (highestRank, [, track]) => {
      const rankIndex = Object.keys(RANK_CONFIG).indexOf(track.rank);
      const highestIndex = Object.keys(RANK_CONFIG).indexOf(highestRank);
      return rankIndex > highestIndex ? track.rank : highestRank;
    },
    'novice'
  );

  return (
    <div className="mastery-display border-t border-[var(--border-subtle)] bg-[var(--soil-deep)]/50">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-[var(--fungus-glow)]" />
          <div>
            <span className="text-sm font-rajdhani tracking-wider text-[var(--text-primary)]">
              MASTERY TRACKS
            </span>
            <div className="text-xs text-[var(--text-tertiary)]">
              Rank: <span className={RANK_CONFIG[currentRank].color}>{RANK_CONFIG[currentRank].name}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Overall Progress */}
          <div className="text-right">
            <div className="text-xs text-[var(--text-secondary)]">Overall Progress</div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              {completedChallenges}/{totalChallenges} Challenges
            </div>
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
        <div className="p-4">
          {/* Overall Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[var(--text-secondary)]">Mastery Progress</span>
              <span className="text-[var(--text-primary)] font-semibold">
                {overallProgress.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-[var(--soil-deep)] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[var(--fungus-glow)] to-[var(--clay-orange)] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={progressFillTransition}
              />
            </div>
          </div>

          {/* Track Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(Object.keys(TRACK_CONFIG) as MasteryTrackType[]).map((trackId) => {
              const trackState = masteryState.tracks[trackId];
              const config = TRACK_CONFIG[trackId];

              return (
                <TrackSection
                  key={trackId}
                  trackId={trackId}
                  trackState={trackState}
                  config={config}
                  expanded={expandedTracks[trackId]}
                  onToggle={() => toggleTrack(trackId)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TRACK SECTION
// ============================================================================

interface TrackSectionProps {
  trackId: MasteryTrackType;
  trackState: any; // Will be typed properly from masteryState
  config: typeof TRACK_CONFIG[MasteryTrackType];
  expanded: boolean;
  onToggle: () => void;
}

function TrackSection({ trackId, trackState, config, expanded, onToggle }: TrackSectionProps) {
  const trackProgress = trackState.xpToNext > 0
    ? (trackState.xp / trackState.xpToNext) * 100
    : 100;

  const completedChallenges = trackState.challenges.filter(c => c.completed).length;
  const totalChallenges = trackState.challenges.length;

  return (
    <div className="state-section mastery-track border border-[var(--border-subtle)] rounded bg-[var(--soil-medium)]/30">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-sm font-rajdhani tracking-wide"
        aria-expanded={expanded}
        aria-controls={`${trackId}-section-content`}
      >
        <div className="flex items-center gap-2">
          <span className={config.color}>{config.icon}</span>
          <span className="text-[var(--text-primary)]">{config.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-secondary)]">
            {completedChallenges}/{totalChallenges}
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-[var(--text-tertiary)] transition-transform',
              expanded ? 'rotate-180' : ''
            )}
            aria-hidden="true"
          />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            id={`${trackId}-section-content`}
            className="px-3 pb-3 space-y-3"
            variants={expansionVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {/* Track Description */}
            <p className="text-xs text-[var(--text-tertiary)] italic">
              {config.description}
            </p>

            {/* Track XP Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[var(--text-secondary)]">
                  {RANK_CONFIG[trackState.rank].name}
                </span>
                <span className="text-[var(--text-primary)] font-semibold">
                  {trackState.xp}/{trackState.xpToNext} XP
                </span>
              </div>
              <div className="h-1.5 bg-[var(--soil-deep)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: 'var(--fungus-glow)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${trackProgress}%` }}
                  transition={progressFillTransition}
                />
              </div>
            </div>

            {/* Challenges */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Challenges
              </h4>
              {trackState.challenges.map((challenge: MasteryChallenge) => (
                <ChallengeItem
                  key={challenge.id}
                  challenge={challenge}
                  trackColor={config.color}
                />
              ))}
            </div>

            {/* Rewards */}
            {trackState.rewards.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                  Rewards
                </h4>
                {trackState.rewards.map((reward: MasteryReward) => (
                  <RewardItem
                    key={reward.id}
                    reward={reward}
                    trackColor={config.color}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// CHALLENGE ITEM
// ============================================================================

interface ChallengeItemProps {
  challenge: MasteryChallenge;
  trackColor: string;
}

function ChallengeItem({ challenge, trackColor }: ChallengeItemProps) {
  const progress = challenge.maxProgress > 0
    ? (challenge.progress / challenge.maxProgress) * 100
    : 0;

  return (
    <div className={cn(
      'p-2 rounded border text-xs',
      challenge.completed
        ? 'bg-green-900/20 border-green-500/30'
        : 'bg-[var(--soil-deep)]/50 border-[var(--border-subtle)]'
    )}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className={cn(
          'font-medium',
          challenge.completed ? 'text-green-400' : 'text-[var(--text-primary)]'
        )}>
          {challenge.completed && <CheckCircle className="w-3 h-3 inline mr-1" />}
          {challenge.description}
        </span>
      </div>

      {!challenge.completed && challenge.maxProgress > 0 && (
        <>
          <div className="flex items-center justify-between text-xs mb-0.5">
            <span className="text-[var(--text-tertiary)]">Progress</span>
            <span className="text-[var(--text-secondary)]">
              {challenge.progress}/{challenge.maxProgress}
            </span>
          </div>
          <div className="h-1 bg-[var(--soil-deep)] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: 'var(--clay-orange)' }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={progressFillTransition}
            />
          </div>
        </>
      )}

      {challenge.completed && challenge.reward && (
        <div className="text-xs text-green-300 mt-1">
          ✓ Completed - Reward: {challenge.reward}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// REWARD ITEM
// ============================================================================

interface RewardItemProps {
  reward: MasteryReward;
  trackColor: string;
}

function RewardItem({ reward, trackColor }: RewardItemProps) {
  const isUnlocked = reward.unlocked;
  const isClaimed = reward.claimed;

  return (
    <div className={cn(
      'p-2 rounded border text-xs flex items-center gap-2',
      isClaimed
        ? 'bg-amber-900/20 border-amber-500/30'
        : isUnlocked
        ? 'bg-[var(--fungus-glow)]/10 border-[var(--fungus-glow)]/30'
        : 'bg-[var(--soil-deep)]/50 border-[var(--border-subtle)] opacity-60'
    )}>
      <div className={cn(
        'p-1.5 rounded',
        isClaimed ? 'bg-amber-500/20' : isUnlocked ? 'bg-[var(--fungus-glow)]/20' : 'bg-gray-500/20'
      )}>
        {isClaimed ? (
          <Award className={cn('w-3 h-3', trackColor)} />
        ) : isUnlocked ? (
          <Unlock className={cn('w-3 h-3', trackColor)} />
        ) : (
          <Lock className={cn('w-3 h-3', trackColor)} />
        )}
      </div>

      <div className="flex-1">
        <div className="font-medium text-[var(--text-primary)]">
          {reward.name}
        </div>
        <div className="text-xs text-[var(--text-tertiary)]">
          {reward.description}
        </div>
        {isUnlocked && !isClaimed && (
          <div className="text-xs text-[var(--fungus-glow)] mt-1">
            Click to claim
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE (No mastery progress yet)
// ============================================================================

export function MasteryEmptyState() {
  return (
    <div className="text-center py-8 px-4">
      <Trophy className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-3 opacity-50" />
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
        Mastery Awaits
      </h3>
      <p className="text-xs text-[var(--text-tertiary)] max-w-md">
        As you journey through the colony, you'll master different aspects of existence.
        Your actions will be remembered, your skills refined, your legacy written.
      </p>
    </div>
  );
}
