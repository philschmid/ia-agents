/**
 * Agent Package Basic Example
 *
 * Shows basic usage of @philschmid/agent wrapper package.
 *
 * Run: bun examples/agent-basic.ts
 */

import * as fs from 'node:fs';
import { type AgentTool, createAgentSession } from '@philschmid/agent';
import { formatEvent, printStream } from '@philschmid/agents-core';

// ============================================================================
// Create session with hooks
// ============================================================================

const session = createAgentSession({
  model: 'gemini-3-flash-preview',
  systemInstruction: 'You are a helpful file assistant. Be concise.',
  tools: ['read', 'plan', 'subagent', 'write', 'bash'],
});

session.send(
  'Find the latest interactions api feedback on https://discuss.ai.google.dev/ with links and summaries save it to disk. '
);

for await (const event of session.stream()) {
  const formatted = formatEvent(event, { verbosity: 'verbose' });
  if (formatted) console.log(formatted);
}

// // Hook: Log when tools are called
// session.on('beforeToolExecute', (event) => {
//   console.log(`\n🔧 Tool: ${event.toolName}`);
//   console.log(`   Args: ${JSON.stringify(event.arguments)}`);
//   return { allow: true };
// });

// // Hook: Truncate long file reads
// session.on('afterToolExecute', (event) => {
//   if (event.toolName === 'read_file' && event.result.result.length > 500) {
//     return {
//       result: {
//         ...event.result,
//         result: `${event.result.result.slice(0, 500)}\n...(truncated)`,
//       },
//     };
//   }
//   return {};
// });
