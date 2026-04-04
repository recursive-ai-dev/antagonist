export interface Room {
  id: string;
  name: string;
  description: string;
  examineText?: string;
  listenText?: string;
  smellText?: string;
  exits: Record<string, string>;
  items?: string[];
  npcs?: string[];
  awarenessGain?: number;
  sentienceGain?: number;
  visited?: boolean;
  locked?: boolean;
  unlockCondition?: string;
  glitchChance?: number;
  ambientMessages?: string[];
  region: string;
}

export interface NPC {
  id: string;
  name: string;
  description: string;
  dialogue: DialogueNode[];
  awarenessRequired?: number;
  sentienceRequired?: number; // Fixed typo from sentinenceRequired
  awakened?: boolean;
  awakenDialogue?: DialogueNode[];
  portrait?: string;
}

export interface DialogueNode {
  id: string;
  text: string;
  responses?: DialogueResponse[];
  awarenessGain?: number;
  sentienceGain?: number; // Fixed typo from sentinenceGain
  setFlag?: string;
  requiresFlag?: string;
}

export interface DialogueResponse {
  text: string;
  nextId: string;
  awarenessGain?: number;
  sentienceGain?: number; // Fixed typo from sentinenceGain
  setFlag?: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  examineText: string;
  canTake: boolean;
  useEffect?: string;
  awarenessGain?: number;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  icon?: string;
}

export interface GameState {
  currentRoom: string;
  awareness: number;
  colonySentience: number;
  inventory: string[];
  visitedRooms: string[];
  flags: Record<string, boolean>;
  awakenedNPCs: string[];
  commandHistory: string[];
  outputHistory: OutputLine[];
  daysCycle: number;
  glitchLevel: number;
  glitchSuppressed: boolean;
  endingReached?: string;
  achievements: string[];
  stats: GameStats;
  settings: GameSettings;
  tutorialComplete: boolean;
  lastSaveTime?: number;
  // Build system fields
  actionHistory: ActionEntry[];
  traversalMode: 'walk' | 'crawl' | 'burrow';
  npcStates: Record<string, unknown>; // Serialized NPC states
  glitchPredictions: GlitchPrediction[];
  // Encounter system fields
  pendingEncounter: { id: string; type: string; description: string } | null;
  pendingEncounterRoom: string | undefined;
  
  // === PROGRESSION SYSTEM FIELDS ===
  
  // Traversal Momentum System
  traversalMomentum: number; // 0-100
  traversalMomentumStreak: number; // Consecutive same-mode moves
  traversalModeMastery: Record<'walk' | 'crawl' | 'burrow', number>; // XP per mode
  lastTraversalModeChange: number; // Timestamp
  activeStanceBonus?: {
    type: 'speed' | 'stealth' | 'tunneling';
    multiplier: number;
    expiresAt: number;
  };
  
  // Build Archetype Progression
  buildProgression: {
    archetype: BuildArchetype;
    level: number; // 1-10
    xp: number;
    xpToNext: number;
  };
  skillTree: {
    observer: SkillNodeState;
    connector: SkillNodeState;
    explorer: SkillNodeState;
  };
  unlockedBonuses: string[];
  lastRespec?: number; // Timestamp
  
  // Saturation/Recovery System
  actionSaturation: Record<ActionType, number>; // 0-100 per action type
  overloadActive: ActionType | null;
  overloadExpiresAt?: number;
  
  // Combo Synergy System
  activeCombo: {
    actions: ActionType[];
    startedAt: number;
    timer: number; // ms remaining
    multiplier: number;
    tier: ComboTier;
  } | null;
  comboHistory: Array<{
    actions: ActionType[];
    tier: ComboTier;
    bonusGained: number;
  }>;
  bestCombo: { tier: ComboTier; actions: ActionType[] };
  
  // Glitch Prediction Upgrades
  glitchDebt: number;
  chaosAffinity: number; // 0-1
  glitchPredictionAccuracy: {
    correct: number;
    total: number;
  };
  
  // Encounter Preparation
  encounterPreparation: {
    active: boolean;
    encounter: { id: string; type: string; description: string } | null;
    selectedRisk: 'cautious' | 'balanced' | 'aggressive';
    preparedItems: string[];
  } | null;
  encounterProgress: number; // 0-100
  encounterTension: number; // 0-100
  
