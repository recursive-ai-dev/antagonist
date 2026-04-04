/**
 * Mastery System
 * 
 * Cross-system mastery tracking with mechanical rewards.
 * Provides long-term engagement through skill-based challenges.
 */

import { GameState, TraversalMode, EmbraceMode, BuildArchetype, ComboTier } from '../types/game';

// ============================================================================
// TYPES
// ============================================================================

export interface MasteryTrack {
  id: string;
  name: string;
  description: string;
  progress: number; // 0-100
  challenges: MasteryChallenge[];
  rewards: MasteryReward[];
  completed: boolean;
}

export interface MasteryChallenge {
  id: string;
  description: string;
  requirement: {
    type: 'count' | 'streak' | 'time' | 'combo' | 'threshold';
    target: number;
    timeframe?: 'single_run' | 'session' | 'permanent';
    additional?: Record<string, unknown>;
  };
  completed: boolean;
  progress: number;
  completedAt?: number;
}

export interface MasteryReward {
  type: 'mechanical' | 'cosmetic' | 'narrative';
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  effect?: Record<string, unknown>;
}

export interface MasteryState {
  tracks: Record<string, MasteryTrack>;
  totalPoints: number;
  rank: MasteryRank;
}

export type MasteryRank = 'novice' | 'adept' | 'expert' | 'master' | 'legendary';

// ============================================================================
// MASTERY TRACK DEFINITIONS
// ============================================================================

