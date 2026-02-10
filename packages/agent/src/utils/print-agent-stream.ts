/**
 * Print Agent Stream
 *
 * Utility for printing formatted events from an AgentSession stream.
 * Delegates to the core printFormattedEvents helper.
 */

import { type FormatOptions, printFormattedEvents } from '@philschmid/agents-core';
import type { AgentEvent } from '@philschmid/agents-core';

/**
 * Print formatted events from an AgentSession stream.
 *
 * @example
 * ```typescript
 * import { createAgentSession, printAgentStream } from '@philschmid/agent';
 *
 * const session = createAgentSession({ model: 'gemini-3-flash-preview', tools: ['read'] });
 * session.send('Hello!');
 * await printAgentStream(session.stream());
 * ```
 */
export async function printAgentStream(
  stream: AsyncIterable<AgentEvent>,
  options?: FormatOptions
): Promise<void> {
  await printFormattedEvents(stream, options);
}
