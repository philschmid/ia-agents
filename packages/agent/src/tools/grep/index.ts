/**
 * Grep Tool
 *
 * Searches for text content within files.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tool } from '@philschmid/agents-core';
import { z } from 'zod';
import { AgentContext } from '../../context';
import { resolvePath } from '../utils';

const execFileAsync = promisify(execFile);

/**
 * Search for text content within files using ripgrep.
 */
async function grepInFiles(
  pattern: string,
  root: string,
  include?: string,
  signal?: AbortSignal
): Promise<string> {
  try {
    const args = ['-nH', '-e', pattern];
    if (include) {
      args.push('--glob', include);
    }
    args.push(root);

    const { stdout } = await execFileAsync('rg', args, { signal, maxBuffer: 10 * 1024 * 1024 });
    // Limit output to 100 lines
    const lines = stdout.split('\n');
    if (lines.length > 100) {
      return `${lines.slice(0, 100).join('\n')}\n...(truncated)`;
    }
    return stdout || 'No matches found.';
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return `No matches found or error: ${message}`;
  }
}

/**
 * Grep tool - searches for text content within files using regex.
 */
export const grepTool = tool({
  name: 'grep',
  description: 'Searches for text content within files using regex.',
  parameters: z.object({
    pattern: z.string().describe('Regex pattern to search for'),
    path: z.string().optional().describe('Directory to search in'),
    include: z.string().optional().describe('Glob pattern to filter files (e.g., "*.ts")'),
  }),
  label: 'Search Files',
  execute: async (_toolCallId, { pattern, path: rootPath, include }, signal) => {
    try {
      const targetDir = rootPath ? resolvePath(AgentContext.cwd, rootPath) : AgentContext.cwd;
      const result = await grepInFiles(pattern, targetDir, include, signal);
      return { result };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { result: `Error executing grep: ${message}`, isError: true };
    }
  },
});
