/**
 * AgentSession Integration Tests
 *
 * Tests for hook chaining, session setters, and integrated behavior.
 */

import { describe, expect, it } from 'bun:test';
import type { AgentTool } from '@philschmid/agents-core';
import { createAgentSession } from '../src';

// Mock tool for testing
function createMockTool(name: string): AgentTool {
  return {
    name,
    label: name,
    description: `Mock tool: ${name}`,
    parameters: {
      type: 'object',
      properties: {
        input: { type: 'string' },
      },
    },
    execute: async (_id, args) => ({
      result: `Executed ${name} with: ${JSON.stringify(args)}`,
    }),
  };
}

describe('AgentSession', () => {
  describe('onAgentStart hook chaining', () => {
    it('applies multiple systemInstruction modifications (last wins)', async () => {
      const instructions: string[] = [];

      const session = createAgentSession({
        model: 'gemini-3-flash-preview',
        systemInstruction: 'Original instruction',
      });

      // First hook
      session.on('onAgentStart', (event) => {
        instructions.push(`first saw: ${event.systemInstruction}`);
        return { systemInstruction: 'First modification' };
      });

      // Second hook (should win)
      session.on('onAgentStart', (event) => {
        // Note: event still has original, not first's modification
        instructions.push(`second saw: ${event.systemInstruction}`);
        return { systemInstruction: 'Second modification' };
      });

      // Access hooks through hookRunner to trigger onAgentStart
      const runner = session.hookRunner;
      const result = await runner.emit('onAgentStart', {
        type: 'onAgentStart',
        tools: [],
        systemInstruction: 'Original instruction',
        input: [],
      });

      expect(result.systemInstruction).toBe('Second modification');
      expect(instructions).toEqual([
        'first saw: Original instruction',
        'second saw: Original instruction',
      ]);
    });

    it('applies multiple tool modifications (last wins)', async () => {
      const toolA = createMockTool('toolA');
      const toolB = createMockTool('toolB');
      const toolC = createMockTool('toolC');

      const session = createAgentSession({
        model: 'gemini-3-flash-preview',
      });

      // First hook adds toolB
      session.on('onAgentStart', () => {
        return { tools: [toolA, toolB] };
      });

      // Second hook replaces with toolC only
      session.on('onAgentStart', () => {
        return { tools: [toolC] };
      });

      const runner = session.hookRunner;
      const result = await runner.emit('onAgentStart', {
        type: 'onAgentStart',
        tools: [toolA],
        systemInstruction: undefined,
        input: [],
      });

      expect(result.tools).toHaveLength(1);
      expect((result.tools as AgentTool[])[0].name).toBe('toolC');
    });

    it('combines tools and systemInstruction from different hooks', async () => {
      const toolA = createMockTool('toolA');
      const toolB = createMockTool('toolB');

      const session = createAgentSession({
        model: 'gemini-3-flash-preview',
        systemInstruction: 'Original',
      });

      // One hook modifies tools
      session.on('onAgentStart', () => {
        return { tools: [toolA, toolB] };
      });

      // Another hook modifies systemInstruction
      session.on('onAgentStart', () => {
        return { systemInstruction: 'Modified' };
      });

      const runner = session.hookRunner;
      const result = await runner.emit('onAgentStart', {
        type: 'onAgentStart',
        tools: [toolA],
        systemInstruction: 'Original',
        input: [],
      });

      // Both modifications should be present
      expect(result.tools).toHaveLength(2);
      expect(result.systemInstruction).toBe('Modified');
    });
  });

  describe('beforeToolExecute hook chaining', () => {
    it('allows when all handlers allow', async () => {
      const session = createAgentSession({
        model: 'gemini-3-flash-preview',
      });

      session.on('beforeToolExecute', () => ({ allow: true }));
      session.on('beforeToolExecute', () => ({ allow: true }));

      const runner = session.hookRunner;
      const result = await runner.emit('beforeToolExecute', {
        type: 'beforeToolExecute',
        toolName: 'test',
        toolCallId: 'id-1',
        arguments: {},
      });

      expect(result.allow).toBe(true);
    });

    it('blocks on first handler that denies', async () => {
      const callOrder: string[] = [];

      const session = createAgentSession({
        model: 'gemini-3-flash-preview',
      });

      session.on('beforeToolExecute', () => {
        callOrder.push('first');
        return { allow: true };
      });

      session.on('beforeToolExecute', () => {
        callOrder.push('second');
        return { allow: false, reason: 'Blocked by second' };
      });

      session.on('beforeToolExecute', () => {
        callOrder.push('third');
        return { allow: true };
      });

      const runner = session.hookRunner;
      const result = await runner.emit('beforeToolExecute', {
        type: 'beforeToolExecute',
        toolName: 'test',
        toolCallId: 'id-1',
        arguments: {},
      });

      expect(result.allow).toBe(false);
      expect(result.reason).toBe('Blocked by second');
      expect(callOrder).toEqual(['first', 'second']); // third not called
    });

    it('merges argument modifications across hooks', async () => {
      const session = createAgentSession({
        model: 'gemini-3-flash-preview',
      });

      session.on('beforeToolExecute', () => ({
        allow: true,
        arguments: { added: 'first' },
      }));

      session.on('beforeToolExecute', () => ({
        allow: true,
        arguments: { another: 'second' },
      }));

      const runner = session.hookRunner;
      const result = await runner.emit('beforeToolExecute', {
        type: 'beforeToolExecute',
        toolName: 'test',
        toolCallId: 'id-1',
        arguments: { original: 'value' },
      });

      expect(result.allow).toBe(true);
      expect(result.arguments).toEqual({
        added: 'first',
        another: 'second',
      });
    });
  });

  describe('onAgentEnd hook chaining', () => {
    it('combines inputs from multiple handlers', async () => {
      const session = createAgentSession({
        model: 'gemini-3-flash-preview',
      });

      session.on('onAgentEnd', () => ({ input: 'First follow-up' }));
      session.on('onAgentEnd', () => ({ input: 'Second follow-up' }));

      const runner = session.hookRunner;
      const result = await runner.emit('onAgentEnd', {
        type: 'onAgentEnd',
        interactionCount: 1,
      });

      expect(result.input).toBe('First follow-up\n\nSecond follow-up');
    });
  });

  describe('hook runner access', () => {
    it('exposes hookRunner for advanced use cases', () => {
      const session = createAgentSession({
        model: 'gemini-3-flash-preview',
      });

      expect(session.hookRunner).toBeDefined();
      expect(typeof session.hookRunner.emit).toBe('function');
      expect(typeof session.hookRunner.on).toBe('function');
    });
  });

  // ============================================================================
  // State Management Tests (migrated from agents-core Session tests)
  // ============================================================================

  describe('state management', () => {
    it('should create a session with default options', () => {
      const session = createAgentSession();

      expect(session.state).toBeDefined();
      expect(session.state.interactions).toEqual([]);
      expect(session.state.usage).toEqual({});
      expect(session.isStreaming).toBe(false);
    });

    it('should create a session with custom options', () => {
      const session = createAgentSession({
        model: 'gemini-2.5-pro',
        systemInstruction: 'Be helpful.',
        previousInteractionId: 'prev-123',
      });

      expect(session.state.previousInteractionId).toBe('prev-123');
      // Note: systemInstruction may be enhanced with tool-specific content
      expect(session.state.systemInstruction).toContain('Be helpful.');
    });

    it('should queue messages with send()', () => {
      const session = createAgentSession();

      session.send('Hello');
      session.send([{ type: 'text', text: 'World' }]);

      // Messages are queued but not in state.interactions yet
      expect(session.state.interactions).toEqual([]);
    });

    it('should return undefined from stream() when queue is empty', async () => {
      const session = createAgentSession();

      const result = await (async () => {
        for await (const _event of session.stream()) {
          // Should not enter
        }
        return 'done';
      })();

      expect(result).toBe('done');
    });

    it('should not throw on abort() when not streaming', () => {
      const session = createAgentSession();

      expect(() => session.abort()).not.toThrow();
    });

    it('should return undefined signal when not streaming', () => {
      const session = createAgentSession();

      expect(session.signal).toBeUndefined();
    });

    it('should clear queue with clearQueue()', () => {
      const session = createAgentSession();

      session.send('Message 1');
      session.send('Message 2');
      session.clearQueue();

      // queue is internal, but stream() should return immediately
      // We can verify by checking isStreaming is still false
      expect(session.isStreaming).toBe(false);
    });
  });

  describe('setters', () => {
    it('updateTools should update tools in state', () => {
      const session = createAgentSession({ tools: [] });

      const newTool: AgentTool = {
        name: 'newTool',
        label: 'New Tool',
        description: 'A new tool',
        parameters: { type: 'object', properties: {} },
        execute: async () => ({ result: 'ok' }),
      };

      session.updateTools([newTool]);

      expect(session.state.tools).toHaveLength(1);
      expect(session.state.tools[0].name).toBe('newTool');
    });

    it('updateSystemInstruction should update systemInstruction in state', () => {
      const session = createAgentSession({
        systemInstruction: 'Original instruction',
        tools: [],
      });
      expect(session.state.systemInstruction).toBe('Original instruction');

      session.updateSystemInstruction('Modified instruction');

      expect(session.state.systemInstruction).toBe('Modified instruction');
    });

    it('updateTools can be called multiple times', () => {
      const session = createAgentSession({ tools: [] });

      const tool1: AgentTool = {
        name: 'tool1',
        label: 'Tool 1',
        description: 'First tool',
        parameters: { type: 'object', properties: {} },
        execute: async () => ({ result: 'ok' }),
      };

      const tool2: AgentTool = {
        name: 'tool2',
        label: 'Tool 2',
        description: 'Second tool',
        parameters: { type: 'object', properties: {} },
        execute: async () => ({ result: 'ok' }),
      };

      session.updateTools([tool1]);
      expect(session.state.tools).toHaveLength(1);

      session.updateTools([tool1, tool2]);
      expect(session.state.tools).toHaveLength(2);

      session.updateTools([]);
      expect(session.state.tools).toHaveLength(0);
    });

    it('updateSystemInstruction can be called multiple times', () => {
      const session = createAgentSession({ tools: [] });

      session.updateSystemInstruction('First');
      expect(session.state.systemInstruction).toBe('First');

      session.updateSystemInstruction('Second');
      expect(session.state.systemInstruction).toBe('Second');

      session.updateSystemInstruction('Third');
      expect(session.state.systemInstruction).toBe('Third');
    });
  });

  describe('createAgentSession factory', () => {
    it('should create an AgentSession instance', () => {
      const session = createAgentSession();

      expect(session).toBeInstanceOf(Object);
      expect(typeof session.send).toBe('function');
      expect(typeof session.stream).toBe('function');
    });

    it('should pass options to AgentSession', () => {
      const session = createAgentSession({
        model: 'gemini-2.5-flash',
        systemInstruction: 'Test instruction',
        tools: [],
      });

      expect(session.state.systemInstruction).toBe('Test instruction');
    });
  });

  describe('cwd option', () => {
    it('defaults to process.cwd()', () => {
      const session = createAgentSession();
      expect(session.cwd).toBe(process.cwd());
    });

    it('accepts custom cwd', () => {
      const session = createAgentSession({ cwd: '/custom/path' });
      expect(session.cwd).toBe('/custom/path');
    });

    it('cwd is readonly', () => {
      const session = createAgentSession({ cwd: '/initial' });
      expect(session.cwd).toBe('/initial');

      // Verify there's no setter by checking property descriptor
      const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(session), 'cwd');
      expect(descriptor?.set).toBeUndefined();
    });
  });
});