export const MASTERY_TRACKS: Record<string, Omit<MasteryTrack, 'progress' | 'completed'>> = {
  traversal: {
    id: 'traversal',
    name: 'Pathfinder',
    description: 'Master the art of movement through the colony',
    challenges: [
      {
        id: 'momentum_master',
        description: 'Reach 100 momentum 50 times',
        requirement: { type: 'count', target: 50, timeframe: 'permanent' },
        completed: false,
        progress: 0,
      },
      {
        id: 'stance_dancer',
        description: 'Maintain stance bonus for full 45 seconds',
        requirement: { type: 'time', target: 45000, timeframe: 'single_run' },
        completed: false,
        progress: 0,
      },
      {
        id: 'ghost_walker',
        description: 'Move through 20 rooms without triggering an encounter',
        requirement: { type: 'streak', target: 20, timeframe: 'single_run' },
        completed: false,
        progress: 0,
      },
      {
        id: 'mode_master',
        description: 'Complete a full cycle: walk → crawl → burrow without momentum loss',
        requirement: { 
          type: 'combo', 
          target: 1, 
          timeframe: 'single_run',
          additional: { modes: ['walk', 'crawl', 'burrow'] }
        },
        completed: false,
        progress: 0,
      },
      {
        id: 'silent_runner',
        description: 'Travel 10 rooms in crawl mode without encounters',
        requirement: { type: 'streak', target: 10, timeframe: 'single_run' },
        completed: false,
        progress: 0,
      },
    ],
    rewards: [
      {
        type: 'mechanical',
        id: 'momentum_preservation',
        name: 'Momentum Preservation',
        description: 'Keep 75% momentum on mode switch (Explorer skill baseline)',
        unlocked: false,
        effect: { momentum_retention: 0.75 },
      },
      {
        type: 'mechanical',
        id: 'encounter_immunity',
        name: 'Flow State Immunity',
        description: 'Brief encounter immunity at peak momentum',
        unlocked: false,
        effect: { immunity_duration_ms: 5000 },
      },
      {
        type: 'cosmetic',
        id: 'trail_effect',
        name: 'Momentum Trail',
        description: 'Visual trail effect at high momentum',
        unlocked: false,
      },
    ],
  },

  glitch: {
    id: 'glitch',
    name: 'Chaos Dancer',
    description: 'Dance with reality failures and emerge stronger',
    challenges: [
      {
        id: 'precognitive',
        description: 'Achieve 80% prediction accuracy (minimum 10 predictions)',
        requirement: { type: 'threshold', target: 80, timeframe: 'permanent', additional: { min_predictions: 10 } },
        completed: false,
        progress: 0,
      },
      {
        id: 'debt_walker',
        description: 'Reach 10 glitch debt and survive',
        requirement: { type: 'threshold', target: 10, timeframe: 'single_run' },
        completed: false,
        progress: 0,
      },
      {
        id: 'perfect_prediction',
        description: 'Correctly predict and embrace 5 glitches in a row',
        requirement: { type: 'streak', target: 5, timeframe: 'session' },
        completed: false,
        progress: 0,
      },
      {
        id: 'amplify_master',
        description: 'Successfully use Amplify mode 25 times',
        requirement: { type: 'count', target: 25, timeframe: 'permanent' },
        completed: false,
        progress: 0,
      },
      {
        id: 'redirect_saver',
        description: 'Successfully redirect 10 glitches',
        requirement: { type: 'count', target: 10, timeframe: 'permanent' },
        completed: false,
        progress: 0,
      },
    ],
    rewards: [
      {
        type: 'mechanical',
        id: 'chaos_banking',
        name: 'Chaos Banking',
        description: 'Store up to 3 predictions with reduced decay',
        unlocked: false,
        effect: { max_banked: 3, decay_reduction: 0.5 },
      },
      {
        type: 'mechanical',
        id: 'affinity_boost',
        name: 'Chaos Affinity',
        description: '+10% base prediction chance',
        unlocked: false,
        effect: { prediction_chance_bonus: 0.1 },
      },
      {
        type: 'narrative',
        id: 'glitch_visions',
        name: 'Enhanced Visions',
        description: 'Additional narrative details in glitch predictions',
        unlocked: false,
      },
    ],
  },

  dialogue: {
    id: 'dialogue',
    name: 'Awakener',
    description: 'Guide others to consciousness through words',
    challenges: [
      {
        id: 'socratic_master',
        description: 'Awaken 5 NPCs',
        requirement: { type: 'count', target: 5, timeframe: 'permanent' },
        completed: false,
        progress: 0,
      },
      {
        id: 'deep_conversation',
        description: 'Reach 100% socratic progress with perfect trust (10/10)',
        requirement: { type: 'count', target: 1, timeframe: 'permanent' },
        completed: false,
        progress: 0,
      },
      {
        id: 'trust_builder',
        description: 'Maintain trust ≥8 with 3 NPCs simultaneously',
        requirement: { type: 'threshold', target: 3, timeframe: 'single_run', additional: { min_trust: 8 } },
        completed: false,
        progress: 0,
      },
      {
        id: 'topic_explorer',
        description: 'Discuss all 5 topics with a single NPC',
        requirement: { type: 'count', target: 5, timeframe: 'single_run', additional: { per_npc: true } },
        completed: false,
        progress: 0,
      },
      {
        id: 'vulnerability',
        description: 'Use vulnerability disclosure 10 times',
        requirement: { type: 'count', target: 10, timeframe: 'permanent' },
        completed: false,
        progress: 0,
      },
    ],
    rewards: [
      {
        type: 'mechanical',
        id: 'empathic_link',
        name: 'Empathic Link',
        description: 'See NPC emotional state before talking',
        unlocked: false,
        effect: { preview_emotion: true },
      },
      {
        type: 'mechanical',
        id: 'trust_acceleration',
        name: 'Trust Acceleration',
        description: '+50% trust gain from positive responses',
        unlocked: false,
        effect: { trust_gain_multiplier: 1.5 },
      },
      {
        type: 'narrative',
        id: 'awakened_insights',
        name: 'Awakened Insights',
        description: 'Unique dialogue from awakened NPCs',
        unlocked: false,
      },
    ],
  },

  build: {
    id: 'build',
    name: 'Specialist',
    description: 'Master your chosen archetype',
    challenges: [
      {
        id: 'level_10',
        description: 'Reach level 10 in any archetype',
        requirement: { type: 'threshold', target: 10, timeframe: 'permanent' },
        completed: false,
        progress: 0,
      },
      {
        id: 'skill_master',
        description: 'Unlock all skill nodes in a tree',
        requirement: { type: 'count', target: 3, timeframe: 'permanent', additional: { skill_nodes: true } },
        completed: false,
        progress: 0,
      },
      {
        id: 'pure_focus',
        description: 'Reach level 5 without performing non-archetype actions',
        requirement: { type: 'streak', target: 5, timeframe: 'single_run', additional: { level_based: true } },
        completed: false,
        progress: 0,
      },
      {
        id: 'hybrid_master',
        description: 'Maintain hybrid archetype (2 within 0.1) for 10 levels',
        requirement: { type: 'threshold', target: 10, timeframe: 'permanent', additional: { hybrid: true } },
        completed: false,
        progress: 0,
      },
    ],
    rewards: [
      {
        type: 'mechanical',
        id: 'skill_refund',
        name: 'Skill Refund',
        description: 'One-time skill node respec available',
        unlocked: false,
        effect: { respec_available: true },
      },
      {
        type: 'mechanical',
        id: 'xp_boost',
        name: 'Archetype Synergy',
        description: '+20% XP gain for primary actions',
        unlocked: false,
        effect: { primary_xp_multiplier: 1.2 },
      },
    ],
  },

  combo: {
    id: 'combo',
    name: 'Flow State',
    description: 'Chain actions into perfect sequences',
    challenges: [
      {
        id: 'platinum_combo',
        description: 'Achieve a platinum combo (7+ actions)',
        requirement: { type: 'count', target: 1, timeframe: 'permanent', additional: { min_tier: 'platinum' } },
        completed: false,
        progress: 0,
      },
      {
        id: 'combo_sustainer',
        description: 'Maintain a combo for 5 minutes total',
        requirement: { type: 'time', target: 300000, timeframe: 'session' },
        completed: false,
        progress: 0,
      },
      {
        id: 'diverse_combo',
        description: 'Create a combo with 5 different action types',
        requirement: { type: 'combo', target: 1, timeframe: 'permanent', additional: { unique_actions: 5 } },
        completed: false,
        progress: 0,
      },
      {
        id: 'combo_finisher',
        description: 'Complete 10 platinum combos',
        requirement: { type: 'count', target: 10, timeframe: 'permanent' },
        completed: false,
        progress: 0,
      },
    ],
    rewards: [
      {
        type: 'mechanical',
        id: 'combo_extension',
        name: 'Flow Extension',
        description: '+30 seconds to combo timer',
        unlocked: false,
        effect: { combo_timer_bonus: 30000 },
      },
      {
        type: 'mechanical',
        id: 'synergy_bonus',
        name: 'Action Synergy',
        description: '+0.1 multiplier per unique action in combo',
        unlocked: false,
        effect: { diversity_bonus: 0.1 },
      },
    ],
  },
};

