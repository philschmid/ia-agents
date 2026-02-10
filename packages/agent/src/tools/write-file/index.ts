/**
 * Write File Tool
 *
 * Writes content to a file, creating directories as needed.
 * Simpler alternative to apply_patch for creating or overwriting files.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { tool } from '@philschmid/agents-core';
import { z } from 'zod';
import { AgentContext } from '../../context';
import { resolvePath } from '../utils';

/**
 * Write file tool - writes content to a file, overwriting or creating new.
 * Use this for creating new files or completely replacing existing ones.
 * For surgical edits to existing files, use apply_patch instead.
 */
export const writeFileTool = tool({
  name: 'write_file',
  description: `Write content to a file, creating it if it doesn't exist or overwriting if it does.
Use this tool only when you need to:
- Create a new file with specific content
- Completely replace an existing file's content

For surgical edits to existing files (changing specific lines), use apply_patch instead.

The file path can be absolute or relative to the working directory.
Parent directories will be created automatically if they don't exist.`,
  parameters: z.object({
    filePath: z.string().describe('The path to the file (absolute or relative to cwd)'),
    content: z.string().describe('The full content to write to the file'),
  }),
  label: 'Write File',
  execute: async (_toolCallId, { filePath, content }) => {
    try {
      const absolutePath = resolvePath(AgentContext.cwd, filePath);

      // Create directories if needed
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, content, 'utf-8');

      return { result: `Successfully wrote to ${filePath}` };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { result: `Error writing file ${filePath}: ${message}`, isError: true };
    }
  },
});
