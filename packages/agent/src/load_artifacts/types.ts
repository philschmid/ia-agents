/**
 * Load Artifacts - Type Definitions
 *
 * Zod schemas for skill and subagent metadata.
 */

import { z } from 'zod';

// ============================================================================
// Skill Schema
// ============================================================================

/**
 * Skill metadata from SKILL.md frontmatter.
 */
export const SkillMetadataSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export type SkillMetadata = z.infer<typeof SkillMetadataSchema>;

/**
 * Loaded skill with parsed content.
 */
export type Skill = SkillMetadata & {
  /** Markdown body (instructions) */
  content: string;
  /** Path to the skill directory */
  path: string;
};

// ============================================================================
// Subagent Schema
// ============================================================================

/**
 * Subagent metadata from <name>.md frontmatter.
 */
export const SubagentMetadataSchema = z.object({
  name: z.string(),
  description: z.string(),
  /** Tool names to provide to the subagent */
  tools: z.array(z.string()).optional(),
  /** Skill names to load for the subagent */
  skills: z.array(z.string()).optional(),
  /** Model to use for the subagent */
  model: z.string().optional(),
});

export type SubagentMetadata = z.infer<typeof SubagentMetadataSchema>;

/**
 * Loaded subagent with parsed content.
 */
export type Subagent = SubagentMetadata & {
  /** Markdown body (system instruction) */
  content: string;
};