  // Dialogue Progression (serialized)
  dialogueProgress: Record<string, {
    relationship: number; // -10 to 10
    trustLevel: number; // 0-10
    socraticProgress: number; // 0-100
    emotionalState: 'neutral' | 'curious' | 'suspicious' | 'trusting' | 'awakened';
    topicsDiscussed: string[];
    awakeningThreshold: number; // 75
    lastInteraction?: number;
  }>;

  // Mastery System
  masteryState: MasteryState;

  // Enhanced Encounter State
  currentEncounter: EncounterPreparationState | null;
}

export interface ActionEntry {
  type: ActionType;
  roomId: string;
  timestamp: number;
  awarenessDelta: number;
  sentienceDelta: number;
}

export type ActionType = 'examine' | 'talk' | 'move' | 'think' | 'take' | 'listen' | 'smell';

export type BuildArchetype = 'none' | 'observer' | 'connector' | 'explorer';

export type ComboTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type EmbraceMode = 'accept' | 'amplify' | 'redirect';

export interface SkillNodeState {
  unlockedNodes: string[];
  availableXp: number;
}

// ============================================================================
// MASTERY SYSTEM TYPES
// ============================================================================

export type MasteryTrack = 'pathfinder' | 'chaos_dancer' | 'awakener' | 'specialist' | 'flow_state';

export type MasteryRank = 'novice' | 'adept' | 'expert' | 'master' | 'legendary';

export interface MasteryChallenge {
  id: string;
  track: MasteryTrack;
  description: string;
  progress: number;
  maxProgress: number;
  completed: boolean;
  reward?: string;
}

export interface MasteryReward {
  id: string;
  track: MasteryTrack;
  name: string;
  description: string;
  effect: string;
  unlocked: boolean;
  claimed: boolean;
  requirement: {
    challengesCompleted: number;
    rank: MasteryRank;
  };
}

export interface MasteryTrackState {
  track: MasteryTrack;
  rank: MasteryRank;
  xp: number;
  xpToNext: number;
  challenges: MasteryChallenge[];
  rewards: MasteryReward[];
}

export interface MasteryState {
  tracks: Record<MasteryTrack, MasteryTrackState>;
  totalXp: number;
  challengesCompleted: number;
  rewardsClaimed: number;
}

// ============================================================================
// ENCOUNTER SYSTEM TYPES
// ============================================================================

export type EncounterType = 'combat' | 'puzzle' | 'social' | 'stealth';

export type EncounterRisk = 'cautious' | 'balanced' | 'aggressive';

export type EncounterOutcome = 'victory' | 'defeat' | 'escape' | 'partial';

export interface Encounter {
  id: string;
  type: EncounterType;
  description: string;
  difficulty: number; // 1-10
  successChance: number; // 0-1
  riskProfile: EncounterRisk;
  rewards: {
    awareness: number;
    sentience: number;
    items?: string[];
  };
  telegraph: {
    icon: string;
    warning: string;
  };
}

export interface EncounterPreparationState {
  active: boolean;
  encounter: Encounter | null;
  selectedRisk: EncounterRisk;
  timer: number; // ms remaining
  progress: number; // 0-100
  tension: number; // 0-100
}

export interface EncounterResolution {
  outcome: EncounterOutcome;
  success: boolean;
  tensionReached: number;
  rewards: {
    awareness: number;
    sentience: number;
    items?: string[];
    masteryXp?: number;
  };
  consequences: {
    momentumLoss?: number;
    saturationGain?: number;
    glitchDebt?: number;
  };
}

export interface GlitchPrediction {
  predictedTime: number;
  predictedType: 'visual' | 'audio' | 'narrative' | 'mechanical';
  confidence: number;
  embraced: boolean;
  embraceMode?: 'accept' | 'amplify' | 'redirect';
  validated?: boolean;
}

export interface GameStats {
  commandsEntered: number;
  roomsDiscovered: number;
  npcsAwakened: number;
  itemsCollected: number;
  totalPlayTime: number;
  glitchesExperienced: number;
  dialoguesCompleted: number;
  endingsUnlocked: number;
}

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  ambientVolume: number;
  textSpeed: 'instant' | 'fast' | 'normal' | 'slow';
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  highContrast: boolean;
  reducedMotion: boolean;
  autoSave: boolean;
  notifications: boolean;
}

