/**
 * Load Artifacts - Loader
 *
 * Discovery and loading of skills and subagents from disk.
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createDebug } from '@philschmid/agents-core';
import type { z } from 'zod';
import { CONFIG } from '../config';
import { parseArtifact } from './parser';
import { type Skill, SkillMetadataSchema, type Subagent, SubagentMetadataSchema } from './types';

const log = createDebug('artifacts');

// ============================================================================
// Generic Artifact Loading
// ============================================================================

/**
 * Loaded artifact with parsed metadata and content.
 */
export type LoadedArtifact<T> = T & {
  /** Markdown body content */
  content: string;
  /** Path to the artifact file */
  path: string;
};

/**
 * Load an artifact file and validate its frontmatter against a schema.
 *
 * @param filePath - Path to the artifact file
 * @param schema - Zod schema to validate frontmatter
 * @returns Parsed metadata, content, and path, or null if invalid
 */
export function loadArtifact<T extends z.ZodObject<z.ZodRawShape>>(
  filePath: string,
  schema: T
): LoadedArtifact<z.infer<T>> | null {
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const { frontmatter, content } = parseArtifact(filePath);
    const metadata = schema.parse(frontmatter);
    return {
      ...metadata,
      content,
      path: filePath,
    };
  } catch (error) {
    log('Failed to load artifact %s: %s', filePath, error);
    return null;
  }
}

// ============================================================================
// Skill Loading
// ============================================================================

/**
 * Discover and load all skills from the skills directory.
 * Skills are directories containing a SKILL.md file.
 */
export function loadSkills(basePath?: string): Skill[] {
  const skillsDir = join(basePath ?? CONFIG.artifactsPath, 'skills');

  if (!existsSync(skillsDir)) {
    return [];
  }

  return readdirSync(skillsDir)
    .map((entry) => join(skillsDir, entry))
    .filter((entryPath) => statSync(entryPath).isDirectory())
    .map((skillDir) => {
      const skillFile = join(skillDir, 'SKILL.md');
      const result = loadArtifact(skillFile, SkillMetadataSchema);
      if (!result) return null;

      return {
        name: result.name,
        description: result.description,
        content: result.content,
        path: skillDir,
      };
    })
    .filter((skill): skill is Skill => skill !== null);
}

// ============================================================================
// Subagent Loading
// ============================================================================

/**
 * Discover and load all subagents from the subagents directory.
 * Subagents are .md files with frontmatter.
 */
export function loadSubagents(basePath?: string): Subagent[] {
  const subagentsDir = join(basePath ?? CONFIG.artifactsPath, 'subagents');

  if (!existsSync(subagentsDir)) {
    return [];
  }

  return readdirSync(subagentsDir)
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => join(subagentsDir, entry))
    .filter((entryPath) => statSync(entryPath).isFile())
    .map((filePath): Subagent | null => {
      const result = loadArtifact(filePath, SubagentMetadataSchema);
      if (!result) return null;

      return {
        name: result.name,
        description: result.description,
        ...(result.tools && { tools: result.tools }),
        ...(result.skills && { skills: result.skills }),
        ...(result.model && { model: result.model }),
        content: result.content,
      };
    })
    .filter((subagent): subagent is Subagent => subagent !== null);
}
