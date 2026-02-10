/**
 * Tool Factory Tests
 */

import { describe, expect, test } from 'bun:test';
import { z } from 'zod';
import { tool } from '../src/tool';

describe('tool', () => {
  test('creates a tool with correct name and description', () => {
    const myTool = tool({
      name: 'test_tool',
      description: 'A test tool',
      parameters: z.object({
        input: z.string().describe('Test input'),
      }),
      execute: async () => ({ result: 'ok' }),
    });

    expect(myTool.name).toBe('test_tool');
    expect(myTool.description).toBe('A test tool');
  });

  test('uses label when provided', () => {
    const myTool = tool({
      name: 'test_tool',
      label: 'My Custom Label',
      description: 'A test tool',
      parameters: z.object({}),
      execute: async () => ({ result: 'ok' }),
    });

    expect(myTool.label).toBe('My Custom Label');
  });

  test('falls back to name when no label provided', () => {
    const myTool = tool({
      name: 'test_tool',
      description: 'A test tool',
      parameters: z.object({}),
      execute: async () => ({ result: 'ok' }),
    });

    expect(myTool.label).toBe('test_tool');
  });

  test('generates JSON Schema parameters from Zod schema', () => {
    const myTool = tool({
      name: 'test_tool',
      description: 'A test tool',
      parameters: z.object({
        name: z.string().describe('User name'),
        age: z.number().int().min(0).describe('User age'),
        optional_field: z.string().optional().describe('Optional field'),
      }),
      execute: async () => ({ result: 'ok' }),
    });

    const params = myTool.parameters;
    expect(params).toBeDefined();
    expect(params.type).toBe('object');
    // biome-ignore lint/suspicious/noExplicitAny: JSON Schema structure varies
    const properties = params.properties as any;
    expect(properties.name).toBeDefined();
    expect(properties.age).toBeDefined();
    expect(properties.optional_field).toBeDefined();
  });

  test('execute function works correctly', async () => {
    const myTool = tool({
      name: 'add',
      description: 'Add two numbers',
      parameters: z.object({
        a: z.number(),
        b: z.number(),
      }),
      execute: async (_toolCallId, { a, b }) => ({
        result: `${a + b}`,
      }),
    });

    const result = await myTool.execute('call-1', { a: 2, b: 3 });
    expect(result.result).toBe('5');
    expect(result.isError).toBeUndefined();
  });

  test('execute can return error results', async () => {
    const myTool = tool({
      name: 'fail',
      description: 'Always fails',
      parameters: z.object({}),
      execute: async () => ({
        result: 'Something went wrong',
        isError: true,
      }),
    });

    const result = await myTool.execute('call-1', {});
    expect(result.result).toBe('Something went wrong');
    expect(result.isError).toBe(true);
  });

  test('handles empty parameters schema', () => {
    const myTool = tool({
      name: 'no_params',
      description: 'No parameters',
      parameters: z.object({}),
      execute: async () => ({ result: 'done' }),
    });

    expect(myTool.parameters).toBeDefined();
    expect(myTool.parameters.type).toBe('object');
  });
});
