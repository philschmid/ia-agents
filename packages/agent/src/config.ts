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
  /** Subagent names to disable (won't be loaded or available) */
  disabledSubagents: z.array(z.string()).default([]),
  /** Skill names to disable (won't be loaded or available) */
  disabledSkills: z.array(z.string()).default([]),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// ============================================================================
// Agent Config Loading
// ============================================================================

/** Parse a comma-separated env var into a trimmed, non-empty string array. */
function parseCommaSeparated(value: string): string[] {
  return value
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/**
 * Load agent config from env vars + settings.json.
 *
 * Handles AGENT_DEFAULT_TOOLS as comma-separated string.
 */
export function loadAgentConfig(settingsPath?: string): AgentConfig {
  const baseConfig = loadConfig(AgentConfigSchema, settingsPath);
  const env = process.env;

  return {
    ...baseConfig,
    ...(env.AGENT_DEFAULT_TOOLS && { defaultTools: parseCommaSeparated(env.AGENT_DEFAULT_TOOLS) }),
    ...(env.AGENT_ARTIFACTS_PATH && { artifactsPath: env.AGENT_ARTIFACTS_PATH }),
    ...(env.AGENT_STREAM_SUBAGENTS && { streamSubagents: env.AGENT_STREAM_SUBAGENTS === 'true' }),
    ...(env.AGENT_DISABLED_SUBAGENTS && {
      disabledSubagents: parseCommaSeparated(env.AGENT_DISABLED_SUBAGENTS),
    }),
    ...(env.AGENT_DISABLED_SKILLS && {
      disabledSkills: parseCommaSeparated(env.AGENT_DISABLED_SKILLS),
    }),
  };
}

// ============================================================================
// Global Agent Config Singleton
// ============================================================================

/**
 * Global agent configuration loaded once at module import.
 */
export const CONFIG: AgentConfig = loadAgentConfig();
