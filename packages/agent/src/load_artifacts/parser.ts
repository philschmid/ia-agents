/**
 * Load Artifacts - Parser
 *
 * YAML frontmatter + markdown body parser using gray-matter.
 */

import { readFileSync } from 'node:fs';
import matter from 'gray-matter';

/**
 * Parse an artifact file into frontmatter and content.
 *
 * @param filePath - Path to the file to parse
 * @returns Parsed frontmatter (YAML) and content (markdown body)
 */
export function parseArtifact(filePath: string): {
  frontmatter: Record<string, unknown>;
  content: string;
} {
  const raw = readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  return { frontmatter: data, content: content.trim() };
}
