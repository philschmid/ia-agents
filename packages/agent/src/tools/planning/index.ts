/**
 * Planning Tool
 *
 * Manages a dynamic task plan for agent workflows.
 */

import { tool } from '@philschmid/agents-core';
import { z } from 'zod';

const description = `Manage the dynamic task plan. Use this tool to update status of steps in the plan, or modify the list based on new findings.

RULES:
1. Steps must be concise and actionable. That someone else can understand and complete.
2. Only ONE step can be \`in_progress\` at a time.
3. Mark steps \`completed\` immediately after finishing the work.
4. If the plan changes, provide an \`explanation\`.`;

/**
 * Update plan tool - manages a dynamic task plan with step status tracking.
 *
 * @example
 * ```typescript
 * const result = await updatePlanTool.execute('call-1', {
 *   explanation: 'Starting implementation',
 *   plan: [
 *     { step: 'Read source files', status: 'completed' },
 *     { step: 'Implement feature', status: 'in_progress' },
 *     { step: 'Write tests', status: 'pending' },
 *   ],
 * });
 * ```
 */
export const updatePlanTool = tool({
  name: 'update_plan',
  description,
  parameters: z.object({
    explanation: z
      .string()
      .optional()
      .describe(
        'A brief, one-sentence explanation of why the plan is being updated or what was just completed. Mandatory for adding/removing steps to the plan.'
      ),
    plan: z
      .array(
        z.object({
          step: z.string().describe('The actionable task description. Be concise but specific.'),
          status: z
            .enum(['pending', 'in_progress', 'completed'])
            .describe('Current state of this specific step.'),
        })
      )
      .describe(
        'The full list of the plan with all tasks. You must provide the ENTIRE list every time you update, not just the changed items.'
      ),
  }),
  label: 'Update Plan',
  execute: async (_toolCallId, { plan }) => {
    const activeSteps = plan.filter(
      (p: { step: string; status: string }) => p.status === 'in_progress'
    );
    if (activeSteps.length > 1) {
      const errorMessage = activeSteps
        .map((s: { step: string; status: string }) => `- ${s.step}`)
        .join('\n');
      return {
        result: `Plan updated successfully. Warning more than one step is in progress.\n${errorMessage}`,
      };
    }
    return { result: 'Plan updated successfully.' };
  },
});
