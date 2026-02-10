/**
 * HookRunner Unit Tests
 */

import { describe, expect, it } from 'bun:test';
import { HookRunner } from '../src/hooks/runner';

describe('HookRunner', () => {
  describe('emit with no handlers', () => {
    it('returns empty object for modify hooks', async () => {
      const runner = new HookRunner();
      const result = await runner.emit('onAgentStart', {
        type: 'onAgentStart',
        tools: [],
        systemInstruction: 'test',
        input: [],
      });
      expect(result).toEqual({});
    });

    it('returns { allow: true } for beforeToolExecute', async () => {
      const runner = new HookRunner();
      const result = await runner.emit('beforeToolExecute', {
        type: 'beforeToolExecute',
        toolName: 'test',
        toolCallId: 'id-1',
        arguments: {},
      });
      expect(result).toEqual({ allow: true });
    });

    it('returns empty object for onAgentEnd', async () => {
      const runner = new HookRunner();
      const result = await runner.emit('onAgentEnd', {
        type: 'onAgentEnd',
        interactionCount: 1,
      });
      expect(result).toEqual({});
    });
  });

  describe('emit with single handler', () => {
    it('returns handler result', async () => {
      const runner = new HookRunner();
      runner.on('onInteractionStart', (event) => {
        return { interactions: event.interactions.slice(-5) };
      });

      const interactions = Array.from({ length: 10 }, (_, i) => ({
        role: 'user' as const,
        content: [{ type: 'text' as const, text: `msg ${i}` }],
      }));

      const result = await runner.emit('onInteractionStart', {
        type: 'onInteractionStart',
        interactions,
      });

      expect(result.interactions).toHaveLength(5);
    });
  });

  describe('emit with multiple handlers', () => {
    it('merges results in registration order', async () => {
      const runner = new HookRunner();

      runner.on('onAgentStart', () => ({ systemInstruction: 'first' }));
      runner.on('onAgentStart', () => ({ systemInstruction: 'second' }));

      const result = await runner.emit('onAgentStart', {
        type: 'onAgentStart',
        tools: [],
        systemInstruction: 'original',
        input: [],
      });

      // Later handler overwrites earlier
      expect(result.systemInstruction).toBe('second');
    });

    it('accumulates non-overlapping fields', async () => {
      const runner = new HookRunner();

      runner.on('onAgentStart', () => ({ systemInstruction: 'modified' }));
      runner.on('onAgentStart', () => ({ tools: [] }));

      const result = await runner.emit('onAgentStart', {
        type: 'onAgentStart',
        tools: [],
        systemInstruction: 'original',
        input: [],
      });

      expect(result.systemInstruction).toBe('modified');
      expect(result.tools).toEqual([]);
    });
  });

  describe('beforeToolExecute (cancel hook)', () => {
    it('stops on first block', async () => {
      const runner = new HookRunner();
      const callOrder: string[] = [];

      runner.on('beforeToolExecute', () => {
        callOrder.push('first');
        return { allow: true };
      });
      runner.on('beforeToolExecute', () => {
        callOrder.push('second');
        return { allow: false, reason: 'blocked' };
      });
      runner.on('beforeToolExecute', () => {
        callOrder.push('third');
        return { allow: true };
      });

      const result = await runner.emit('beforeToolExecute', {
        type: 'beforeToolExecute',
        toolName: 'test',
        toolCallId: 'id-1',
        arguments: {},
      });

      expect(result.allow).toBe(false);
      expect(result.reason).toBe('blocked');
      expect(callOrder).toEqual(['first', 'second']); // third was skipped
    });
  });

  describe('onAgentEnd (inject hook)', () => {
    it('collects all inputs', async () => {
      const runner = new HookRunner();

      runner.on('onAgentEnd', () => ({ input: 'first input' }));
      runner.on('onAgentEnd', () => ({ input: 'second input' }));

      const result = await runner.emit('onAgentEnd', {
        type: 'onAgentEnd',
        interactionCount: 1,
      });

      expect(result.input).toBe('first input\n\nsecond input');
    });

    it('ignores handlers returning undefined/empty', async () => {
      const runner = new HookRunner();

      runner.on('onAgentEnd', () => ({ input: 'only input' }));
      runner.on('onAgentEnd', () => ({}));
      runner.on('onAgentEnd', () => undefined);

      const result = await runner.emit('onAgentEnd', {
        type: 'onAgentEnd',
        interactionCount: 1,
      });

      expect(result.input).toBe('only input');
    });
  });

  describe('async handlers', () => {
    it('awaits async handlers properly', async () => {
      const runner = new HookRunner();

      runner.on('onAgentStart', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { systemInstruction: 'async result' };
      });

      const result = await runner.emit('onAgentStart', {
        type: 'onAgentStart',
        tools: [],
        systemInstruction: 'original',
        input: [],
      });

      expect(result.systemInstruction).toBe('async result');
    });
  });

  describe('handler throws', () => {
    it('propagates error', async () => {
      const runner = new HookRunner();

      runner.on('onAgentStart', () => {
        throw new Error('Handler error');
      });

      await expect(
        runner.emit('onAgentStart', {
          type: 'onAgentStart',
          tools: [],
          systemInstruction: 'original',
          input: [],
        })
      ).rejects.toThrow('Handler error');
    });
  });

  describe('has/off/clear', () => {
    it('has returns true when handlers registered', () => {
      const runner = new HookRunner();
      runner.on('onAgentStart', () => ({}));
      expect(runner.has('onAgentStart')).toBe(true);
      expect(runner.has('onAgentEnd')).toBe(false);
    });

    it('off removes handlers for a hook', async () => {
      const runner = new HookRunner();
      runner.on('onAgentStart', () => ({ systemInstruction: 'modified' }));
      runner.off('onAgentStart');

      const result = await runner.emit('onAgentStart', {
        type: 'onAgentStart',
        tools: [],
        systemInstruction: 'original',
        input: [],
      });

      expect(result).toEqual({});
    });

    it('clear removes all handlers', () => {
      const runner = new HookRunner();
      runner.on('onAgentStart', () => ({}));
      runner.on('onAgentEnd', () => ({}));
      runner.clear();

      expect(runner.has('onAgentStart')).toBe(false);
      expect(runner.has('onAgentEnd')).toBe(false);
    });
  });
});
