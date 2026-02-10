/**
 * Bash Tool
 *
 * Executes bash commands in a shell session.
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { tool } from '@philschmid/agents-core';
import { z } from 'zod';
import { AgentContext } from '../../context';
import { resolvePath } from '../utils';

const execAsync = promisify(exec);

/**
 * Bash tool - executes shell commands with timeout and working directory support.
 */
export const bashTool = tool({
  name: 'bash',
  description:
    'Executes a given bash command in a shell session. Use this to run system commands, install dependencies, or manage the environment.',
  parameters: z.object({
    command: z.string().describe('The shell command to execute'),
    timeout: z
      .number()
      .optional()
      .default(120000)
      .describe('Timeout in milliseconds (default: 2 minutes)'),
    workdir: z.string().optional().describe('Working directory for the command'),
  }),
  label: 'Execute Bash Command',
  execute: async (_toolCallId, { command, timeout, workdir }, signal) => {
    try {
      const cwd = workdir ? resolvePath(AgentContext.cwd, workdir) : AgentContext.cwd;
      const { stdout, stderr } = await execAsync(command, {
        timeout,
        cwd,
        signal,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });
      return { result: `Exit Code: 0\n\nSTDOUT:\n${stdout}\n\nSTDERR:\n${stderr}` };
    } catch (error: unknown) {
      const err = error as { code?: number; stdout?: string; stderr?: string; message?: string };
      return {
        result: `Command failed.\nExit Code: ${err.code || 1}\n\nSTDOUT:\n${err.stdout || ''}\n\nSTDERR:\n${err.stderr || err.message}`,
        isError: true,
      };
    }
  },
});
