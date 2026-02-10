/**
 * Tool Wrapping Unit Tests
 */

import { describe, expect, it } from 'bun:test';
import type { AgentTool } from '@philschmid/agents-core';
import { HookRunner } from '../src/hooks/runner';
import { wrapToolsWithHooks } from '../src/utils/wrap-tools';

describe('wrapToolsWithHooks', () => {
  // Helper to create a test tool
  const createTestTool = (name: string, result: string): AgentTool => ({
    name,
    label: name,
    description: `A ${name} tool`,
    parameters: { type: 'object', properties: {} },
    execute: async () => ({ result }),
  });

  describe('beforeToolExecute allow', () => {
    it('executes tool when allowed', async () => {
      const hooks = new HookRunner();
      hooks.on('beforeToolExecute', () => ({ allow: true }));

      const tools = [createTestTool('echo', 'hello')];
      const wrapped = wrapToolsWithHooks(tools, hooks);

      const result = await wrapped[0].execute('id-1', {});
      expect(result.result).toBe('hello');
      expect(result.isError).toBeUndefined();
    });

    it('executes tool with no handlers registered', async () => {
      const hooks = new HookRunner();
      const tools = [createTestTool('echo', 'hello')];
      const wrapped = wrapToolsWithHooks(tools, hooks);

      const result = await wrapped[0].execute('id-1', {});
      expect(result.result).toBe('hello');
    });
  });

  describe('beforeToolExecute block', () => {
    it('blocks tool and returns reason', async () => {
      const hooks = new HookRunner();
      hooks.on('beforeToolExecute', (event) => {
        if (event.toolName === 'dangerous') {
          return { allow: false, reason: 'Too dangerous!' };
        }
        return { allow: true };
      });

      const tools = [createTestTool('dangerous', 'should not see this')];
      const wrapped = wrapToolsWithHooks(tools, hooks);

      const result = await wrapped[0].execute('id-1', {});
      expect(result.result).toBe('Blocked: Too dangerous!');
      expect(result.isError).toBe(true);
    });

    it('uses default message when no reason provided', async () => {
      const hooks = new HookRunner();
      hooks.on('beforeToolExecute', () => ({ allow: false }));

      const tools = [createTestTool('test', 'ok')];
      const wrapped = wrapToolsWithHooks(tools, hooks);

      const result = await wrapped[0].execute('id-1', {});
      expect(result.result).toContain('Blocked:');
      expect(result.isError).toBe(true);
    });
  });

  describe('beforeToolExecute modify arguments', () => {
    it('uses modified arguments', async () => {
      const hooks = new HookRunner();
      let capturedArgs: Record<string, unknown> = {};

      hooks.on('beforeToolExecute', (event) => ({
        allow: true,
        arguments: { ...event.arguments, sanitized: true },
      }));

      const tools: AgentTool[] = [
        {
          name: 'capture',
          label: 'capture',
          description: 'Captures args',
          parameters: { type: 'object' },
          execute: async (_id, args) => {
            capturedArgs = args;
            return { result: 'ok' };
          },
        },
      ];

      const wrapped = wrapToolsWithHooks(tools, hooks);
      await wrapped[0].execute('id-1', { original: true });

      expect(capturedArgs).toEqual({ original: true, sanitized: true });
    });
  });

  describe('afterToolExecute modify', () => {
    it('modifies result', async () => {
      const hooks = new HookRunner();
      hooks.on('afterToolExecute', (event) => ({
        result: { ...event.result, result: `${event.result.result} (modified)` },
      }));

      const tools = [createTestTool('test', 'original')];
      const wrapped = wrapToolsWithHooks(tools, hooks);

      const result = await wrapped[0].execute('id-1', {});
      expect(result.result).toBe('original (modified)');
    });
  });

  describe('afterToolExecute no change', () => {
    it('returns original result when no modification', async () => {
      const hooks = new HookRunner();
      hooks.on('afterToolExecute', () => ({})); // Return nothing

      const tools = [createTestTool('test', 'original')];
      const wrapped = wrapToolsWithHooks(tools, hooks);

      const result = await wrapped[0].execute('id-1', {});
      expect(result.result).toBe('original');
    });
  });

  describe('tool execution error', () => {
    it('catches tool errors and returns error result', async () => {
      const hooks = new HookRunner();

      const tools: AgentTool[] = [
        {
          name: 'failing',
          label: 'failing',
          description: 'Always fails',
          parameters: { type: 'object' },
          execute: async () => {
            throw new Error('Tool crashed!');
          },
        },
      ];

      const wrapped = wrapToolsWithHooks(tools, hooks);
      const result = await wrapped[0].execute('id-1', {});

      expect(result.result).toBe('Error: Tool crashed!');
      expect(result.isError).toBe(true);
    });
  });

  describe('preserves tool metadata', () => {
    it('copies all tool properties', () => {
      const hooks = new HookRunner();
      const tools: AgentTool[] = [
        {
          name: 'meta-tool',
          label: 'Meta Tool',
          description: 'A tool with metadata',
          parameters: { type: 'object', properties: { foo: { type: 'string' } } },
          execute: async () => ({ result: 'ok' }),
        },
      ];

      const wrapped = wrapToolsWithHooks(tools, hooks);

      expect(wrapped[0].name).toBe('meta-tool');
      expect(wrapped[0].label).toBe('Meta Tool');
      expect(wrapped[0].description).toBe('A tool with metadata');
      expect(wrapped[0].parameters).toEqual({
        type: 'object',
        properties: { foo: { type: 'string' } },
      });
    });
  });
});
