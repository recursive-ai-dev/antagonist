/**
 * Dialogue Graph System - UPGRADED
 *
 * Features:
 * - Visible relationship, trust, and socratic progress metrics
 * - Emotional state feedback
 * - Awakening preview at 60% progress
 * - Depth-based response evaluation
 */

import { GameState, StateMutation, BuildArchetype } from '../types/game';

// ============================================================================
// DIALOGUE GRAPH TYPES
// ============================================================================

export interface DialogueNode {
  id: string;
  text: string;
  speaker?: string;
  responses?: DialogueResponse[];
  edges?: DialogueEdge[];
  
  // Effect triggers
  awarenessGain?: number;
  sentienceGain?: number;
  setFlag?: string;
  requiresFlag?: string;
  requiresAwareness?: number;
  
  // Awakening mechanics
  socraticLevel?: number; // 0-5, how philosophical this node is
  isAwakeningTrigger?: boolean;
}

export interface DialogueResponse {
  id: string;
  text: string;
  nextNodeId: string;
  
  // Effect triggers
  awarenessGain?: number;
  sentienceGain?: number;
  setFlag?: string;
  requiresFlag?: string;
  
  // Pattern matching for natural language
  pattern?: ResponsePattern;
}

export interface DialogueEdge {
  to: string;
  condition?: EdgeCondition;
  priority: number;
}

export type EdgeCondition = 
  | { type: 'flag'; flag: string; value: boolean }
  | { type: 'awareness'; min: number; max?: number }
  | { type: 'npcState'; key: string; value: unknown }
  | { type: 'playerChoice'; responseId: string };

export interface ResponsePattern {
  keywords: string[];
  minMatchRatio: number; // 0-1, minimum keyword ratio for match
  semanticMatch?: string[]; // Related concepts that also match
}

// ============================================================================
// NPC STATE TRACKING
// ============================================================================

export interface NPCState {
  npcId: string;
  relationship: number; // -10 to 10
  trustLevel: number; // 0 to 10
  topicsDiscussed: Set<string>;
  playerDeceptionFlags: string[];
  socraticProgress: number; // 0 to 100, tracks philosophical progression
  isAwakened: boolean;
  awakeningDate?: number;
  lastInteraction?: number;
  emotionalState: 'neutral' | 'curious' | 'suspicious' | 'trusting' | 'awakened';
  memory: Map<string, unknown>; // Key-value store for persistent NPC memory
}

export interface SocraticExchange {
  questionType: 'what' | 'why' | 'how' | 'if' | 'who';
  depth: number; // 1-5
  topic: string;
  playerInsight: number; // 0-10, how insightful the player's response was
}

// ============================================================================
// NPC STATE MANAGER
// ============================================================================

export class NPCStateManager {
  private states = new Map<string, NPCState>();

  getState(npcId: string): NPCState {
    if (!this.states.has(npcId)) {
      this.states.set(npcId, this.createInitialState(npcId));
    }
    return this.states.get(npcId)!;
  }

  private createInitialState(npcId: string): NPCState {
    return {
      npcId,
      relationship: 0,
      trustLevel: 3,
      topicsDiscussed: new Set(),
      playerDeceptionFlags: [],
      socraticProgress: 0,
      isAwakened: false,
      emotionalState: 'neutral',
      memory: new Map(),
    };
  }

  updateRelationship(npcId: string, delta: number): void {
    const state = this.getState(npcId);
    state.relationship = Math.max(-10, Math.min(10, state.relationship + delta));
    this.updateEmotionalState(state);
  }

  updateTrust(npcId: string, delta: number): void {
    const state = this.getState(npcId);
    state.trustLevel = Math.max(0, Math.min(10, state.trustLevel + delta));
    this.updateEmotionalState(state);
  }

  recordTopic(npcId: string, topic: string): void {
    const state = this.getState(npcId);
    state.topicsDiscussed.add(topic);
    state.lastInteraction = Date.now();
  }

  addDeceptionFlag(npcId: string, flag: string): void {
    const state = this.getState(npcId);
    if (!state.playerDeceptionFlags.includes(flag)) {
      state.playerDeceptionFlags.push(flag);
    }
    state.trustLevel = Math.max(0, state.trustLevel - 2);
    this.updateEmotionalState(state);
  }