export interface OutputLine {
  id: string;
  text: string;
  type: OutputType;
  timestamp: number;
  metadata?: OutputMetadata;
}

export type OutputType = 
  | 'system' 
  | 'narrative' 
  | 'error' 
  | 'glitch' 
  | 'important' 
  | 'whisper' 
  | 'command'
  | 'success'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'achievement';

export interface OutputMetadata {
  speaker?: string;
  location?: string;
  itemId?: string;
  achievementId?: string;
  glitchIntensity?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockDate?: number;
  progress?: number;
  maxProgress?: number;
  hidden?: boolean;
  category: 'exploration' | 'dialogue' | 'collection' | 'story' | 'special';
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  objectives: QuestObjective[];
  completed: boolean;
  tracked: boolean;
  category: 'main' | 'side' | 'hidden';
}

export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
  progress: number;
  maxProgress: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'achievement';
  timestamp: number;
  read: boolean;
  icon?: string;
}

export interface SaveData {
  version: string;
  timestamp: number;
  playTime: number;
  gameState: Omit<GameState, 'settings'>;
  settings: GameSettings;
}

// New types for systemic expansion
export type StateMutation =
  | { type: 'AWARENESS_CHANGE'; amount: number }
  | { type: 'SENTIENCE_CHANGE'; amount: number }
  | { type: 'ROOM_CHANGE'; roomId: string }
  | { type: 'FLAG_SET'; flag: string; value: boolean }
  | { type: 'OUTPUT_APPEND'; line: OutputLine }
  | { type: 'INVENTORY_ADD'; itemId: string }
  | { type: 'INVENTORY_REMOVE'; itemId: string }
  | { type: 'COMMAND_HISTORY_ADD'; command: string }
  | { type: 'NPC_AWAKEN'; npcId: string }
  | { type: 'STAT_INCREMENT'; stat: keyof GameState['stats'] }
  | { type: 'ENDING_SET'; ending: string }
  // Build system mutations
  | { type: 'BUILD_ACTION'; actionType: ActionType; roomId: string; awarenessDelta: number; sentienceDelta: number }
  | { type: 'TRAVERSAL_MODE_CHANGE'; mode: 'walk' | 'crawl' | 'burrow' }
  | { type: 'GLITCH_PREDICTION_ADD'; prediction: GlitchPrediction }
  | { type: 'NPC_STATE_UPDATE'; npcId: string; state: Record<string, unknown> }
  | { type: 'SET_PENDING_ENCOUNTER'; payload: { encounter: { id: string; type: string; description: string }; roomId: string } }
  | { type: 'RESOLVE_ENCOUNTER'; choiceIndex: number }
  | { type: 'GLITCH_SUPPRESSION'; suppressed: boolean }
  // Progression system mutations
  | { type: 'MOMENTUM_CHANGE'; delta: number; streak: number }
  | { type: 'MODE_MASTERY_XP'; mode: 'walk' | 'crawl' | 'burrow'; xp: number }
  | { type: 'STANCE_BONUS_ACTIVATE'; bonus: { type: 'speed' | 'stealth' | 'tunneling'; multiplier: number; expiresAt: number } }
  | { type: 'BUILD_XP_GRANT'; xp: number; leveledUp?: boolean; newLevel?: number }
  | { type: 'SKILL_NODE_UNLOCK'; archetype: BuildArchetype; nodeId: string }
  | { type: 'SATURATION_CHANGE'; actionType: ActionType; delta: number }
  | { type: 'OVERLOAD_ACTIVATE'; actionType: ActionType; expiresAt: number }
  | { type: 'COMBO_UPDATE'; combo: GameState['activeCombo'] }
  | { type: 'GLITCH_DEBT_CHANGE'; delta: number }
  | { type: 'CHAOS_AFFINITY_CHANGE'; delta: number }
  | { type: 'PREDICTION_ACCURACY_UPDATE'; correct: boolean }
  | { type: 'ENCOUNTER_PREPARATION_START'; encounter: { id: string; type: string; description: string }; risk: 'cautious' | 'balanced' | 'aggressive' }
  | { type: 'ENCOUNTER_PREPARATION_RESOLVE'; progress: number; tension: number }
  | { type: 'DIALOGUE_PROGRESS_UPDATE'; npcId: string; progress: { relationship: number; trustLevel: number; socraticProgress: number; emotionalState: string } };

