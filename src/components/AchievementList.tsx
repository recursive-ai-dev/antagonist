/**
 * Achievement List Component
 * 
 * Features:
 * - Persistent achievement tracking view
 * - Filter by category and unlock status
 * - Progress tracking for hidden achievements
 * - Sort by rarity, unlock date, or name
 * - Export completion status
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Star,
  Lock,
  Unlock,
  Filter,
  SortAsc,
  Download,
  X,
  Search,
  ChevronDown
} from 'lucide-react';
import { Achievement, ACHIEVEMENTS } from '../types/game';
import { Modal, Button, Badge, ProgressBar } from './ui';
import { cn } from '@/utils/cn';
import { cardVariants } from '@/utils/motionPresets';

// ============================================================================
// TYPES
// ============================================================================

type AchievementCategory = 'all' | 'exploration' | 'dialogue' | 'collection' | 'story' | 'special';
type AchievementFilter = 'all' | 'unlocked' | 'locked';
type AchievementSort = 'name' | 'rarity' | 'unlockDate' | 'category';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CATEGORY_CONFIG: Record<AchievementCategory, {
  label: string;
  icon: React.ReactNode;
  color: string;
}> = {
  all: { label: 'All', icon: <Trophy className="w-4 h-4" />, color: 'text-[var(--text-secondary)]' },
  exploration: { label: 'Exploration', icon: <Star className="w-4 h-4" />, color: 'text-blue-400' },
  dialogue: { label: 'Dialogue', icon: <Unlock className="w-4 h-4" />, color: 'text-purple-400' },
  collection: { label: 'Collection', icon: <Trophy className="w-4 h-4" />, color: 'text-green-400' },
  story: { label: 'Story', icon: <Star className="w-4 h-4" />, color: 'text-yellow-400' },
  special: { label: 'Special', icon: <Lock className="w-4 h-4" />, color: 'text-red-400' },
};

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

const RARITY_CONFIG: Record<Achievement['rarity'], {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  common: {
    label: 'Common',
    color: 'text-gray-400',
    bgColor: 'bg-gray-900/20',
    borderColor: 'border-gray-500/30',
  },
  uncommon: {
    label: 'Uncommon',
    color: 'text-green-400',
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-500/30',
  },
  rare: {
    label: 'Rare',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-500/30',
  },
  epic: {
    label: 'Epic',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/20',
    borderColor: 'border-purple-500/30',
  },
  legendary: {
    label: 'Legendary',
    color: 'text-[var(--rarity-legendary)]',
    bgColor: 'bg-[var(--rarity-legendary)]/10',
    borderColor: 'border-[var(--rarity-legendary)]/40',
  },
};

// ============================================================================
// COMPONENTS
// ============================================================================

interface AchievementCardProps {
  achievement: Achievement;
  showProgress: boolean;
}

function AchievementCard({ achievement, showProgress }: AchievementCardProps) {
  const rarityConfig = RARITY_CONFIG[achievement.rarity];
  const isUnlocked = achievement.unlocked;
  const hasProgress = achievement.progress !== undefined && achievement.maxProgress !== undefined;
  const progressPercent = hasProgress ? (achievement.progress / achievement.maxProgress) * 100 : 0;

  return (
    <motion.div
      className={cn(
        'rounded-lg border p-4 transition-all',
        isUnlocked
          ? cn(rarityConfig.bgColor, rarityConfig.borderColor)
          : 'bg-[var(--soil-deep)]/50 border-[var(--border-subtle)] opacity-70'
      )}
      variants={cardVariants}
      initial="idle"
      whileHover="hover"
      role="listitem"
      aria-label={`${achievement.name} - ${isUnlocked ? 'Unlocked' : 'Locked'}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0',
            isUnlocked ? 'bg-[var(--soil-medium)]' : 'bg-[var(--soil-deep)] grayscale'
          )}
          aria-hidden="true"
        >
          {achievement.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cn(
              'font-semibold font-rajdhani tracking-wide',
              isUnlocked ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
            )}>
              {achievement.name}
            </h3>
            {isUnlocked && (
              <Badge variant={achievement.rarity} size="sm">
                {achievement.rarity}
              </Badge>
            )}
            {achievement.hidden && !isUnlocked && (
              <Badge variant="default" size="sm">
                <Lock className="w-3 h-3" />
                Hidden
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className={cn(
            'text-sm leading-relaxed',
            isUnlocked ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)]'
          )}>
            {isUnlocked || !achievement.hidden ? achievement.description : '??????????'}
          </p>

          {/* Progress Bar */}
          {hasProgress && !isUnlocked && showProgress && (
            <div className="mt-3">
              <ProgressBar
                value={achievement.progress}
                max={achievement.maxProgress}
                variant="default"
                showValue
                size="sm"
              />
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                {achievement.progress}/{achievement.maxProgress} complete
              </p>
            </div>
          )}

          {/* Unlock Date */}
          {isUnlocked && achievement.unlockDate && (
            <p className="text-xs text-[var(--text-tertiary)] mt-2">
              Unlocked {new Date(achievement.unlockDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface AchievementListModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
}

export function AchievementListModal({ isOpen, onClose, achievements }: AchievementListModalProps) {
  const [category, setCategory] = useState<AchievementCategory>('all');
  const [filter, setFilter] = useState<AchievementFilter>('all');
  const [sort, setSort] = useState<AchievementSort>('category');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProgress, setShowProgress] = useState(true);

  // Filter and sort achievements
  const filteredAchievements = useMemo(() => {
    let result = [...achievements];

    // Category filter
    if (category !== 'all') {
      result = result.filter(a => a.category === category);
    }

    // Unlock status filter
    if (filter === 'unlocked') {
      result = result.filter(a => a.unlocked);
    } else if (filter === 'locked') {
      result = result.filter(a => !a.unlocked);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rarity':
          return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
        case 'unlockDate':
          if (!a.unlockDate && !b.unlockDate) return 0;
          if (!a.unlockDate) return 1;
          if (!b.unlockDate) return -1;
          return b.unlockDate - a.unlockDate;
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    return result;
  }, [achievements, category, filter, sort, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = achievements.length;
    const unlocked = achievements.filter(a => a.unlocked).length;
    const percentage = Math.round((unlocked / total) * 100);

    const byRarity = {
      common: achievements.filter(a => a.rarity === 'common' && a.unlocked).length,
      uncommon: achievements.filter(a => a.rarity === 'uncommon' && a.unlocked).length,
      rare: achievements.filter(a => a.rarity === 'rare' && a.unlocked).length,
      epic: achievements.filter(a => a.rarity === 'epic' && a.unlocked).length,
      legendary: achievements.filter(a => a.rarity === 'legendary' && a.unlocked).length,
    };

    return { total, unlocked, percentage, byRarity };
  }, [achievements]);

  // Export completion status
  const handleExport = useCallback(() => {
    const exportData = {
      timestamp: Date.now(),
      totalAchievements: stats.total,
      unlockedAchievements: stats.unlocked,
      completionPercentage: stats.percentage,
      achievements: achievements.map(a => ({
        id: a.id,
        name: a.name,
        unlocked: a.unlocked,
        unlockDate: a.unlockDate,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `antagonist-achievements-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [achievements, stats]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Achievements"
      size="xl"
      showClose
    >
      <div className="space-y-6">
        {/* Statistics Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="text-center p-3 bg-[var(--soil-deep)]/50 rounded border border-[var(--border-subtle)]">
            <div className="text-2xl font-bold text-[var(--text-primary)] font-rajdhani">
              {stats.unlocked}/{stats.total}
            </div>
            <div className="text-xs text-[var(--text-tertiary)] mt-1">Unlocked</div>
          </div>
          <div className="text-center p-3 bg-[var(--soil-deep)]/50 rounded border border-[var(--border-subtle)]">
            <div className="text-2xl font-bold text-[var(--text-primary)] font-rajdhani">
              {stats.percentage}%
            </div>
            <div className="text-xs text-[var(--text-tertiary)] mt-1">Complete</div>
          </div>
          <div className="text-center p-3 bg-[var(--rarity-rare)]/10 rounded border border-[var(--rarity-rare)]/30">
            <div className="text-lg font-bold text-[var(--rarity-rare)] font-rajdhani">
              {stats.byRarity.rare}
            </div>
            <div className="text-xs text-[var(--text-tertiary)] mt-1">Rare</div>
          </div>
          <div className="text-center p-3 bg-[var(--rarity-epic)]/10 rounded border border-[var(--rarity-epic)]/30">
            <div className="text-lg font-bold text-[var(--rarity-epic)] font-rajdhani">
              {stats.byRarity.epic}
            </div>
            <div className="text-xs text-[var(--text-tertiary)] mt-1">Epic</div>
          </div>
          <div className="text-center p-3 bg-[var(--rarity-legendary)]/10 rounded border border-[var(--rarity-legendary)]/30">
            <div className="text-lg font-bold text-[var(--rarity-legendary)] font-rajdhani">
              {stats.byRarity.legendary}
            </div>
            <div className="text-xs text-[var(--text-tertiary)] mt-1">Legendary</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--soil-deep)] border border-[var(--border-subtle)] rounded text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--clay-orange)]"
              aria-label="Search achievements"
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-2">
            {/* Category Filter */}
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AchievementCategory)}
                className="appearance-none bg-[var(--soil-medium)] border border-[var(--border-subtle)] rounded px-3 py-2 pr-8 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--clay-orange)] cursor-pointer"
                aria-label="Filter by category"
              >
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
            </div>

            {/* Unlock Status Filter */}
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as AchievementFilter)}
                className="appearance-none bg-[var(--soil-medium)] border border-[var(--border-subtle)] rounded px-3 py-2 pr-8 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--clay-orange)] cursor-pointer"
                aria-label="Filter by unlock status"
              >
                <option value="all">All Status</option>
                <option value="unlocked">Unlocked</option>
                <option value="locked">Locked</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as AchievementSort)}
                className="appearance-none bg-[var(--soil-medium)] border border-[var(--border-subtle)] rounded px-3 py-2 pr-8 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--clay-orange)] cursor-pointer"
                aria-label="Sort achievements"
              >
                <option value="category">Sort: Category</option>
                <option value="name">Sort: Name</option>
                <option value="rarity">Sort: Rarity</option>
                <option value="unlockDate">Sort: Recent</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
            </div>

            {/* Show Progress Toggle */}
            <button
              onClick={() => setShowProgress(!showProgress)}
              className={cn(
                'px-3 py-2 text-sm rounded border transition-colors',
                showProgress
                  ? 'bg-[var(--clay-orange)]/20 border-[var(--clay-orange)]/50 text-[var(--clay-orange)]'
                  : 'bg-[var(--soil-medium)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
              )}
              aria-pressed={showProgress}
            >
              {showProgress ? 'Hiding Progress' : 'Showing Progress'}
            </button>

            {/* Export Button */}
            <Button
              onClick={handleExport}
              variant="secondary"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              className="ml-auto"
            >
              Export
            </Button>
          </div>
        </div>

        {/* Achievement Grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto"
          role="list"
          aria-label="Achievement list"
        >
          {filteredAchievements.length === 0 ? (
            <div className="col-span-full text-center py-12 text-[var(--text-tertiary)]">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No achievements match your filters.</p>
            </div>
          ) : (
            filteredAchievements.map(achievement => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                showProgress={showProgress && !achievement.unlocked}
              />
            ))
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-[var(--border-subtle)]">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
