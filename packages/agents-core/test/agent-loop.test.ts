/**
 * Agent Loop E2E Tests
 *
 * Tests the agentLoop function with real API calls.
 * Skipped if GEMINI_API_KEY is not set.
 */

import { describe, expect, it } from 'bun:test';
import { agentLoop } from '../src/agent-loop';
import type { AgentEvent, AgentTool } from '../src/types';

const hasApiKey = !!process.env.GEMINI_API_KEY;

// Simple calculator tool for testing tool execution
const calculatorTool: AgentTool = {
  name: 'add',
  label: 'Add Numbers',
  description: 'Add two numbers together.',
  parameters: {
    type: 'object',
    properties: {
      a: { type: 'number', description: 'First number' },
      b: { type: 'number', description: 'Second number' },
    },
    required: ['a', 'b'],
  },
  execute: async (_id, args) => {
    const a = args.a as number;
    const b = args.b as number;
    return { result: String(a + b) };
  },
};

describe.skipIf(!hasApiKey)('agentLoop E2E', () => {
  it(
    'should emit agent.start and agent.end events',
    async () => {
      const stream = agentLoop([{ type: 'text', text: 'Say just "hello"' }], {
        model: 'gemini-3-flash-preview',
      });

      const events: AgentEvent[] = [];
      for await (const event of stream) {
        events.push(event);
      }

      // Verify lifecycle events
      expect(events[0].type).toBe('agent.start');
      expect(events[events.length - 1].type).toBe('agent.end');

      // Verify there was at least one interaction
      const interactionStarts = events.filter((e) => e.type === 'interaction.start');
      expect(interactionStarts.length).toBeGreaterThan(0);
    },
    { timeout: 15000 }
  );

  it(
    'should emit text streaming events',
    async () => {
      const stream = agentLoop([{ type: 'text', text: 'Say "test response" exactly' }], {
        model: 'gemini-3-flash-preview',
      });

      const events: AgentEvent[] = [];
      for await (const event of stream) {
        events.push(event);
      }

      // Verify text events are present
      const textStarts = events.filter((e) => e.type === 'text.start');
      const textDeltas = events.filter((e) => e.type === 'text.delta');
      const textEnds = events.filter((e) => e.type === 'text.end');

      expect(textStarts.length).toBeGreaterThan(0);
      expect(textDeltas.length).toBeGreaterThan(0);
      expect(textEnds.length).toBeGreaterThan(0);
    },
    { timeout: 15000 }
  );

  it(
    'should execute tools and emit tool events',
    async () => {
      const stream = agentLoop([{ type: 'text', text: 'What is 3 + 5? Use the add tool.' }], {
        model: 'gemini-3-flash-preview',
        tools: [calculatorTool],
      });

      const events: AgentEvent[] = [];
      for await (const event of stream) {
        events.push(event);
      }

      // Verify tool events are present
      const toolStarts = events.filter((e) => e.type === 'tool.start');
      const toolEnds = events.filter((e) => e.type === 'tool.end');

      expect(toolStarts.length).toBeGreaterThan(0);
      expect(toolEnds.length).toBeGreaterThan(0);

      // Verify tool result is correct (tool.end.result is a string)
      const toolEnd = events.find((e) => e.type === 'tool.end');
      expect(toolEnd).toBeDefined();
      if (toolEnd && toolEnd.type === 'tool.end') {
        expect(toolEnd.result).toBe('8');
      }
    },
    { timeout: 30000 }
  );

  it(
    'should continue session with previousInteractionId',
    async () => {
      // First interaction
      const stream1 = agentLoop([{ type: 'text', text: 'Remember the number 42.' }], {
        model: 'gemini-3-flash-preview',
      });

      // Consume stream
      for await (const _ of stream1) {
        // consume
      }

      // Get interactionId from result
      const result1 = await stream1.result();
      const firstInteractionId = result1.interactionId;
      expect(firstInteractionId).toBeDefined();

      // Second interaction using previousInteractionId
      const stream2 = agentLoop(
        [{ type: 'text', text: 'What number did I tell you to remember? Just say the number.' }],
        {
          model: 'gemini-3-flash-preview',
          previousInteractionId: firstInteractionId,
        }
      );

      let responseText = '';
      for await (const event of stream2) {
        if (event.type === 'text.delta') {
          responseText += event.delta;
        }
      }

      // Response should mention 42
      expect(responseText).toContain('42');
    },
    { timeout: 30000 }
  );

  it(
    'should return result from stream.result()',
    async () => {
      const stream = agentLoop([{ type: 'text', text: 'Say ok' }], {
        model: 'gemini-3-flash-preview',
      });

      // Consume stream
      for await (const _ of stream) {
        // consume
      }

      const result = await stream.result();
      expect(result).toBeDefined();
      expect(result.interactionId).toBeDefined();
      expect(typeof result.interactionId).toBe('string');
    },
    { timeout: 15000 }
  );
});
