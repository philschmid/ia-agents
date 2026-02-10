/**
 * E2E Tests
 *
 * Real API calls to Gemini Interactions API.
 * Skipped if GEMINI_API_KEY is not set.
 */

import { describe, expect, it } from 'bun:test';
import { agentLoop } from '../src/agent-loop';
import type { AgentEvent, AgentTool, AgentToolResult, AgentToolUpdateCallback } from '../src/types';

const hasApiKey = !!process.env.GEMINI_API_KEY;

// Calculator tool for tests
const calculateTool: AgentTool = {
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
    _toolCallId: string,
    args: Record<string, unknown>,
    _signal?: AbortSignal,
    onUpdate?: AgentToolUpdateCallback
  ): Promise<AgentToolResult> => {
    try {
      const expression = args.expression as string;
      onUpdate?.({ result: `Evaluating: ${expression}` });
      // Safe arithmetic evaluation: parse "a op b" patterns instead of eval
      const match = expression.match(/^\s*([\d.]+)\s*([+\-*/])\s*([\d.]+)\s*$/);
      if (!match) {
        return { result: `Error: unsupported expression format "${expression}"`, isError: true };
      }
      const [, aStr, op, bStr] = match;
      const a = Number(aStr);
      const b = Number(bStr);
      const ops: Record<string, (x: number, y: number) => number> = {
        '+': (x, y) => x + y,
        '-': (x, y) => x - y,
        '*': (x, y) => x * y,
        '/': (x, y) => x / y,
      };
      const result = ops[op](a, b);
      return { result: String(result) };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { result: `Error: ${message}`, isError: true };
    }
  },
};

describe.skipIf(!hasApiKey)('E2E: Gemini Interactions API', () => {
  it(
    'should handle basic text prompt',
    async () => {
      const stream = agentLoop(
        [{ type: 'text', text: 'What is 2+2? Answer with just the number.' }],
        {
          model: 'gemini-3-flash-preview',
          systemInstruction: 'Be extremely concise. Respond with just the answer.',
        }
      );

      const events: AgentEvent[] = [];
      for await (const event of stream) {
        events.push(event);
      }

      // Check event sequence
      expect(events.some((e) => e.type === 'agent.start')).toBe(true);
      expect(events.some((e) => e.type === 'agent.end')).toBe(true);
      expect(events.some((e) => e.type === 'text.delta')).toBe(true);

      // Check result
      const result = await stream.result();
      expect(result.interactions.length).toBeGreaterThanOrEqual(2);
      expect(result.interactionId).toBeDefined();
    },
    { timeout: 30000 }
  );

  it(
    'should execute tools correctly',
    async () => {
      const stream = agentLoop(
        [{ type: 'text', text: 'Calculate 123 * 456 using the calculator tool.' }],
        {
          model: 'gemini-3-flash-preview',
          systemInstruction: 'Always use the calculator tool for math. Be concise.',
          tools: [calculateTool],
        }
      );

      const events: AgentEvent[] = [];
      for await (const event of stream) {
        events.push(event);
      }

      // Should have tool events
      expect(events.some((e) => e.type === 'tool.start')).toBe(true);
      expect(events.some((e) => e.type === 'tool.end')).toBe(true);

      // Tool should have returned correct result
      const toolEnd = events.find((e) => e.type === 'tool.end');
      if (toolEnd && toolEnd.type === 'tool.end') {
        expect(toolEnd.result).toContain('56088');
        expect(toolEnd.isError).toBe(false);
      }
    },
    { timeout: 30000 }
  );

  it(
    'should emit state updates during streaming',
    async () => {
      const stream = agentLoop([{ type: 'text', text: 'Count from 1 to 3.' }], {
        model: 'gemini-3-flash-preview',
        systemInstruction: 'Be concise.',
      });

      const eventTypes: string[] = [];
      for await (const event of stream) {
        eventTypes.push(event.type);
      }

      // Should have lifecycle events
      expect(eventTypes).toContain('agent.start');
      expect(eventTypes).toContain('agent.end');
      expect(eventTypes).toContain('interaction.start');
      expect(eventTypes).toContain('interaction.end');

      // Should have text events
      expect(eventTypes).toContain('text.start');
      expect(eventTypes).toContain('text.delta');
      expect(eventTypes).toContain('text.end');
    },
    { timeout: 30000 }
  );

  it(
    'should maintain context across multiple turns via previousInteractionId',
    async () => {
      // Turn 1: Introduce name
      const stream1 = agentLoop([{ type: 'text', text: 'My name is Alice.' }], {
        model: 'gemini-3-flash-preview',
        systemInstruction: 'Be extremely concise.',
      });

      for await (const _event of stream1) {
        // consume
      }

      const result1 = await stream1.result();
      expect(result1.interactionId).toBeDefined();
      expect(result1.interactions.length).toBeGreaterThanOrEqual(2);

      // Turn 2: Ask about name, chained via previousInteractionId
      const stream2 = agentLoop([{ type: 'text', text: 'What is my name?' }], {
        model: 'gemini-3-flash-preview',
        systemInstruction: 'Be extremely concise.',
        previousInteractionId: result1.interactionId,
      });

      let responseText = '';
      for await (const event of stream2) {
        if (event.type === 'text.delta') {
          responseText += event.delta;
        }
      }

      const result2 = await stream2.result();

      // Context should be maintained - model should remember the name
      expect(result2.interactions.length).toBeGreaterThanOrEqual(2);
      expect(responseText.toLowerCase()).toContain('alice');
    },
    { timeout: 60000 }
  );
});
