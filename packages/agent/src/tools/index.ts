/**
 * Agent Tools
 *
 * Exported tools for agent package.
 */

import type { AgentTool } from '@philschmid/agents-core';

import { updatePlanTool } from './planning';
// Simple tools
import { sleepTool } from './sleep';

import { applyPatchTool } from './apply-patch';
import { bashTool } from './bash';
import { grepTool } from './grep';
import { listDirectoryTool } from './list-directory';
// Editor tools
import { readFileTool } from './read-file';
import { writeFileTool } from './write-file';

import { CONFIG } from '../config';
import { loadSkills, loadSubagents } from '../load_artifacts';
import { createSkillTool } from './skills';
import { createSubagentTool } from './subagent';
import type { ToolName } from './types';
// Web search tools
import { webFetchTool, webSearchTool } from './websearch';

// Re-export all static tools
export {
  sleepTool,
  updatePlanTool,
  readFileTool,
  writeFileTool,
  listDirectoryTool,
  grepTool,
  bashTool,
  applyPatchTool,
  webFetchTool,
  webSearchTool,
};

// Re-export skill and subagent tool factories and system instruction builders
export { createSkillTool, createSkillSystemInstruction } from './skills';
export { createSubagentTool, createSubagentSystemInstruction } from './subagent';
export type { ToolName } from './types';
export { DEFAULT_TOOL_NAMES } from './types';

/**
 * Tool map with user-friendly names.
 * Some names map to multiple tools (e.g., 'write' gives both write_file and apply_patch).
 * Skills/subagent tools are NOT included - use createSkillTool/createSubagentTool factories.
 */
const toolMap: Record<ToolName, AgentTool | AgentTool[]> = {
  sleep: sleepTool,
  plan: updatePlanTool,
  read: [readFileTool, listDirectoryTool],
  grep: grepTool,
  bash: bashTool,
  // 'write' provides both tools: simple write_file for new files, apply_patch for edits
  write: [writeFileTool, applyPatchTool],
  web_fetch: webFetchTool,
  web_search: webSearchTool,
  skills: createSkillTool(loadSkills(CONFIG.artifactsPath)),
  subagent: createSubagentTool(loadSubagents(CONFIG.artifactsPath)),
};

/**
 * Get tools by name.
 * Some tool names expand to multiple tools (e.g., 'write' returns both write_file and apply_patch).
 *
 * @example
 * ```ts
 * const tools = getTools(['read', 'write', 'bash']);
 * // Returns: [readFileTool, writeFileTool, applyPatchTool, bashTool]
 * ```
 */
export function getTools(names: ToolName[]): AgentTool[] {
  const result: AgentTool[] = [];
  for (const name of names) {
    const tools = toolMap[name];
    if (!tools) {
      throw new Error(`Unknown tool: ${name}`);
    }
    if (Array.isArray(tools)) {
      result.push(...tools);
    } else {
      result.push(tools);
    }
  }
  return result;
}
