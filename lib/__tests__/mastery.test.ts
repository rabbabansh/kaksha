import { describe, it, expect } from 'vitest';
import { calculateNewMastery, getGradeFromMastery, shouldUpdateMastery } from '../mastery';

describe('mastery', () => {
  describe('calculateNewMastery', () => {
    it('gives a 0.3 bump for the first correct attempt', () => {
      const newMastery = calculateNewMastery(0.0, true);
      expect(newMastery).toBe(0.3);
    });

    it('calculates correctly for subsequent correct attempts (alpha = 0.2)', () => {
      // (0.3 * 0.8) + (1.0 * 0.2) = 0.24 + 0.20 = 0.44
      const newMastery = calculateNewMastery(0.3, true);
      expect(newMastery).toBeCloseTo(0.44, 2);
    });

    it('calculates correctly for incorrect attempts (alpha = 0.2)', () => {
      // (0.5 * 0.8) + (0.0 * 0.2) = 0.40
      const newMastery = calculateNewMastery(0.5, false);
      expect(newMastery).toBeCloseTo(0.40, 2);
    });

    it('clamps mastery between 0 and 1', () => {
      expect(calculateNewMastery(-0.1, false)).toBeGreaterThanOrEqual(0.0);
      expect(calculateNewMastery(1.1, true)).toBeLessThanOrEqual(1.0);
    });
  });

  describe('getGradeFromMastery', () => {
    it('returns A for >= 0.90', () => {
      expect(getGradeFromMastery(0.95)).toBe('A');
      expect(getGradeFromMastery(0.90)).toBe('A');
    });
    
    it('returns B for >= 0.80', () => {
      expect(getGradeFromMastery(0.85)).toBe('B');
    });

    it('returns C for >= 0.70', () => {
      expect(getGradeFromMastery(0.75)).toBe('C');
    });

    it('returns D for >= 0.60', () => {
      expect(getGradeFromMastery(0.65)).toBe('D');
    });

    it('returns F for < 0.60', () => {
      expect(getGradeFromMastery(0.59)).toBe('F');
      expect(getGradeFromMastery(0.0)).toBe('F');
    });
  });

  describe('shouldUpdateMastery', () => {
    it('returns true for valid sources', () => {
      expect(shouldUpdateMastery('diagnostic')).toBe(true);
      expect(shouldUpdateMastery('practice')).toBe(true);
      expect(shouldUpdateMastery('mock')).toBe(true);
    });

    it('returns false for invalid sources', () => {
      expect(shouldUpdateMastery('training')).toBe(false);
      expect(shouldUpdateMastery('bank')).toBe(false);
      expect(shouldUpdateMastery('chat')).toBe(false);
    });
  });
});
