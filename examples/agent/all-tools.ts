/**
 * All Tools Example
 *
 * Uses all available tools via tool names.
 *
 * Run: bun examples/agent/all-tools.ts
 */

import { createAgentSession, printAgentStream } from '@philschmid/agent';

const session = createAgentSession({
  model: 'gemini-3-flash-preview',
  tools: ['sleep', 'plan', 'read', 'write', 'grep', 'bash', 'web_fetch', 'web_search'],
});

session.send('List the current directory and show the first 5 lines of package.json');
await printAgentStream(session.stream(), { verbosity: 'verbose' });
