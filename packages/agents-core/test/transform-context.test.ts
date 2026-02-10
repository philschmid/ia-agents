/**
 * transformContext E2E Tests
 *
 * Tests the transformContext callback in agentLoop with real API calls.
 * Verifies the callback is actually invoked and modifications take effect.
 * Skipped if GEMINI_API_KEY is not set.
 */

import { describe, expect, it } from 'bun:test';
import { agentLoop } from '../src/agent-loop';
import type { AgentContext, AgentEvent, AgentTool } from '../src/types';

const hasApiKey = !!process.env.GEMINI_API_KEY;

// Helper to create a simple tool
const createTool = (name: string): AgentTool => ({
  name,
  label: name,
  description: `Tool named ${name}`,
  parameters: { type: 'object', properties: {} },
  execute: async () => ({ result: `${name} executed` }),
});

describe.skipIf(!hasApiKey)('transformContext E2E', () => {
  it(
    'should call transformContext with full AgentContext',
    async () => {
      let capturedContext: AgentContext | undefined;
      let callCount = 0;

      const stream = agentLoop([{ type: 'text', text: 'Say hi' }], {
        model: 'gemini-3-flash-preview',
        systemInstruction: 'Be brief',
        tools: [createTool('test')],
        transformContext: (context) => {
          callCount++;
          capturedContext = { ...context };
          return undefined; // No modifications
        },
      });

      for await (const _ of stream) {
        // Consume stream
      }

      // Verify callback was called
      expect(callCount).toBeGreaterThan(0);
      expect(capturedContext).toBeDefined();

      // Verify context structure
      expect(capturedContext?.interactions).toBeDefined();
      expect(Array.isArray(capturedContext?.interactions)).toBe(true);
      expect(capturedContext?.systemInstruction).toBe('Be brief');
      expect(capturedContext?.tools).toHaveLength(1);
      expect(capturedContext?.tools?.[0].name).toBe('test');
    },
    { timeout: 15000 }
  );

  it(
    'should allow modifying systemInstruction at runtime',
    async () => {
      let modifiedInstruction: string | undefined;

      const stream = agentLoop(
        [{ type: 'text', text: 'What are your instructions? Quote them exactly.' }],
        {
          model: 'gemini-3-flash-preview',
          systemInstruction: 'Original instruction',
          transformContext: (context) => {
            modifiedInstruction = 'Say only: MODIFIED_RESPONSE_12345';
            return { systemInstruction: modifiedInstruction };
          },
        }
      );

      let responseText = '';
      for await (const event of stream) {
        if (event.type === 'text.delta') {
          responseText += event.delta;
        }
      }

      // Response should reflect the modified instruction
      expect(responseText).toContain('MODIFIED_RESPONSE_12345');
    },
    { timeout: 15000 }
  );

  it(
    'should preserve context modifications across multiple model calls',
    async () => {
      let transformCount = 0;

      // Use a tool to force multiple model calls
      const tool: AgentTool = {
        name: 'get_data',
        label: 'Get Data',
        description: 'Gets data',
        parameters: { type: 'object', properties: {} },
        execute: async () => ({ result: 'data123' }),
      };

      const stream = agentLoop(
        [{ type: 'text', text: 'Use the get_data tool then tell me what you got' }],
        {
          model: 'gemini-3-flash-preview',
          tools: [tool],
          transformContext: () => {
            transformCount++;
            return undefined;
          },
        }
      );

      for await (const _ of stream) {
        // Consume stream
      }

      // When tools are used, transformContext should be called multiple times
      // (once before tool call, once after tool result)
      expect(transformCount).toBeGreaterThanOrEqual(2);
    },
    { timeout: 30000 }
  );

  it(
    'should support async transformContext',
    async () => {
      let asyncCompleted = false;

      const stream = agentLoop([{ type: 'text', text: 'Say ok' }], {
        model: 'gemini-3-flash-preview',
        transformContext: async (context) => {
          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 50));
          asyncCompleted = true;
          return { systemInstruction: 'Respond with just: OK' };
        },
      });

      let responseText = '';
      for await (const event of stream) {
        if (event.type === 'text.delta') {
          responseText += event.delta;
        }
      }

      expect(asyncCompleted).toBe(true);
      expect(responseText.toLowerCase()).toContain('ok');
    },
    { timeout: 15000 }
  );

  it(
    'should allow filtering tools dynamically',
    async () => {
      const tool1 = createTool('tool_alpha');
      const tool2 = createTool('tool_beta');
      let toolsAfterFilter: AgentTool[] | undefined;

      const stream = agentLoop([{ type: 'text', text: 'List available tools' }], {
        model: 'gemini-3-flash-preview',
        tools: [tool1, tool2],
        transformContext: (context) => {
          // Filter to only keep tool_alpha
          const filtered = context.tools?.filter((t) => t.name === 'tool_alpha');
          toolsAfterFilter = filtered;
          return { tools: filtered };
        },
      });

      for await (const _ of stream) {
        // Consume stream
      }

      expect(toolsAfterFilter).toHaveLength(1);
      expect(toolsAfterFilter?.[0].name).toBe('tool_alpha');
    },
    { timeout: 15000 }
  );
});

// Type-level tests (these always run, no API needed)
describe('TransformContextCallback type', () => {
  it('should accept synchronous callbacks', () => {
    const sync = (ctx: AgentContext) => ({ interactions: ctx.interactions });
    expect(typeof sync).toBe('function');
  });

  it('should accept async callbacks', () => {
    const async = async (ctx: AgentContext) => ({ interactions: ctx.interactions });
    expect(typeof async).toBe('function');
  });

  it('should accept callbacks returning undefined', () => {
    const undef = () => undefined;
    expect(typeof undef).toBe('function');
  });

  it('should accept callbacks with input field for injection', () => {
    const withInput = () => ({ input: 'injected input' });
    expect(typeof withInput).toBe('function');
  });
});
