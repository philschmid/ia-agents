/**
 * Debug utility for conditional logging.
 * Enable via DEBUG=true or DEBUG=agents-core environment variable.
 */

const DEBUG_ENABLED =
  process.env.DEBUG === 'true' ||
  process.env.DEBUG === '1' ||
  process.env.DEBUG === 'agents-core' ||
  (process.env.DEBUG?.includes('agents-core') ?? false);

/**
 * Create a namespaced debug logger.
 * @param namespace - The namespace prefix for log messages (e.g., 'googleSearch', 'fetchUrl')
 * @returns A debug function that logs when DEBUG is enabled
 */
export function createDebug(namespace: string) {
  return (message: string, ...args: unknown[]) => {
    if (DEBUG_ENABLED) {
      const timestamp = new Date().toISOString().slice(11, 23); // HH:mm:ss.SSS
      console.log(`[${timestamp}] [${namespace}] ${message}`, ...args);
    }
  };
}

/**
 * Global debug function without namespace.
 */
export const debug = createDebug('agents-core');

/**
 * Check if debug mode is enabled.
 */
export function isDebugEnabled(): boolean {
  return DEBUG_ENABLED;
}
