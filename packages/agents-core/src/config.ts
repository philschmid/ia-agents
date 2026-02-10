/**
 * Configuration
 *
 * Typesafe configuration from env vars + settings.json.
 * Extensible via Zod schema.
 */

import { existsSync, readFileSync } from 'node:fs';
import { z } from 'zod';
import { createDebug } from './utils/debug';

const log = createDebug('config');

// ============================================================================
// Core Config Schema
// ============================================================================

/**
 * Base configuration schema for agents-core.
 * Other packages can extend this via `CoreConfigSchema.extend({...})`.
 */
export const CoreConfigSchema = z.object({
  /** Default model identifier */
  defaultModel: z.string().default('gemini-3-flash-preview'),
  /** Maximum iterations in agent loop */
  maxIterations: z.number().int().positive().default(100),
});

export type CoreConfig = z.infer<typeof CoreConfigSchema>;

// ============================================================================
// Config Loading
// ============================================================================

/**
 * Load config from environment variables and settings.json.
 *
 * Priority: env vars > settings.json > defaults
 *
 * @param schema - Zod schema to validate against (default: CoreConfigSchema)
 * @param settingsPath - Path to settings.json (default: AGENT_SETTINGS_PATH or ./settings.json)
 * @returns Validated configuration object
 *
 * @example
 * ```typescript
 * // Use core config
 * const config = loadConfig();
 *
 * // Extend with custom schema
 * const MySchema = CoreConfigSchema.extend({ myOption: z.string() });
 * const config = loadConfig(MySchema);
 * ```
 */
export function loadConfig<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T = CoreConfigSchema as unknown as T,
  settingsPath?: string
): z.infer<T> {
  const resolvedPath = settingsPath || process.env.AGENT_SETTINGS_PATH || './settings.json';

  // Load JSON file if exists
  let fileConfig: Record<string, unknown> = {};
  if (existsSync(resolvedPath)) {
    try {
      const content = readFileSync(resolvedPath, 'utf-8');
      fileConfig = JSON.parse(content);
    } catch (error) {
      log('Failed to parse settings file %s: %s', resolvedPath, error);
    }
  }

  // Build config from env vars
  const envConfig: Record<string, unknown> = {};

  if (process.env.AGENT_DEFAULT_MODEL) {
    envConfig.defaultModel = process.env.AGENT_DEFAULT_MODEL;
  }
  if (process.env.AGENT_MAX_ITERATIONS) {
    const parsed = Number.parseInt(process.env.AGENT_MAX_ITERATIONS, 10);
    if (!Number.isNaN(parsed)) {
      envConfig.maxIterations = parsed;
    }
  }

  // Merge: env > file > defaults (Zod handles defaults)
  const merged = {
    ...fileConfig,
    ...envConfig,
  };

  return schema.parse(merged);
}

// ============================================================================
// Global Config Singleton
// ============================================================================

/**
 * Global configuration loaded once at module import.
 * Use this instead of calling loadConfig() repeatedly.
 */
export const CONFIG: CoreConfig = loadConfig(CoreConfigSchema);
