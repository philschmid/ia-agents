/**
 * Tool Utilities
 *
 * Shared helpers for agent tools.
 */

import path from 'node:path';

/**
 * Resolve a file path to absolute, handling both relative and absolute paths.
 *
 * @param cwd - Current working directory
 * @param filePath - File path to resolve (relative or absolute)
 * @returns Absolute file path
 */
export function resolvePath(cwd: string, filePath: string): string {
  if (path.isAbsolute(filePath)) {
    return path.resolve(filePath);
  }
  return path.resolve(cwd, filePath);
}
