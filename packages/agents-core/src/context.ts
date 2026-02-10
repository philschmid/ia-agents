/**
 * Context Transformations
 *
 * Utilities for transforming and managing conversation context.
 */

import type { Turn } from './types';

/**
 * Prune old turns to fit within a limit.
 *
 * @param interactions - Full conversation history
 * @param maxTurns - Maximum number of turns to keep
 * @returns Pruned conversation history
 */
export function pruneContext(interactions: Turn[], maxTurns: number): Turn[] {
  if (interactions.length <= maxTurns) {
    return interactions;
  }
  return interactions.slice(-maxTurns);
}
