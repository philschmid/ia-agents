/**
 * List Directory Tool
 *
 * Lists files and directories with optional glob filtering.
 */

import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { tool } from '@philschmid/agents-core';
import { z } from 'zod';
import { AgentContext } from '../../context';
import { resolvePath } from '../utils';

const execFileAsync = promisify(execFile);

/**
 * List directory contents recursively, respecting gitignore.
 * Uses ripgrep for gitignore support with fallback to fs.readdir.
 */
async function listDirRecursively(dirPath: string, signal?: AbortSignal): Promise<string> {
  try {
    const { stdout } = await execFileAsync('rg', ['--files', '--sort', 'path', dirPath], {
      signal,
      maxBuffer: 10 * 1024 * 1024,
    });
    const files = stdout.trim().split('\n').filter(Boolean);

    if (files.length > 100) {
      const limited = files.slice(0, 100);
      return `Found ${files.length} files. Showing first 100:\n${limited.join('\n')}\n...`;
    }
    return files.join('\n');
  } catch {
    // Fallback to manual walk if rg fails
    try {
      const entries = await fs.readdir(dirPath, { recursive: true, withFileTypes: true });
      const paths = entries
        .filter((e) => e.isFile())
        .map((e) => path.join(e.parentPath, e.name))
        .slice(0, 100);
      return paths.join('\n');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return `Error listing directory: ${message}`;
    }
  }
}

/**
 * Find files by glob pattern using ripgrep.
 */
async function findFilesByGlob(
  pattern: string,
  root: string,
  signal?: AbortSignal
): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync('rg', ['--files', '--glob', pattern, root], {
      signal,
      maxBuffer: 10 * 1024 * 1024,
    });
    return stdout.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * List directory tool - lists files and directories, or filters by glob.
 */
export const listDirectoryTool = tool({
  name: 'list_directory',
  description: 'Lists files and directories, or filters by a glob pattern.',
  parameters: z.object({
    path: z
      .string()
      .optional()
      .describe('Path to directory. Defaults to current working directory.'),
    glob: z
      .string()
      .optional()
      .describe(
        'Optional glob pattern to filter files (e.g., "**/*.ts"). If provided, lists matching files instead of directory structure.'
      ),
  }),
  label: 'List Directory',
  execute: async (_toolCallId, { path: dirPath, glob }, signal) => {
    try {
      const targetDir = dirPath ? resolvePath(AgentContext.cwd, dirPath) : AgentContext.cwd;

      if (glob) {
        const files = await findFilesByGlob(glob, targetDir, signal);
        const result = files.length > 0 ? files.join('\n') : 'No matching files found.';
        return { result };
      }

      const result = await listDirRecursively(targetDir, signal);
      return { result };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { result: `Error listing directory: ${message}`, isError: true };
    }
  },
});