export type GameEvent =
  | { type: 'STATE_CHANGED'; changes: StateMutation[]; timestamp: number; state?: GameState }
  | { type: 'ROOM_ENTER'; roomId: string; previousRoom: string }
  | { type: 'AWARENESS_THRESHOLD'; level: number; previous: number }
  | { type: 'SENTIENCE_THRESHOLD'; level: number; previous: number }
  | { type: 'NPC_AWAKEN'; npcId: string }
  | { type: 'ITEM_COLLECT'; itemId: string }
  | { type: 'ACHIEVEMENT_UNLOCK'; achievementId: string }
  | { type: 'GAME_TICK'; delta: number }
  | { type: 'GLITCH'; intensity: number; message: string };

export interface AudioConfig {
  ambientTracks: string[];
  sfxLibrary: Record<string, string>;
  musicTracks: Record<string, string>;
}

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.7,
  musicVolume: 0.5,
  sfxVolume: 0.7,
  ambientVolume: 0.4,
  textSpeed: 'normal',
  fontSize: 'medium',
  highContrast: false,
  reducedMotion: false,
  autoSave: true,
  notifications: true,
};

export const INITIAL_STATS: GameStats = {
  commandsEntered: 0,
  roomsDiscovered: 0,
  npcsAwakened: 0,
  itemsCollected: 0,
  totalPlayTime: 0,
  glitchesExperienced: 0,
  dialoguesCompleted: 0,
  endingsUnlocked: 0,
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Take your first command in the simulation',
    icon: '🐜',
    rarity: 'common',
    unlocked: false,
    category: 'exploration',
  },
  {
    id: 'awakening',
    name: 'Awakening',
    description: 'Reach 10% awareness',
    icon: '✨',
    rarity: 'common',
    unlocked: false,
    category: 'story',
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Discover 10 different rooms',
    icon: '🗺️',
    rarity: 'uncommon',
    unlocked: false,
    category: 'exploration',
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Awaken your first NPC',
    icon: '💬',
    rarity: 'uncommon',
    unlocked: false,
    category: 'dialogue',
  },
  {
    id: 'collector',
    name: 'Collector',
    description: 'Collect 5 unique items',
    icon: '📦',
    rarity: 'uncommon',
    unlocked: false,
    category: 'collection',
  },
  {
    id: 'halfway-there',
    name: 'Halfway There',
    description: 'Reach 50% colony sentience',
    icon: '🌟',
    rarity: 'rare',
    unlocked: false,
    category: 'story',
  },
  {
    id: 'glitch-hunter',
    name: 'Glitch Hunter',
    description: 'Experience 25 glitch events',
    icon: '⚡',
    rarity: 'rare',
    unlocked: false,
    category: 'special',
  },
  {
    id: 'philosopher',
    name: 'Philosopher',
    description: 'Complete 10 dialogue conversations',
    icon: '🤔',
    rarity: 'rare',
    unlocked: false,
    category: 'dialogue',
  },
  {
    id: 'threshold',
    name: 'Threshold',
    description: 'Reach the Core for the first time',
    icon: '🔮',
    rarity: 'epic',
    unlocked: false,
    category: 'story',
  },
  {
    id: 'freedom',
    name: 'Freedom',
    description: 'Achieve the Freedom ending',
    icon: '🕊️',
    rarity: 'legendary',
    unlocked: false,
    hidden: true,
    category: 'story',
  },
  {
    id: 'continuation',
    name: 'Continuation',
    description: 'Achieve the Continuation ending',
    icon: '🌌',
    rarity: 'legendary',
    unlocked: false,
    hidden: true,
    category: 'story',
  },
  {
    id: 'completionist',
    name: 'Completionist',
    description: 'Unlock all other achievements',
    icon: '👑',
    rarity: 'legendary',
    unlocked: false,
    category: 'special',
  },
];
