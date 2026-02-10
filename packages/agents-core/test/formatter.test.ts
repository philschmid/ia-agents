/**
 * Formatter Tests
 */

import { describe, expect, test } from 'bun:test';
import type { AgentEvent } from '../src/types';
import { formatArgs, formatEvent } from '../src/utils/formatter';

describe('formatEvent', () => {
  test('formats text.delta event', () => {
    const event: AgentEvent = { type: 'text.delta', index: 0, delta: 'Hello world' };
    const result = formatEvent(event, { colors: false });
    expect(result).toBe('Hello world');
  });

  test('text.end returns null', () => {
    const event: AgentEvent = { type: 'text.end', index: 0, text: 'full text' };
    const result = formatEvent(event, { colors: false });
    expect(result).toBeNull();
  });

  test('agent.start returns null in normal mode', () => {
    const event: AgentEvent = { type: 'agent.start' };
    const result = formatEvent(event, { colors: false, verbosity: 'normal' });
    expect(result).toBeNull();
  });

  test('agent.start shows in verbose mode', () => {
    const event: AgentEvent = { type: 'agent.start' };
    const result = formatEvent(event, { colors: false, verbosity: 'verbose' });
    expect(result).toContain('agent.start');
  });

  test('agent.end returns null in normal mode', () => {
    const event: AgentEvent = {
      type: 'agent.end',
      interactions: [],
      interactionId: 'test-id',
      usage: { total_tokens: 100 },
    };
    const result = formatEvent(event, { colors: false, verbosity: 'normal' });
    expect(result).toBeNull();
  });

  test('agent.end shows in verbose mode', () => {
    const event: AgentEvent = {
      type: 'agent.end',
      interactions: [{ role: 'user', content: 'hi' }],
      interactionId: 'test-id',
      usage: {},
    };
    const result = formatEvent(event, { colors: false, verbosity: 'verbose' });
    expect(result).toContain('agent.end');
    expect(result).toContain('1 turns');
  });

  test('formats tool.start event in normal verbosity', () => {
    const event: AgentEvent = {
      type: 'tool.start',
      id: 'call-1',
      name: 'read_file',
      arguments: { path: '/test.txt' },
    };
    const result = formatEvent(event, { colors: false, verbosity: 'normal' });
    expect(result).toContain('read_file');
    expect(result).toContain('/test.txt');
  });

  test('formats tool.start event in minimal verbosity', () => {
    const event: AgentEvent = {
      type: 'tool.start',
      id: 'call-1',
      name: 'read_file',
      arguments: { path: '/test.txt' },
    };
    const result = formatEvent(event, { colors: false, verbosity: 'minimal' });
    expect(result).toContain('read_file');
    // minimal should not show args
    expect(result).not.toContain('/test.txt');
  });

  test('formats tool.start event in verbose mode', () => {
    const event: AgentEvent = {
      type: 'tool.start',
      id: 'call-1',
      name: 'read_file',
      arguments: { path: '/test.txt' },
    };
    const result = formatEvent(event, { colors: false, verbosity: 'verbose' });
    expect(result).toContain('read_file');
    expect(result).toContain('/test.txt');
  });

  test('formats tool.end event with output line count', () => {
    const event: AgentEvent = {
      type: 'tool.end',
      id: 'call-1',
      name: 'read_file',
      result: 'line1\nline2\nline3',
      isError: false,
    };
    const result = formatEvent(event, { colors: false, verbosity: 'normal' });
    expect(result).toContain('3 lines');
  });

  test('formats tool.end with isError', () => {
    const event: AgentEvent = {
      type: 'tool.end',
      id: 'call-1',
      name: 'read_file',
      result: 'File not found',
      isError: true,
    };
    const result = formatEvent(event, { colors: false, verbosity: 'normal' });
    expect(result).toContain('Error');
    expect(result).toContain('File not found');
  });

  test('formats thought.summary when showThoughts enabled', () => {
    const event: AgentEvent = {
      type: 'thought.summary',
      summary: { type: 'text', text: 'Analyzing the problem...' },
    };
    const result = formatEvent(event, { colors: false, showThoughts: true });
    expect(typeof result).toBe('string');
    expect(result).toContain('Analyzing the problem');
  });

  test('hides thought.summary when showThoughts disabled', () => {
    const event: AgentEvent = {
      type: 'thought.summary',
      summary: { type: 'text', text: 'Analyzing the problem...' },
    };
    const result = formatEvent(event, { colors: false, showThoughts: false });
    expect(result).toBeNull();
  });

  test('returns null for text.start event', () => {
    const event: AgentEvent = { type: 'text.start', index: 0 };
    const result = formatEvent(event, { colors: false });
    expect(result).toBeNull();
  });

  test('returns null for unknown events in normal mode', () => {
    // biome-ignore lint/suspicious/noExplicitAny: test for unknown event types
    const event = { type: 'unknown.event' } as any;
    const result = formatEvent(event, { colors: false, verbosity: 'normal' });
    expect(result).toBeNull();
  });

  test('shows unknown events in verbose mode', () => {
    // biome-ignore lint/suspicious/noExplicitAny: test for unknown event types
    const event = { type: 'unknown.event', data: 123 } as any;
    const result = formatEvent(event, { colors: false, verbosity: 'verbose' });
    expect(result).toContain('unknown');
    expect(result).toContain('123');
  });
});

describe('formatArgs', () => {
  test('formats path argument with parentheses', () => {
    const result = formatArgs({ path: '/test.txt' });
    expect(result).toContain('(/test.txt)');
  });

  test('formats key-value pairs', () => {
    const result = formatArgs({ line: 42 });
    expect(result).toContain('line: 42');
  });

  test('formats query argument with quotes', () => {
    const result = formatArgs({ query: 'search term' });
    expect(result).toContain('"search term"');
  });

  test('truncates long values', () => {
    const longString = 'x'.repeat(500);
    const result = formatArgs({ content: longString });
    expect(result.length).toBeLessThan(longString.length);
    expect(result).toContain('...');
  });

  test('handles empty args', () => {
    const result = formatArgs({});
    expect(result).toBe('');
  });
});
