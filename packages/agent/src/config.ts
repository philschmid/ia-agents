/**
 * Agent Configuration
 *
 * Extends CoreConfigSchema with agent-specific options.
 */

import { CoreConfigSchema, loadConfig } from '@philschmid/agents-core';
import { z } from 'zod';
import { DEFAULT_TOOL_NAMES } from './tools/types';

// ============================================================================
// Agent Config Schema
// ============================================================================

/**
 * Agent configuration schema extending core config.
 */
export const AgentConfigSchema = CoreConfigSchema.extend({
  /** Default tools to load (e.g., ['read', 'write', 'bash']). Defaults to all tools. */
  defaultTools: z.array(z.string()).default([...DEFAULT_TOOL_NAMES]),
  /** Base path for artifacts (skills, subagents). Defaults to .agent */
  artifactsPath: z.string().default('.agent'),
  /** Stream subagent output to main agent */
  streamSubagents: z.boolean().default(false),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// ============================================================================
// Agent Config Loading
// ============================================================================

/**
 * Load agent config from env vars + settings.json.
 *
 * Handles AGENT_DEFAULT_TOOLS as comma-separated string.
 */
export function loadAgentConfig(settingsPath?: string): AgentConfig {
  const baseConfig = loadConfig(AgentConfigSchema, settingsPath);
  let config = baseConfig;

  // Override defaultTools from env var if present (comma-separated)
  if (process.env.AGENT_DEFAULT_TOOLS) {
    const toolsFromEnv = process.env.AGENT_DEFAULT_TOOLS.split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    config = { ...config, defaultTools: toolsFromEnv };
  }

  // Override artifactsPath from env var if present
  if (process.env.AGENT_ARTIFACTS_PATH) {
    config = { ...config, artifactsPath: process.env.AGENT_ARTIFACTS_PATH };
  }

  // Override streamSubagents from env var if present
  if (process.env.AGENT_STREAM_SUBAGENTS) {
    config = { ...config, streamSubagents: process.env.AGENT_STREAM_SUBAGENTS === 'true' };
  }

  return config;
}

// ============================================================================
// Global Agent Config Singleton
// ============================================================================

/**
 * Global agent configuration loaded once at module import.
 */
export const CONFIG: AgentConfig = loadAgentConfig();