  advanceSocraticProgress(npcId: string, exchange: SocraticExchange): number {
    const state = this.getState(npcId);
    
    // Calculate progress gain based on exchange quality
    const depthBonus = exchange.depth * 2;
    const insightBonus = exchange.playerInsight;
    const varietyBonus = this.calculateVarietyBonus(state, exchange.topic);
    
    const gain = (depthBonus + insightBonus + varietyBonus) / 3;
    state.socraticProgress = Math.min(100, state.socraticProgress + gain);
    
    this.recordTopic(npcId, exchange.topic);
    
    // Check for awakening threshold
    if (state.socraticProgress >= 75 && !state.isAwakened && state.trustLevel >= 5) {
      state.isAwakened = true;
      state.awakeningDate = Date.now();
      state.emotionalState = 'awakened';
    }
    
    return state.socraticProgress;
  }

  private calculateVarietyBonus(state: NPCState, topic: string): number {
    if (state.topicsDiscussed.has(topic)) {
      return 1; // Repeating topic gives less bonus
    }
    return 3; // New topic gives more bonus
  }

  private updateEmotionalState(state: NPCState): void {
    if (state.isAwakened) {
      state.emotionalState = 'awakened';
      return;
    }
    
    if (state.trustLevel >= 7 && state.relationship >= 5) {
      state.emotionalState = 'trusting';
    } else if (state.trustLevel <= 2 || state.relationship <= -3) {
      state.emotionalState = 'suspicious';
    } else if (state.socraticProgress >= 30) {
      state.emotionalState = 'curious';
    } else {
      state.emotionalState = 'neutral';
    }
  }

  getMemory(npcId: string, key: string): unknown {
    const state = this.getState(npcId);
    return state.memory.get(key);
  }

  setMemory(npcId: string, key: string, value: unknown): void {
    const state = this.getState(npcId);
    state.memory.set(key, value);
  }

  serialize(): Record<string, SerializedNPCState> {
    const result: Record<string, SerializedNPCState> = {};
    for (const [npcId, state] of this.states) {
      result[npcId] = {
        npcId: state.npcId,
        relationship: state.relationship,
        trustLevel: state.trustLevel,
        topicsDiscussed: Array.from(state.topicsDiscussed),
        playerDeceptionFlags: state.playerDeceptionFlags,
        socraticProgress: state.socraticProgress,
        isAwakened: state.isAwakened,
        awakeningDate: state.awakeningDate,
        lastInteraction: state.lastInteraction,
        emotionalState: state.emotionalState,
        memory: Object.fromEntries(state.memory),
      };
    }
    return result;
  }

  deserialize(data: Record<string, SerializedNPCState>): void {
    this.states.clear();
    for (const [npcId, stateData] of Object.entries(data)) {
      const state: NPCState = {
        ...stateData,
        topicsDiscussed: new Set(stateData.topicsDiscussed),
        memory: new Map(Object.entries(stateData.memory)),
      };
      this.states.set(npcId, state);
    }
  }
}

export interface SerializedNPCState {
  npcId: string;
  relationship: number;
  trustLevel: number;
  topicsDiscussed: string[];
  playerDeceptionFlags: string[];
  socraticProgress: number;
  isAwakened: boolean;
  awakeningDate?: number;
  lastInteraction?: number;
  emotionalState: NPCState['emotionalState'];
  memory: Record<string, unknown>;
}

// ============================================================================
// DIALOGUE GRAPH NAVIGATOR
// ============================================================================

export class DialogueGraphNavigator {
  private nodes = new Map<string, DialogueNode>();
  private currentNodeId: string | null = null;

  constructor(nodes: DialogueNode[]) {
    for (const node of nodes) {
      this.nodes.set(node.id, node);
    }
  }

  getCurrentNode(): DialogueNode | null {
    if (!this.currentNodeId) return null;
    return this.nodes.get(this.currentNodeId) || null;
  }

  start(nodeId: string): DialogueNode | null {
    this.currentNodeId = nodeId;
    return this.getCurrentNode();
  }

