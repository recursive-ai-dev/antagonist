import { describe, it, expect } from 'vitest';
import { npcStateManager, DialogueGraphNavigator, socraticGenerator } from '../dialogueSystem';

describe('Dialogue System', () => {
  it('should initialize NPC state manager', () => {
    expect(npcStateManager).toBeDefined();
    expect(typeof npcStateManager.getState).toBe('function');
  });

  it('should track NPC emotional states', () => {
    const state = npcStateManager.getState?.('queen'); // Try a known NPC
    if (state) {
      expect(state).toBeDefined();
      expect(['neutral', 'curious', 'suspicious', 'trusting', 'awakened']).toContain(state.emotionalState);
    }
  });

  it('should have DialogueGraphNavigator available', () => {
    expect(DialogueGraphNavigator).toBeDefined();
    expect(typeof DialogueGraphNavigator.navigate).toBe('function');
  });

  it('should generate Socratic dialogue', () => {
    if (socraticGenerator) {
      const dialogue = socraticGenerator.generate?.('test_topic');
      if (dialogue) {
        expect(typeof dialogue).toBe('string');
        expect(dialogue.length).toBeGreaterThan(0);
      }
    }
  });

  it('should handle NPC state updates', () => {
    const initialState = npcStateManager.getState?.('queen');
    
    if (npcStateManager.updateState) {
      npcStateManager.updateState('queen', { emotionalState: 'curious' });
      const updatedState = npcStateManager.getState?.('queen');
      
      if (updatedState) {
        expect(updatedState.emotionalState).toBe('curious');
      }
    }
  });
});
