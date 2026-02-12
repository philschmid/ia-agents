/**
 * Load Artifacts - Loader
 *
 * Discovery and loading of skills and subagents from disk.
 * Supports multi-path loading with project > global > built-in precedence.
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDebug } from '@philschmid/agents-core';
import type { z } from 'zod';
import { CONFIG } from '../config';
import { parseArtifact } from './parser';
import {
  type ArtifactLayer,
  type ArtifactSource,
  type Skill,
  SkillMetadataSchema,
  type Subagent,
  SubagentMetadataSchema,
} from './types';

const log = createDebug('artifacts');

// ============================================================================
// Built-in Artifacts Path
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Find the package root by walking up from the current file.
 * Works from both source (src/load_artifacts/loader.ts) and compiled (dist/index.js).
 */
function findPackageRoot(startDir: string): string {
  let dir = startDir;
  // Walk up at most 5 levels to find a directory with package.json + skills/
  for (let i = 0; i < 5; i++) {
    if (existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'skills'))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break; // filesystem root
    dir = parent;
  }
  // Fallback: assume 2 levels up from source location
  return resolve(startDir, '../..');
}

/**
 * Path to built-in artifacts shipped with @philschmid/agent.
 * Uses findPackageRoot to work from both source and compiled output.
 */
const BUILTIN_ARTIFACTS_PATH = findPackageRoot(__dirname);

// ============================================================================
// Default Layers
// ============================================================================

/**
 * Get the default artifact discovery layers.
 * Paths are configurable via env vars.
 *
 * Precedence: project > global > built-in (first match wins on name collision).
 */
export function getDefaultLayers(): ArtifactLayer[] {
  const projectPath = process.env.AGENT_ARTIFACTS_PATH ?? CONFIG.artifactsPath;
  const globalPath = process.env.AGENT_GLOBAL_ARTIFACTS_PATH ?? join(homedir(), '.agent');

  return [
    { path: projectPath, source: 'project' },
    { path: globalPath, source: 'global' },
    { path: BUILTIN_ARTIFACTS_PATH, source: 'builtin' },
  ];
}

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
 * Load skills from a single directory.
 * Returns skills without source tag (caller adds it).
 */
function loadSkillsFromDir(basePath: string): Omit<Skill, 'source'>[] {
  const skillsDir = join(basePath, 'skills');

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
    .filter((skill): skill is Omit<Skill, 'source'> => skill !== null);
}

/**
 * Discover and load all skills from multiple layers.
 * Deduplicates by name — project wins over global wins over built-in.
 *
 * @param layers - Artifact layers to scan (defaults to project + global + built-in)
 */
export function loadSkills(layers?: ArtifactLayer[]): Skill[] {
  const resolvedLayers = layers ?? getDefaultLayers();
  const seen = new Set<string>();
  const result: Skill[] = [];

  for (const layer of resolvedLayers) {
    const skills = loadSkillsFromDir(layer.path);
    for (const skill of skills) {
      if (!seen.has(skill.name)) {
        seen.add(skill.name);
        result.push({ ...skill, source: layer.source });
      } else {
        log('Skipping duplicate skill "%s" from %s (already loaded)', skill.name, layer.source);
      }
    }
  }

  return result;
}

// ============================================================================
// Subagent Loading
// ============================================================================

/**
 * Load subagents from a single directory.
 * Returns subagents without source tag (caller adds it).
 */
function loadSubagentsFromDir(basePath: string): Omit<Subagent, 'source'>[] {
  const subagentsDir = join(basePath, 'subagents');

  if (!existsSync(subagentsDir)) {
    return [];
  }

  return readdirSync(subagentsDir)
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => join(subagentsDir, entry))
    .filter((entryPath) => statSync(entryPath).isFile())
    .map((filePath): Omit<Subagent, 'source'> | null => {
      const result = loadArtifact(filePath, SubagentMetadataSchema);
      if (!result) return null;

      const { path: _path, ...rest } = result;
      return rest;
    })
    .filter((subagent): subagent is Omit<Subagent, 'source'> => subagent !== null);
}

/**
 * Discover and load all subagents from multiple layers.
 * Deduplicates by name — project wins over global wins over built-in.
 *
 * @param layers - Artifact layers to scan (defaults to project + global + built-in)
 */
export function loadSubagents(layers?: ArtifactLayer[]): Subagent[] {
  const resolvedLayers = layers ?? getDefaultLayers();
  const seen = new Set<string>();
  const result: Subagent[] = [];

  for (const layer of resolvedLayers) {
    const subagents = loadSubagentsFromDir(layer.path);
    for (const subagent of subagents) {
      if (!seen.has(subagent.name)) {
        seen.add(subagent.name);
        result.push({ ...subagent, source: layer.source });
      } else {
        log(
          'Skipping duplicate subagent "%s" from %s (already loaded)',
          subagent.name,
          layer.source
        );
      }
    }
  }

  return result;
}