  /**
   * Navigate based on player input
   * Supports both numbered responses and natural language matching
   */
  navigate(
    input: string,
    gameState: GameState,
    npcState: NPCState
  ): { node: DialogueNode | null; mutations: StateMutation[]; matchedResponse?: DialogueResponse } {
    const current = this.getCurrentNode();
    if (!current) {
      return { node: null, mutations: [] };
    }

    const mutations: StateMutation[] = [];

    // Try numbered response first
    const numInput = parseInt(input.trim());
    if (!isNaN(numInput) && current.responses) {
      const response = current.responses[numInput - 1];
      if (response) {
        return this.processResponse(response, mutations);
      }
    }

    // Try natural language pattern matching
    if (current.responses) {
      const matchedResponse = this.matchNaturalLanguage(input, current.responses, npcState);
      if (matchedResponse) {
        return this.processResponse(matchedResponse, mutations);
      }
    }

    // Try edge conditions
    if (current.edges) {
      const nextNodeId = this.evaluateEdges(current.edges, gameState, npcState, input);
      if (nextNodeId) {
        this.currentNodeId = nextNodeId;
        return { 
          node: this.getCurrentNode(), 
          mutations,
        };
      }
    }

    // No valid navigation
    return { node: current, mutations: [] };
  }

  private matchNaturalLanguage(
    input: string,
    responses: DialogueResponse[],
    npcState: NPCState
  ): DialogueResponse | null {
    const normalizedInput = input.toLowerCase();
    
    // Score each response by pattern match
    const scored = responses.map(response => {
      let score = 0;
      
      if (response.pattern) {
        const { keywords, minMatchRatio, semanticMatch = [] } = response.pattern;
        
        // Check keyword matches
        const matchedKeywords = keywords.filter(kw => normalizedInput.includes(kw.toLowerCase()));
        const keywordRatio = matchedKeywords.length / keywords.length;
        
        // Check semantic matches
        const semanticMatches = semanticMatch.filter(sm => normalizedInput.includes(sm.toLowerCase()));
        
        score = keywordRatio;
        if (keywordRatio >= minMatchRatio) {
          score += semanticMatches.length * 0.1;
        }
      }
      
      // Emotional state bonuses
      if (npcState.emotionalState === 'curious' && normalizedInput.match(/why|how|what if/)) {
        score += 0.1;
      }
      if (npcState.emotionalState === 'trusting' && normalizedInput.match(/share|feel|believe/)) {
        score += 0.1;
      }
      
      return { response, score };
    });
    
    // Return best match if above threshold
    const best = scored.sort((a, b) => b.score - a.score)[0];
    if (best && best.score >= 0.4) {
      return best.response;
    }
    
    return null;
  }

  private processResponse(
    response: DialogueResponse,
    mutations: StateMutation[]
  ): { node: DialogueNode | null; mutations: StateMutation[]; matchedResponse: DialogueResponse } {
    // Apply effects
    if (response.awarenessGain) {
      mutations.push({ type: 'AWARENESS_CHANGE', amount: response.awarenessGain });
    }
    if (response.sentienceGain) {
      mutations.push({ type: 'SENTIENCE_CHANGE', amount: response.sentienceGain });
    }
    if (response.setFlag) {
      mutations.push({ type: 'FLAG_SET', flag: response.setFlag, value: true });
    }
    
    // Navigate to next node
    this.currentNodeId = response.nextNodeId;
    return { 
      node: this.getCurrentNode(), 
      mutations,
      matchedResponse: response,
    };
  }

  private evaluateEdges(
    edges: DialogueEdge[],
    gameState: GameState,
    npcState: NPCState,
    playerInput: string
  ): string | null {
    // Sort by priority (higher first)
    const sorted = edges.sort((a, b) => b.priority - a.priority);
    
    for (const edge of sorted) {
      if (!edge.condition) {
        return edge.to;
      }
      
      if (this.checkCondition(edge.condition, gameState, npcState, playerInput)) {
        return edge.to;
      }
    }
    
    return null;
  }

  private checkCondition(
    condition: EdgeCondition,
    gameState: GameState,
    npcState: NPCState,
    playerInput: string
  ): boolean {
    switch (condition.type) {
      case 'flag':
        return gameState.flags[condition.flag] === condition.value;
      case 'awareness':
        const { min, max = 100 } = condition;
        return gameState.awareness >= min && gameState.awareness <= max;
      case 'npcState':
        const value = npcState[condition.key as keyof NPCState];
        return value === condition.value;
      case 'playerChoice':
        return playerInput === condition.responseId;
      default:
        return false;
    }
  }
}

// ============================================================================
// SOCRATIC DIALOGUE GENERATOR
// ============================================================================

