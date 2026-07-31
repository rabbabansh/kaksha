export const MASTERY_ALPHA = 0.2; // The weight of the most recent answer (20%)

/**
 * Calculates the new mastery level based on a simple Exponential Moving Average (EMA).
 * This approximates Bayesian Knowledge Tracing by weighting recent answers more heavily.
 * 
 * @param currentMastery The current mastery level (0.0 to 1.0)
 * @param isCorrect Whether the most recent attempt was correct
 * @returns The new mastery level (0.0 to 1.0)
 */
export function calculateNewMastery(currentMastery: number, isCorrect: boolean): number {
  const target = isCorrect ? 1.0 : 0.0;
  
  // If it's their very first attempt (mastery is exactly 0.0 and no history), 
  // a correct answer gives a slightly higher initial bump to avoid the cold start drag.
  if (currentMastery === 0.0 && isCorrect) {
    return 0.3; // Initial bump
  }

  const newMastery = (currentMastery * (1 - MASTERY_ALPHA)) + (target * MASTERY_ALPHA);
  
  // Clamp between 0.0 and 1.0 just in case
  return Math.max(0.0, Math.min(1.0, newMastery));
}

/**
 * Maps a mastery float (0.0 - 1.0) to a gamified letter grade.
 */
export function getGradeFromMastery(mastery: number): string {
  if (mastery >= 0.90) return 'A';
  if (mastery >= 0.80) return 'B';
  if (mastery >= 0.70) return 'C';
  if (mastery >= 0.60) return 'D';
  return 'F';
}

/**
 * Determines if an attempt source should count towards mastery updates.
 * Sources 'training' and 'bank' are ignored.
 */
export function shouldUpdateMastery(source: string): boolean {
  return ['diagnostic', 'practice', 'mock'].includes(source);
}
