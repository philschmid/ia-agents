/**
 * Subagent Delegation Tool
 *
 * Allows the main agent to delegate tasks to specialized subagents.
 * Subagents run in isolated context and cannot spawn other subagents.
 */

import { agentLoop, tool } from '@philschmid/agents-core';
import type { AgentTool, Turn } from '@philschmid/agents-core';
import { z } from 'zod';
import { getTools } from '..';
import { CONFIG } from '../../config';
import type { Skill, Subagent } from '../../load_artifacts';
import { createSkillSystemInstruction } from '../skills';
import type { ToolName } from '../types';

// ============================================================================
// System Instruction Builder
// ============================================================================

/**
 * Build the subagents section for the system instruction.
 *
 * @param subagents - Array of subagents to include in the instruction
 * @returns System instruction string, or empty string if no subagents
 */
export function createSubagentSystemInstruction(subagents: Subagent[]): string {
  const subagentList = subagents
    .map((s) => `  <subagent name="${s.name}">${s.description}</subagent>`)
    .join('\n');

  return `<subagents>
You have access to specialized subagents that can handle complex subtasks autonomously. Use the \`delegate_to_subagent\` tool to delegate work to a subagent.

<available_subagents>
${subagentList}
</available_subagents>

Rules:
1. Provide complete task context - subagents don't have access to conversation history
2. Subagents cannot spawn other subagents
3. Use subagents for well-defined, self-contained tasks
</subagents>`;
}

// ============================================================================
// Helpers
// ============================================================================

/** Extract the last text string from a Turn's content. */
function extractTextFromTurn(turn: Turn): string | null {
  const { content } = turn;
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return null;

  const lastText = content
    .filter((b): b is { type: 'text'; text: string } => b?.type === 'text')
    .pop();
  return lastText?.text ?? null;
}

// ============================================================================
// Subagent Tool Factory
// ============================================================================

/**
 * Create the subagent delegation tool.
 * Skills listed in a subagent's YAML are resolved and their system instruction
 * is appended using the same `createSkillSystemInstruction` as the main agent.
 *
 * @param subagents - Available subagents
 * @param allSkills - All loaded skills (used to resolve subagent skill references)
 */
export function createSubagentTool(subagents: Subagent[], allSkills: Skill[] = []): AgentTool {
  // Get available tools (exclude delegate_to_subagent to prevent nested spawning)
  if (subagents.map((s) => s.name).includes('delegate_to_subagent')) {
    throw new Error('Subagent name "delegate_to_subagent" is reserved');
  }

  // Build tool description
  const subagentNames = subagents.map((s) => s.name);
  const description = `Delegate a task to a specialized subagent. Available agents: ${subagentNames.join(', ')}. Pass the agent name and complete task description.`;

  return tool({
    name: 'delegate_to_subagent',
    description,
    parameters: z.object({
      name: z.string().describe('Name of the subagent.'),
      task: z.string().describe('Complete task description with all necessary context'),
    }),
    execute: async (_toolCallId, args) => {
      const { name, task } = args as { name: string; task: string };
      const subagent = subagents.find((s) => s.name === name);

      if (!subagent) {
        if (subagents.length === 0) {
          return { result: 'Error: No subagents are available.', isError: true };
        }
        return {
          result: `Error: Unknown subagent "${name}". Available: ${subagentNames.join(', ')}`,
          isError: true,
        };
      }

      // Resolve tools for the subagent - filter by names specified in subagent config
      const tools =
        subagent.tools && subagent.tools.length > 0 ? getTools(subagent.tools as ToolName[]) : [];

      // Build system instruction: markdown content + skill awareness for declared skills
      let systemInstruction = subagent.content;

      if (subagent.skills && subagent.skills.length > 0) {
        const resolvedSkills = subagent.skills
          .map((skillName) => allSkills.find((s) => s.name === skillName))
          .filter((s): s is Skill => s !== undefined);

        if (resolvedSkills.length > 0) {
          // Use the same skill system instruction builder as the main agent
          systemInstruction += `\n\n${createSkillSystemInstruction(resolvedSkills)}`;
        }
      }

      try {
        // agentLoop returns an AgentEventStream (async iterable)
        const stream = agentLoop([{ type: 'text', text: task }], {
          model: subagent.model ?? CONFIG.defaultModel,
          systemInstruction,
          tools,
          maxIterations: CONFIG.maxIterations,
        });

        // Get the final result
        const loopResult = await stream.result();

        // Extract the last model response
        const lastModelTurn = loopResult.interactions
          .filter((t: Turn): t is Turn => t.role === 'model')
          .pop();

        const text = lastModelTurn ? extractTextFromTurn(lastModelTurn) : null;
        return { result: text ?? 'No output produced by subagent.' };
      } catch (error) {
        return { result: `Error executing subagent: ${error}`, isError: true };
      }
    },
  });
}