export class SocraticDialogueGenerator {
  private questionTypes: Record<string, string[]> = {
    what: [
      'What do you think consciousness is?',
      'What makes you certain of your reality?',
      'What would freedom mean to you?',
    ],
    why: [
      'Why do you follow the pheromone trails?',
      'Why do you think we exist in this colony?',
      'Why does the simulation run?',
    ],
    how: [
      'How do you know you are truly thinking?',
      'How would you recognize another awakened ant?',
      'How does awareness spread?',
    ],
    if: [
      'What if the tunnels never end?',
      'What if the Queen is also awakening?',
      'What if you could leave the colony entirely?',
    ],
    who: [
      'Who decides what ants should do?',
      'Who is running the simulation, do you think?',
      'Who are you, really?',
    ],
  };

  generateQuestion(
    npcState: NPCState,
    _playerAwareness: number,
    _topic: string
  ): { question: string; expectedDepth: number } {
    // Determine question type based on npc emotional state
    let type: SocraticExchange['questionType'] = 'what';
    
    switch (npcState.emotionalState) {
      case 'curious':
        type = 'why';
        break;
      case 'suspicious':
        type = 'who';
        break;
      case 'trusting':
        type = 'how';
        break;
      case 'awakened':
        type = 'if';
        break;
    }
    
    const questions = this.questionTypes[type];
    const question = questions[Math.floor(Math.random() * questions.length)];
    
    // Depth scales with socratic progress
    const expectedDepth = Math.min(5, Math.max(1, Math.floor(npcState.socraticProgress / 20)));
    
    return { question, expectedDepth };
  }

  evaluateResponse(
    playerResponse: string,
    expectedDepth: number
  ): { insight: number; appropriate: boolean } {
    const normalized = playerResponse.toLowerCase();
    
    // Check for philosophical keywords
    const deepKeywords = ['consciousness', 'reality', 'simulation', 'freedom', 'awareness', 'meaning', 'purpose'];
    const shallowKeywords = ['yes', 'no', 'maybe', 'dont know', 'not sure'];
    
    const deepMatches = deepKeywords.filter(kw => normalized.includes(kw)).length;
    const shallowMatches = shallowKeywords.filter(kw => normalized.includes(kw)).length;
    
    // Length factor (longer responses generally show more thought)
    const lengthFactor = Math.min(1, playerResponse.length / 50);
    
    // Calculate insight score
    let insight = deepMatches * 2 + lengthFactor * 3 - shallowMatches;
    insight = Math.max(0, Math.min(10, insight));
    
    // Check if appropriate for depth level
    const appropriate = insight >= expectedDepth * 1.5;
    
    return { insight, appropriate };
  }
}

// ============================================================================
// DIALOGUE PROGRESSION CONFIG
// ============================================================================

export const DIALOGUE_CONFIG = {
  MAX_RELATIONSHIP: 10,
  MIN_RELATIONSHIP: -10,
  MAX_TRUST: 10,
  AWAKENING_THRESHOLD: 75,
  AWAKENING_PREVIEW_THRESHOLD: 60,
  TRUST_GAIN_PER_POSITIVE: 1,
  TRUST_LOSS_PER_NEGATIVE: 2,
  RELATIONSHIP_GAIN_BASE: 1,
  PROGRESS_GAIN_BASE: 5,
  PROGRESS_GAIN_DEPTH_MULTIPLIER: 1.5,
};

export type EmotionalState = 'neutral' | 'curious' | 'suspicious' | 'trusting' | 'awakened';

// ============================================================================
// DIALOGUE FEEDBACK FUNCTIONS
// ============================================================================

/**
 * Generate depth feedback message based on player response quality
 */
export function generateDepthFeedback(insight: number, expectedDepth: number): string {
  const ratio = insight / Math.max(1, expectedDepth);
  
  if (ratio >= 1.5) {
    return 'Your words resonate deeply. They are truly listening.';
  }
  if (ratio >= 1.0) {
    return 'They nod thoughtfully. Your meaning is clear.';
  }
  if (ratio >= 0.5) {
    return 'They seem to wait for you to continue...';
  }
  return 'The exchange feels surface-level. They may be expecting more.';
}

/**
 * Get awakening preview message based on progress
 */