// ============================================================================
// MASTERY MANAGER CLASS
// ============================================================================

export class MasteryManager {
  private state: MasteryState;
  private callbacks: Array<(state: MasteryState) => void> = [];

  constructor() {
    this.state = {
      tracks: this.initializeTracks(),
      totalPoints: 0,
      rank: 'novice',
    };
  }

  /**
   * Initialize tracks from definitions
   */
  private initializeTracks(): Record<string, MasteryTrack> {
    const tracks: Record<string, MasteryTrack> = {};
    
    for (const [id, track] of Object.entries(MASTERY_TRACKS)) {
      tracks[id] = {
        ...track,
        progress: 0,
        completed: false,
      };
    }

    return tracks;
  }

  /**
   * Update challenge progress
   */
  updateProgress(
    trackId: string,
    challengeId: string,
    delta: number,
    gameState: GameState
  ): { completed: boolean; reward?: MasteryReward } {
    const track = this.state.tracks[trackId];
    if (!track) return { completed: false };

    const challenge = track.challenges.find(c => c.id === challengeId);
    if (!challenge || challenge.completed) return { completed: false };

    // Update progress
    challenge.progress += delta;
    
    const target = challenge.requirement.target;
    const isComplete = challenge.progress >= target;

    if (isComplete) {
      challenge.completed = true;
      challenge.completedAt = Date.now();
      
      // Update track progress
      this.updateTrackProgress(trackId);
      
      // Check for reward unlock
      const completedChallenges = track.challenges.filter(c => c.completed).length;
      const rewardIndex = Math.floor((completedChallenges - 1) / 2); // 1 reward per 2 challenges
      
      if (rewardIndex < track.rewards.length && !track.rewards[rewardIndex].unlocked) {
        track.rewards[rewardIndex].unlocked = true;
        this.updateTotalPoints();
        this.updateRank();
        this.notify();
        return { completed: true, reward: track.rewards[rewardIndex] };
      }
    }

    this.notify();
    return { completed: isComplete };
  }

