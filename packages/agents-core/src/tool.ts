/**
 * Tool Factory
 *
 * Creates tool definitions using Zod schemas for type-safe parameter validation.
 * Converts Zod schemas to JSON Schema for LLM API compatibility.
 */

import { z } from 'zod';
import type { AgentTool, ToolConfig } from './types';

// Re-export ToolConfig for external use
export type { ToolConfig } from './types';

// ============================================================================
// Tool Factory
// ============================================================================

/**
 * Creates a tool definition from a Zod schema.
 *
 * Converts the Zod schema to JSON Schema format for LLM API compatibility.
 *
 * @example
 * ```typescript
 * const sleepTool = tool({
 *   name: 'sleep',
 *   description: 'Pause execution for a specified duration',
 *   parameters: z.object({
 *     duration_ms: z.number().int().min(0).max(60000).describe('Duration in milliseconds'),
 *   }),
 *   execute: async (toolCallId, { duration_ms }) => {
 *     await new Promise((resolve) => setTimeout(resolve, duration_ms));
 *     return { result: `Slept for ${duration_ms}ms.` };
 *   },
 * });
 * ```
 */
export function tool<TInput extends z.ZodType<unknown>>(config: ToolConfig<TInput>): AgentTool {
  // Convert Zod schema to JSON Schema using native Zod v4 conversion
  const jsonSchema = z.toJSONSchema(config.parameters, {
    target: 'draft-07', // Use draft-07 for broader compatibility with LLM APIs
    unrepresentable: 'any', // Convert unsupported types to empty object instead of throwing
  });

  return {
    name: config.name,
    description: config.description,
    parameters: jsonSchema as Record<string, unknown>,
    label: config.label ?? config.name,
    execute: config.execute as AgentTool['execute'],
  };
}