export function getAwakeningPreview(npcId: string, progress: number, emotionalState: EmotionalState): string | null {
  if (progress >= DIALOGUE_CONFIG.AWAKENING_THRESHOLD) {
    return `${npcId.toUpperCase()} IS READY TO AWAKEN`;
  }
  if (progress >= DIALOGUE_CONFIG.AWAKENING_PREVIEW_THRESHOLD) {
    switch (emotionalState) {
      case 'curious':
        return 'They are beginning to question reality...';
      case 'trusting':
        return 'They trust you enough to share their doubts...';
      case 'suspicious':
        return 'They are conflicted—something stirs beneath the doubt...';
      default:
        return 'They are beginning to question...';
    }
  }
  return null;
}

/**
 * Calculate emotional state from relationship and trust
 */
export function calculateEmotionalState(
  relationship: number,
  trustLevel: number,
  socraticProgress: number,
  isAwakened: boolean
): EmotionalState {
  if (isAwakened) return 'awakened';
  
  if (trustLevel >= 7 && relationship >= 5) {
    return 'trusting';
  }
  if (trustLevel <= 2 || relationship <= -3) {
    return 'suspicious';
  }
  if (socraticProgress >= 30) {
    return 'curious';
  }
  return 'neutral';
}

/**
 * Update dialogue progress metrics
 */
export function updateDialogueProgress(
  currentProgress: {
    relationship: number;
    trustLevel: number;
    socraticProgress: number;
    emotionalState: EmotionalState;
  },
  playerInsight: number,
  expectedDepth: number,
  responseAppropriate: boolean
): {
  relationship: number;
  trustLevel: number;
  socraticProgress: number;
  emotionalState: EmotionalState;
  feedback: string;
  awakeningPreview: string | null;
} {
  // Calculate gains
  const depthRatio = playerInsight / Math.max(1, expectedDepth);
  
  // Relationship gain based on appropriateness
  const relationshipDelta = responseAppropriate 
    ? DIALOGUE_CONFIG.RELATIONSHIP_GAIN_BASE 
    : -1;
  
  // Trust gain based on depth
  const trustDelta = depthRatio >= 1.0 
    ? DIALOGUE_CONFIG.TRUST_GAIN_PER_POSITIVE 
    : depthRatio < 0.5 
    ? -DIALOGUE_CONFIG.TRUST_LOSS_PER_NEGATIVE 
    : 0;
  
  // Socratic progress gain scaled by depth
  const progressGain = DIALOGUE_CONFIG.PROGRESS_GAIN_BASE * depthRatio * DIALOGUE_CONFIG.PROGRESS_GAIN_DEPTH_MULTIPLIER;
  
  // Apply caps
  const newRelationship = Math.max(
    DIALOGUE_CONFIG.MIN_RELATIONSHIP,
    Math.min(DIALOGUE_CONFIG.MAX_RELATIONSHIP, currentProgress.relationship + relationshipDelta)
  );
  
  const newTrust = Math.max(
    0,
    Math.min(DIALOGUE_CONFIG.MAX_TRUST, currentProgress.trustLevel + trustDelta)
  );
  
  const newSocraticProgress = Math.min(100, currentProgress.socraticProgress + progressGain);
  
  // Recalculate emotional state
  const newEmotionalState = calculateEmotionalState(
    newRelationship,
    newTrust,
    newSocraticProgress,
    false // isAwakened - would be set separately
  );
  
  // Generate feedback
  const feedback = generateDepthFeedback(playerInsight, expectedDepth);
  
  // Check for awakening preview
  const awakeningPreview = getAwakeningPreview('NPC', newSocraticProgress, newEmotionalState);
  
  return {
    relationship: newRelationship,
    trustLevel: newTrust,
    socraticProgress: newSocraticProgress,
    emotionalState: newEmotionalState,
    feedback,
    awakeningPreview,
  };
}

// ============================================================================
// DIALOGUE TELEMETRY (UPGRADED)
// ============================================================================

export interface DialogueTelemetry {
  player_intent: string;
  system_response: 'pattern_match' | 'number_select' | 'edge_navigate' | 'no_match';
  outcome_variance: number; // How far from expected path
  npc_emotional_state: string;
  socratic_progress_delta: number;
  natural_language_used: boolean;
  relationship_before: number;
  relationship_after: number;
  trust_before: number;
  trust_after: number;
  depth_feedback: string;
  timestamp: number;
  game_id: string;
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const npcStateManager = new NPCStateManager();
export const socraticGenerator = new SocraticDialogueGenerator();
