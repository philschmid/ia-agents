import type { AgentTool } from '@philschmid/agents-core';
import { CONFIG } from '../config';
import { loadSkills, loadSubagents } from '../load_artifacts';
import { createSkillSystemInstruction } from '../tools/skills';
import { createSubagentSystemInstruction } from '../tools/subagent';

/**
 * Build combined system instruction for all tool-specific instructions.
 * Checks which tools are present and appends the appropriate system instruction sections.
 *
 * @param initialSystemInstruction - Base system instruction to append to
 * @param tools - Array of tools to check for skills/subagent tools
 * @returns Combined system instruction with appended sections for skills and subagents
 */
export function buildToolSystemInstruction(
  initialSystemInstruction: string,
  tools: AgentTool[]
): string {
  let result = initialSystemInstruction;

  // Add skills section if skills tool is present
  const hasSkillsTool = tools.some((t) => t.name === 'skills');
  if (hasSkillsTool) {
    const skills = loadSkills().filter((s) => !CONFIG.disabledSkills.includes(s.name));
    const skillsSection = createSkillSystemInstruction(skills);
    result += skillsSection;
  }

  // Add subagents section if subagent tool is present
  const hasSubagentTool = tools.some((t) => t.name === 'delegate_to_subagent');
  if (hasSubagentTool) {
    const subagents = loadSubagents().filter((s) => !CONFIG.disabledSubagents.includes(s.name));
    const subagentsSection = createSubagentSystemInstruction(subagents);
    result += subagentsSection;
  }

  return result;
}
