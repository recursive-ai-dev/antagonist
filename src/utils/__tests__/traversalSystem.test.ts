import { describe, it, expect } from 'vitest';
import { 
  TRAVERSAL_MODES, 
  MOMENTUM_CONFIG, 
  calculateMomentumDecay,
  calculateStanceBonus
} from '../traversalSystem';

describe('Traversal System', () => {
  it('should export traversal modes with proper stats', () => {
    expect(TRAVERSAL_MODES).toBeDefined();
    expect(TRAVERSAL_MODES.walk).toBeDefined();
    expect(TRAVERSAL_MODES.crawl).toBeDefined();
    expect(TRAVERSAL_MODES.burrow).toBeDefined();

    // Verify stat structure
    Object.values(TRAVERSAL_MODES).forEach(mode => {
      expect(mode.speed).toBeGreaterThan(0);
      expect(mode.noise).toBeGreaterThanOrEqual(0);
      expect(mode.noise).toBeLessThanOrEqual(1);
      expect(mode.observation).toBeGreaterThanOrEqual(0);
      expect(mode.energyCost).toBeGreaterThan(0);
    });
  });

  it('should have valid momentum configuration', () => {
    expect(MOMENTUM_CONFIG).toBeDefined();
    expect(MOMENTUM_CONFIG.MAX_MOMENTUM).toBeGreaterThan(0);
    expect(MOMENTUM_CONFIG.THRESHOLD_STANCE).toBeLessThan(MOMENTUM_CONFIG.MAX_MOMENTUM);
  });

  it('should calculate momentum decay', () => {
    if (calculateMomentumDecay) {
      const decay = calculateMomentumDecay(50);
      expect(typeof decay).toBe('number');
      expect(decay).toBeGreaterThanOrEqual(0);
      expect(decay).toBeLessThanOrEqual(50);
    }
  });

  it('should calculate stance bonus correctly', () => {
    if (calculateStanceBonus) {
      const bonus = calculateStanceBonus(100); // Max momentum  
      expect(typeof bonus).toBe('number');
      expect(bonus).toBeGreaterThanOrEqual(0);
    }
  });
});