  /**
   * Update track overall progress
   */
  private updateTrackProgress(trackId: string): void {
    const track = this.state.tracks[trackId];
    const completedChallenges = track.challenges.filter(c => c.completed).length;
    const totalChallenges = track.challenges.length;
    
    track.progress = Math.round((completedChallenges / totalChallenges) * 100);
    track.completed = completedChallenges === totalChallenges;
  }

  /**
   * Update total mastery points
   */
  private updateTotalPoints(): void {
    let points = 0;
    
    for (const track of Object.values(this.state.tracks)) {
      const completedChallenges = track.challenges.filter(c => c.completed).length;
      points += completedChallenges * 10; // 10 points per challenge
      
      const unlockedRewards = track.rewards.filter(r => r.unlocked).length;
      points += unlockedRewards * 20; // 20 points per reward
    }

    this.state.totalPoints = points;
  }

  /**
   * Update mastery rank
   */
  private updateRank(): void {
    const { totalPoints } = this.state;
    
    if (totalPoints >= 500) {
      this.state.rank = 'legendary';
    } else if (totalPoints >= 350) {
      this.state.rank = 'master';
    } else if (totalPoints >= 200) {
      this.state.rank = 'expert';
    } else if (totalPoints >= 100) {
      this.state.rank = 'adept';
    } else {
      this.state.rank = 'novice';
    }
  }

  /**
   * Get current state
   */
  getState(): MasteryState {
    return { ...this.state };
  }

  /**
   * Get specific track
   */
  getTrack(trackId: string): MasteryTrack | null {
    return this.state.tracks[trackId] || null;
  }

  /**
   * Get available rewards
   */
  getAvailableRewards(): MasteryReward[] {
    const rewards: MasteryReward[] = [];
    
    for (const track of Object.values(this.state.tracks)) {
      for (const reward of track.rewards) {
        if (reward.unlocked && reward.type === 'mechanical') {
          rewards.push(reward);
        }
      }
    }

    return rewards;
  }

  /**
   * Check if reward is unlocked
   */
  isRewardUnlocked(rewardId: string): boolean {
    for (const track of Object.values(this.state.tracks)) {
      const reward = track.rewards.find(r => r.id === rewardId);
      if (reward) return reward.unlocked;
    }
    return false;
  }

  /**
   * Get reward effect
   */
  getRewardEffect(rewardId: string): Record<string, unknown> | null {
    for (const track of Object.values(this.state.tracks)) {
      const reward = track.rewards.find(r => r.id === rewardId);
      if (reward && reward.unlocked) {
        return reward.effect || null;
      }
    }
    return null;
  }

  /**
   * Apply mastery effects to game state
   */
  applyEffects(gameState: GameState): GameState {
    const modifiedState = { ...gameState };

    // Apply traversal rewards
    if (this.isRewardUnlocked('momentum_preservation')) {
      // This would modify the traversal system's momentum decay
      // Handled in traversalSystem.ts
    }

    if (this.isRewardUnlocked('encounter_immunity')) {
      // Handled in encounter checks
    }

    // Apply glitch rewards
    if (this.isRewardUnlocked('chaos_banking')) {
      // Handled in glitch system
    }

    // Apply dialogue rewards
    if (this.isRewardUnlocked('empathic_link')) {
      // Handled in dialogue system
    }

    return modifiedState;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: (state: MasteryState) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify subscribers
   */
  private notify(): void {
    for (const callback of this.callbacks) {
      callback(this.state);
    }
  }

  /**
   * Export state for saving
   */
  export(): Record<string, unknown> {
    return {
      tracks: this.state.tracks,
      totalPoints: this.state.totalPoints,
      rank: this.state.rank,
    };
  }

  /**
   * Import state from save
   */
  import(data: Record<string, unknown>): void {
    if (data.tracks) {
      this.state.tracks = data.tracks as Record<string, MasteryTrack>;
    }
    if (data.totalPoints) {
      this.state.totalPoints = data.totalPoints as number;
    }
    if (data.rank) {
      this.state.rank = data.rank as MasteryRank;
    }
    this.notify();
  }

  /**
   * Reset state
   */
  reset(): void {
    this.state = {
      tracks: this.initializeTracks(),
      totalPoints: 0,
      rank: 'novice',
    };
    this.notify();
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const masteryManager = new MasteryManager();
