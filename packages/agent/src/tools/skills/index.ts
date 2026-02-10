/**
 * Skills Tool
 *
 * Allows the agent to load skill content into its context on demand.
 * Skills are discovered from the artifacts path and presented to the LLM
 * for selection based on task requirements.
 */

import { tool } from '@philschmid/agents-core';
import type { AgentTool } from '@philschmid/agents-core';
import { z } from 'zod';
import type { Skill } from '../../load_artifacts';

// ============================================================================
// System Instruction Builder
// ============================================================================

/**
 * Build the skills section for the system instruction.
 *
 * @param skills - Array of skills to include in the instruction
 * @returns System instruction string, or empty string if no skills
 */
export function createSkillSystemInstruction(skills: Skill[]): string {
  const skillList = skills
    .map((s) => `  <skill name="${s.name}">${s.description}</skill>`)
    .join('\n');

  return `<skills>
You have access to specialized skills that provide domain knowledge and capabilities. Use the \`skills\` tool to load a skill's content when relevant to the user's task.

<available_skills>
${skillList}
</available_skills>

**BLOCKING REQUIREMENT**: When a skill is relevant, invoke the \`skills\` tool IMMEDIATELY as your first action. Do NOT announce or mention a skill without actually loading it.

Rules:
1. Load relevant skills BEFORE generating any other response about the task
2. Only use skills listed in <available_skills> above
3. Do not load a skill that is already loaded in this conversation
</skills>`;
}

// ============================================================================
// Skill Tool Factory
// ============================================================================

/**
 * Create the skill loading tool.
 *
 * @example
 * ```ts
 * const skillTool = createSkillTool();
 * // Add to your tools array
 * const tools = [skillTool, ...otherTools];
 * // Generate system instruction after tools are assembled
 * const skillsInstruction = createSkillSystemInstruction(tools);
 * ```
 */
export function createSkillTool(skills: Skill[]): AgentTool {
  // Build tool description
  const description =
    skills.length > 0
      ? `Load a skill's instructional content into context. Available skills are listed in the system message. Pass the skill name to load its content.`
      : `Load a skill's instructional content into context. No skills are currently available.`;

  return tool({
    name: 'skills',
    description,
    parameters: z.object({
      name: z.string().describe('Name of the skill to load'),
    }),
    execute: async (_toolCallId, args) => {
      const { name } = args as { name: string };
      const skill = skills.find((s) => s.name === name);

      if (!skill) {
        const available = skills.map((s) => s.name);
        if (available.length === 0) {
          return { result: 'Error: No skills available.', isError: true };
        }
        return {
          result: `Error: Unknown skill "${name}". Available skills: ${available.join(', ')}`,
          isError: true,
        };
      }

      return { result: skill.content, isError: false };
    },
  });
}
