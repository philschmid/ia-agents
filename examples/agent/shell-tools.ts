/**
 * Shell Tools Example
 *
 * Uses bash and grep tools.
 *
 * Run: bun examples/agent/shell-tools.ts
 */

import { createAgentSession, printAgentStream } from '@philschmid/agent';

const session = createAgentSession({
  model: 'gemini-3-flash-preview',
  tools: ['bash', 'grep'],
});

session.send('Find all TypeScript files and count them');
await printAgentStream(session.stream(), { verbosity: 'verbose' });
