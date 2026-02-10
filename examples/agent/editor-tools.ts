/**
 * Editor Tools Example
 *
 * Uses apply patch along with read file.
 *
 * Run: bun examples/agent/editor-tools.ts
 */

import { createAgentSession, printAgentStream } from '@philschmid/agent';

const session = createAgentSession({
  model: 'gemini-3-flash-preview',
  tools: ['read', 'write', 'grep'],
});

session.send('Read the package.json and describe its contents');
await printAgentStream(session.stream(), { verbosity: 'verbose' });
