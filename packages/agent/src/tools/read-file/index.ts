/**
 * Read File Tool
 *
 * Reads a file from the local filesystem with line numbers.
 */

import fs from 'node:fs/promises';
import { tool } from '@philschmid/agents-core';
import { z } from 'zod';
import { AgentContext } from '../../context';
import { resolvePath } from '../utils';

/**
 * Read a file with line numbers prefixed to each line.
 */
async function readFileWithLineNumbers(
  filePath: string,
  offset = 0,
  limit = 2000
): Promise<string> {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');

  // Simple check if binary (heuristic)
  if (content.includes('\0')) {
    return 'Binary file content not shown.';
  }

  const selectedLines = lines.slice(offset, offset + limit);

  return selectedLines
    .map((line, index) => {
      const lineNum = (offset + index + 1).toString().padStart(5, '0');
      return `${lineNum}|${line}`;
    })
    .join('\n');
}

/**
 * Read file tool - reads a file and returns content with line numbers.
 */
export const readFileTool = tool({
  name: 'read_file',
  description: 'Reads a file from the local filesystem. Returns content with line numbers.',
  parameters: z.object({
    filePath: z.string().describe('The absolute or relative path to the file'),
    offset: z
      .number()
      .optional()
      .default(0)
      .describe('Line number to start reading from (0-based)'),
    limit: z.number().optional().default(2000).describe('Number of lines to read'),
  }),
  label: 'Read File',
  execute: async (_toolCallId, { filePath, offset, limit }) => {
    try {
      const absolutePath = resolvePath(AgentContext.cwd, filePath);
      const content = await readFileWithLineNumbers(absolutePath, offset, limit);
      return { result: content };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { result: `Error reading file ${filePath}: ${message}`, isError: true };
    }
  },
});
