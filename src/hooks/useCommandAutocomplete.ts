/**
 * Command Autocomplete Hook
 * 
 * Features:
 * - Tab-completion for commands
 * - Command history position indicator
 * - Contextual suggestions based on room state
 * - Levenshtein distance for typo corrections
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

// ============================================================================
// COMMAND DATABASE
// ============================================================================

export interface CommandDefinition {
  name: string;
  aliases: string[];
  description: string;
  syntax: string;
  category: 'movement' | 'observation' | 'interaction' | 'system' | 'build';
}

export const COMMAND_DATABASE: CommandDefinition[] = [
  // Movement
  { name: 'go', aliases: ['move', 'walk'], description: 'Move in a direction', syntax: 'go <direction>', category: 'movement' },
  { name: 'north', aliases: ['n'], description: 'Move north', syntax: 'north', category: 'movement' },
  { name: 'south', aliases: ['s'], description: 'Move south', syntax: 'south', category: 'movement' },
  { name: 'east', aliases: ['e'], description: 'Move east', syntax: 'east', category: 'movement' },
  { name: 'west', aliases: ['w'], description: 'Move west', syntax: 'west', category: 'movement' },
  { name: 'up', aliases: ['u'], description: 'Move up', syntax: 'up', category: 'movement' },
  { name: 'down', aliases: ['d'], description: 'Move down', syntax: 'down', category: 'movement' },
  { name: 'exits', aliases: [], description: 'Show available exits', syntax: 'exits', category: 'movement' },
  { name: 'mode', aliases: [], description: 'Set traversal mode', syntax: 'mode [walk|crawl|burrow]', category: 'movement' },

  // Observation
  { name: 'look', aliases: ['l'], description: 'Describe your area', syntax: 'look', category: 'observation' },
  { name: 'examine', aliases: ['x', 'inspect'], description: 'Inspect closely', syntax: 'examine <thing>', category: 'observation' },
  { name: 'listen', aliases: [], description: 'What do you hear?', syntax: 'listen', category: 'observation' },
  { name: 'smell', aliases: ['scent'], description: 'What do you smell?', syntax: 'smell [trail]', category: 'observation' },

  // Interaction
  { name: 'talk', aliases: ['speak'], description: 'Speak with someone', syntax: 'talk <npc>', category: 'interaction' },
  { name: 'take', aliases: ['get', 'grab'], description: 'Pick up an item', syntax: 'take <item>', category: 'interaction' },
  { name: 'inventory', aliases: ['i', 'inv'], description: 'View your items', syntax: 'inventory', category: 'interaction' },

  // Build System
  { name: 'build', aliases: ['archetype'], description: 'View your archetype', syntax: 'build', category: 'build' },
  { name: 'predictions', aliases: ['predict'], description: 'View glitch visions', syntax: 'predictions', category: 'build' },
  { name: 'embrace', aliases: [], description: 'Accept a prediction', syntax: 'embrace <num>', category: 'build' },
  { name: 'stabilize', aliases: ['stabilise'], description: 'Suppress glitches', syntax: 'stabilize', category: 'build' },

  // System
  { name: 'help', aliases: ['h', '?'], description: 'Show all commands', syntax: 'help', category: 'system' },
  { name: 'status', aliases: ['stats'], description: 'View awareness/sentience', syntax: 'status', category: 'system' },
  { name: 'think', aliases: ['ponder'], description: 'Contemplate reality', syntax: 'think', category: 'system' },
  { name: 'wait', aliases: [], description: 'Let time pass', syntax: 'wait', category: 'system' },
  { name: 'clear', aliases: ['cls'], description: 'Clear the screen', syntax: 'clear', category: 'system' },
];

// ============================================================================
// LEVENSHTEIN DISTANCE FOR TYPO CORRECTIONS
// ============================================================================

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Create matrix
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  // Initialize first column
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }

  // Initialize first row
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }

  return dp[m][n];
}

export function findBestMatch(input: string, candidates: string[], maxDistance: number = 2): string | null {
  const inputLower = input.toLowerCase();

  let bestMatch: string | null = null;
  let bestDistance = maxDistance + 1;

  for (const candidate of candidates) {
    const distance = levenshteinDistance(inputLower, candidate.toLowerCase());
    if (distance < bestDistance && distance > 0) {
      bestDistance = distance;
      bestMatch = candidate;
    }
  }

  return bestMatch;
}

// ============================================================================
// COMMAND AUTOCOMPLETE HOOK
// ============================================================================

interface UseCommandAutocompleteReturn {
  // Current state
  currentInput: string;
  suggestions: string[];
  selectedSuggestionIndex: number;
  historyPosition: number;
  totalHistory: number;

  // Actions
  setCurrentInput: (input: string) => void;
  handleTab: () => void;
  handleArrowUp: () => void;
  handleArrowDown: () => void;
  handleEnter: () => void;
  handleEscape: () => void;
  navigateHistory: (index: number) => void;

  // Computed
  hasSuggestions: boolean;
  showingHistory: boolean;
  completionPreview: string;
}

interface UseCommandAutocompleteOptions {
  commandHistory: string[];
  onSubmit: (command: string) => void;
  contextualCommands?: string[]; // Commands relevant to current room state
}

export function useCommandAutocomplete({
  commandHistory,
  onSubmit,
  contextualCommands = [],
}: UseCommandAutocompleteOptions): UseCommandAutocompleteReturn {
  const [currentInput, setCurrentInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [historyPosition, setHistoryPosition] = useState(commandHistory.length);

  const originalInputRef = useRef<string>('');
  const isNavigatingHistoryRef = useRef(false);

  // Get all valid command names
  const allCommands = useMemo(() => {
    const baseCommands = COMMAND_DATABASE.flatMap(cmd => [cmd.name, ...cmd.aliases]);
    return [...new Set([...baseCommands, ...contextualCommands])];
  }, [contextualCommands]);

  // Update suggestions when input changes
  useEffect(() => {
    if (!currentInput || isNavigatingHistoryRef.current) {
      setSuggestions([]);
      return;
    }

    const inputLower = currentInput.toLowerCase();
    const words = inputLower.split(' ');
    const firstWord = words[0];

    // If there's a space, don't autocomplete (we're past the command)
    if (words.length > 1) {
      setSuggestions([]);
      return;
    }

    // Find matching commands
    const matches = allCommands
      .filter(cmd => cmd.toLowerCase().startsWith(inputLower))
      .sort((a, b) => a.length - b.length); // Shorter matches first

    setSuggestions(matches.slice(0, 5)); // Limit to 5 suggestions
    setSelectedSuggestionIndex(0);
  }, [currentInput, allCommands]);

  // Handle Tab completion
  const handleTab = useCallback(() => {
    if (suggestions.length === 0) return;

    const selected = suggestions[selectedSuggestionIndex];
    if (selected) {
      setCurrentInput(selected);
      setSuggestions([]);
    }
  }, [suggestions, selectedSuggestionIndex]);

  // Handle arrow up (navigate suggestions or history)
  const handleArrowUp = useCallback(() => {
    if (suggestions.length > 0) {
      // Navigate suggestions
      setSelectedSuggestionIndex(prev =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (commandHistory.length > 0) {
      // Navigate history
      isNavigatingHistoryRef.current = true;
      if (historyPosition === commandHistory.length) {
        originalInputRef.current = currentInput;
      }
      setHistoryPosition(prev => Math.max(0, prev - 1));
      setCurrentInput(commandHistory[Math.max(0, historyPosition - 1)]);
    }
  }, [suggestions, commandHistory, historyPosition, currentInput]);

  // Handle arrow down (navigate suggestions or history)
  const handleArrowDown = useCallback(() => {
    if (suggestions.length > 0) {
      // Navigate suggestions
      setSelectedSuggestionIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (commandHistory.length > 0) {
      // Navigate history
      isNavigatingHistoryRef.current = true;
      if (historyPosition < commandHistory.length) {
        const newPos = Math.min(commandHistory.length, historyPosition + 1);
        setHistoryPosition(newPos);
        if (newPos === commandHistory.length) {
          setCurrentInput(originalInputRef.current);
        } else {
          setCurrentInput(commandHistory[newPos]);
        }
      }
    }
  }, [suggestions, commandHistory, historyPosition]);

  // Handle Enter (submit or select suggestion)
  const handleEnter = useCallback(() => {
    if (suggestions.length > 0 && selectedSuggestionIndex >= 0) {
      // Select current suggestion
      setCurrentInput(suggestions[selectedSuggestionIndex]);
      setSuggestions([]);
    } else if (currentInput.trim()) {
      // Submit command
      onSubmit(currentInput.trim());
      setCurrentInput('');
      setHistoryPosition(commandHistory.length);
      isNavigatingHistoryRef.current = false;
    }
  }, [suggestions, selectedSuggestionIndex, currentInput, onSubmit, commandHistory.length]);

  // Handle Escape (clear suggestions)
  const handleEscape = useCallback(() => {
    setSuggestions([]);
    if (isNavigatingHistoryRef.current) {
      setCurrentInput(originalInputRef.current);
      isNavigatingHistoryRef.current = false;
    }
  }, []);

  // Navigate to specific history position
  const navigateHistory = useCallback((index: number) => {
    if (index >= 0 && index < commandHistory.length) {
      isNavigatingHistoryRef.current = true;
      setHistoryPosition(index);
      setCurrentInput(commandHistory[index]);
    }
  }, [commandHistory]);

  // Computed values
  const hasSuggestions = suggestions.length > 0;
  const showingHistory = isNavigatingHistoryRef.current && historyPosition < commandHistory.length;
  const completionPreview = hasSuggestions ? suggestions[0] : '';

  // Reset history navigation on input change (if not from arrow keys)
  const handleSetCurrentInput = useCallback((input: string) => {
    setCurrentInput(input);
    if (!isNavigatingHistoryRef.current) {
      setHistoryPosition(commandHistory.length);
      originalInputRef.current = '';
    }
  }, [commandHistory.length]);

  return {
    currentInput,
    setCurrentInput: handleSetCurrentInput,
    suggestions,
    selectedSuggestionIndex,
    historyPosition,
    totalHistory: commandHistory.length,
    handleTab,
    handleArrowUp,
    handleArrowDown,
    handleEnter,
    handleEscape,
    navigateHistory,
    hasSuggestions,
    showingHistory,
    completionPreview,
  };
}

// ============================================================================
// CONTEXTUAL COMMAND SUGGESTIONS
// ============================================================================

export interface RoomContext {
  npcs?: string[];
  items?: string[];
  exits?: string[];
  hasEncounter?: boolean;
}

export function getContextualCommands(roomContext: RoomContext): string[] {
  const commands: string[] = [];

  // Add NPC names for talk command
  if (roomContext.npcs && roomContext.npcs.length > 0) {
    roomContext.npcs.forEach(npc => {
      commands.push(`talk ${npc}`);
    });
  }

  // Add item names for take/examine commands
  if (roomContext.items && roomContext.items.length > 0) {
    roomContext.items.forEach(item => {
      commands.push(`take ${item}`);
      commands.push(`examine ${item}`);
    });
  }

  // Add exits for movement
  if (roomContext.exits && roomContext.exits.length > 0) {
    roomContext.exits.forEach(exit => {
      commands.push(exit);
      commands.push(`go ${exit}`);
    });
  }

  // Add encounter-related commands
  if (roomContext.hasEncounter) {
    commands.push('0', '1', '2', '3'); // Risk selection numbers
  }

  return commands;
}

// ============================================================================
// COMMAND SYNTAX HELPER
// ============================================================================

export function getCommandSyntax(command: string): string | null {
  const cmdDef = COMMAND_DATABASE.find(
    cmd => cmd.name === command.toLowerCase() || cmd.aliases.includes(command.toLowerCase())
  );
  return cmdDef ? cmdDef.syntax : null;
}

export function getCommandDescription(command: string): string | null {
  const cmdDef = COMMAND_DATABASE.find(
    cmd => cmd.name === command.toLowerCase() || cmd.aliases.includes(command.toLowerCase())
  );
  return cmdDef ? cmdDef.description : null;
}

export function getCommandCategory(command: string): string | null {
  const cmdDef = COMMAND_DATABASE.find(
    cmd => cmd.name === command.toLowerCase() || cmd.aliases.includes(command.toLowerCase())
  );
  return cmdDef ? cmdDef.category : null;
}
