/**
 * Stream Event Formatter
 *
 * Utilities for formatting agent events into human-readable stdout output.
 */

import type { AgentEvent, AgentLoopResult } from '../types';
import type { AgentEventStream } from './event-stream';

/**
 * ANSI color codes for terminal output.
 */
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  orange: '\x1b[38;5;208m',
  purple: '\x1b[38;5;183m',
};

/**
 * Options for formatting agent events.
 */
export type FormatOptions = {
  /** Output verbosity: 'minimal' (tool names only), 'normal' (text + compact tools), 'verbose' (full JSON data) */
  verbosity?: 'minimal' | 'normal' | 'verbose';
  /** Whether to use colors (auto-detects TTY by default) */
  colors?: boolean;
  /** Show thinking/thought summaries */
  showThoughts?: boolean;
  /** Custom prefix for tool calls (default: '●') */
  toolPrefix?: string;
};

/**
 * Format tool arguments for compact display.
 * Shows key values inline, truncating long strings.
 */
export function formatArgs(args: Record<string, unknown>, maxLen = 40): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(args)) {
    if (typeof value === 'string') {
      const display = value.length > maxLen ? `${value.slice(0, maxLen)}...` : value;
      // Handle common argument patterns
      if (key === 'query' || key === 'pattern' || key === 'command') {
        parts.push(`"${display}"`);
      } else if (key === 'path' || key === 'file' || key === 'directory') {
        parts.push(`(${display})`);
      } else {
        parts.push(`${key}: "${display}"`);
      }
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      parts.push(`${key}: ${value}`);
    }
  }

  const result = parts.join(' ');
  return result.length > 80 ? `${result.slice(0, 80)}...` : result;
}

/**
 * Apply color to text if colors are enabled.
 */
function colorize(text: string, color: string, useColors: boolean): string {
  return useColors ? `${color}${text}${colors.reset}` : text;
}

/**
 * Format a single agent event into a printable string.
 * Returns null if the event should not be printed (based on options).
 */
export function formatEvent(event: AgentEvent, options?: FormatOptions): string | null {
  const verbosity = options?.verbosity ?? 'normal';
  const useColors = options?.colors ?? process.stdout.isTTY ?? false;
  const showThoughts = options?.showThoughts ?? true;
  const toolPrefix = options?.toolPrefix ?? '●';

  switch (event.type) {
    // Text streaming
    case 'text.delta':
      return event.delta;

    case 'text.end':
      // Already streamed via text.delta, just mark end
      return null;

    // Thought summaries
    case 'thought.summary': {
      if (!showThoughts) return null;
      // event.summary is now a single ThoughtSummary, not an array
      if (event.summary.type !== 'text') return null;
      const text = event.summary.text;
      if (!text) return null;
      return colorize(text, colors.orange + colors.dim, useColors);
    }

    // Tool execution
    case 'tool.start': {
      const prefix = colorize(toolPrefix, colors.purple, useColors);
      const nameStr = colorize(event.name, colors.bold, useColors);

      if (verbosity === 'minimal') {
        return `${prefix} ${nameStr}`;
      }
      if (verbosity === 'verbose') {
        const jsonArgs = JSON.stringify(event.arguments, null, 2);
        return `${prefix} ${nameStr}\n${colorize(jsonArgs, colors.dim, useColors)}`;
      }
      // Normal: compact args
      const args = event.arguments as Record<string, unknown>;
      const formattedArgs = formatArgs(args);
      const argsStr = formattedArgs ? colorize(` ${formattedArgs}`, colors.dim, useColors) : '';
      return `${prefix} ${nameStr}${argsStr}`;
    }

    case 'tool.end': {
      const result = event.result || '';
      const lineCount = result.split('\n').length;

      if (verbosity === 'minimal') {
        if (event.isError) {
          return colorize('  ↳ Error', colors.red, useColors);
        }
        return null;
      }

      if (event.isError) {
        if (verbosity === 'verbose') {
          return colorize(`  ↳ Error:\n${result}`, colors.red, useColors);
        }
        return colorize(
          `  ↳ Error: ${result.slice(0, 60)}${result.length > 60 ? '...' : ''}`,
          colors.red,
          useColors
        );
      }

      if (verbosity === 'verbose') {
        return colorize(`  ↳ Result:\n${result}`, colors.dim, useColors);
      }
      return colorize(`  ↳ ${lineCount} lines of output`, colors.dim, useColors);
    }

    case 'tool.delta':
      // Skip deltas unless verbose
      if (verbosity !== 'verbose') return null;
      return colorize(`  [delta] ${JSON.stringify(event.partialResult)}`, colors.dim, useColors);

    // Agent lifecycle
    case 'agent.start':
      if (verbosity === 'verbose') {
        return colorize('[agent.start]', colors.cyan, useColors);
      }
      return null;

    case 'agent.end':
      if (verbosity === 'verbose') {
        return colorize(`[agent.end] ${event.interactions.length} turns`, colors.cyan, useColors);
      }
      return null;

    // Interaction lifecycle
    case 'interaction.start':
      if (verbosity === 'verbose') {
        return colorize(`[interaction.start] ${event.interactionId}`, colors.cyan, useColors);
      }
      return null;

    case 'interaction.end':
      if (verbosity === 'verbose') {
        return colorize('[interaction.end]', colors.cyan, useColors);
      }
      return null;

    case 'text.start':
      return null;

    default:
      // Verbose mode: show unknown events
      if (verbosity === 'verbose') {
        const jsonData = JSON.stringify(event, null, 2);
        return colorize(`[unknown]\n${jsonData}`, colors.dim, useColors);
      }
      return null;
  }
}

/**
 * Print formatted events from an async iterable, handling text streaming.
 */
export async function printFormattedEvents(
  stream: AsyncIterable<AgentEvent>,
  options?: FormatOptions
): Promise<void> {
  let lastWasText = false;

  for await (const event of stream) {
    const formatted = formatEvent(event, options);

    if (formatted !== null) {
      const isText = event.type === 'text.delta';

      if (isText) {
        process.stdout.write(formatted);
        lastWasText = true;
      } else {
        if (lastWasText) {
          process.stdout.write('\n');
          lastWasText = false;
        }
        console.log(formatted);
      }
    }
  }

  if (lastWasText) {
    process.stdout.write('\n');
  }
}

/**
 * Convenience helper that iterates through an agent event stream and prints formatted events.
 * Returns the final result after the stream completes.
 *
 * @example
 * ```typescript
 * import { agentLoop, printStream } from '@philschmid/agents-core';
 *
 * const stream = agentLoop([{ type: 'text', text: 'Hello!' }], { model: 'gemini-3-flash-preview' });
 * const result = await printStream(stream);
 * console.log('Done! Interaction ID:', result.interactionId);
 * ```
 */
export async function printStream(
  stream: AgentEventStream,
  options?: FormatOptions
): Promise<AgentLoopResult> {
  await printFormattedEvents(stream, options);
  return stream.result();
}
