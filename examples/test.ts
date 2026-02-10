/**
 * Simple Example - Validate Event Stream with Tools
 *
 * Tests multi-turn with tool calling using agentLoop.
 *
 * Run: bun examples/test.ts
 */

import {
  type AgentEvent,
  type AgentTool,
  type AgentToolResult,
  type AgentToolUpdateCallback,
  agentLoop,
} from '@philschmid/agents-core';

export const calculateTool: AgentTool = {
  name: 'calculate',
  label: 'Calculator',
  description: 'Evaluate a mathematical expression and return the result.',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'The mathematical expression to evaluate (e.g., "2 + 2", "Math.sqrt(16)")',
      },
    },
    required: ['expression'],
  },
  execute: async (
    toolCallId: string,
    args: Record<string, unknown>,
    signal?: AbortSignal,
    onUpdate?: AgentToolUpdateCallback
  ): Promise<AgentToolResult> => {
    try {
      const expression = args.expression as string;

      // Emit progress update
      onUpdate?.({ result: `Evaluating: ${expression}` });

      const result = new Function(`return ${expression}`)();
      return { result: String(result) };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { result: `Error: ${message}`, isError: true };
    }
  },
};

async function main() {
  console.log('=== Turn 1: Calculate ===\n');

  const stream1 = agentLoop([{ type: 'text', text: 'What is 123 * 456?' }], {
    model: 'gemini-3-flash-preview',
    systemInstruction: 'Be very brief. Use the calculate tool for math.',
    tools: [calculateTool],
  });

  for await (const event of stream1) {
    console.log(`[${event.type}]`, JSON.stringify(event, null, 2).substring(0, 150));
  }

  const result1 = await stream1.result();

  console.log('\n=== Turn 2: Follow-up ===\n');

  const stream2 = agentLoop([{ type: 'text', text: 'Now divide that by 3' }], {
    model: 'gemini-3-flash-preview',
    systemInstruction: 'Be very brief. Use the calculate tool for math.',
    tools: [calculateTool],
    previousInteractionId: result1.interactionId,
  });

  const events: AgentEvent[] = [];
  for await (const event of stream2) {
    events.push(event);
    console.log(`[${event.type}]`, JSON.stringify(event, null, 2).substring(0, 150));
  }

  console.log('\n=== Validation ===\n');

  // Check for tool events
  const hasToolStart = events.some((e) => e.type === 'tool.start');
  const hasToolEnd = events.some((e) => e.type === 'tool.end');
  const hasTextDelta = events.some((e) => e.type === 'text.delta');

  console.log('✓ tool.start:', hasToolStart);
  console.log('✓ tool.end:', hasToolEnd);
  console.log('✓ text.delta:', hasTextDelta);

  // Show final state
  console.log('\n=== Result ===\n');
  const result2 = await stream2.result();
  console.log('Total interactions:', result2.interactions.length);
  console.log('Interaction ID:', `${result2.interactionId?.substring(0, 30)}...`);
}

main().catch(console.error);
