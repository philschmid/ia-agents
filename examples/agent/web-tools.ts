/**
 * Web Tools Example
 *
 * Uses web search and fetch tools.
 *
 * Run: bun examples/agent/web-tools.ts
 */

import { createAgentSession, printAgentStream } from '@philschmid/agent';

const session = createAgentSession({
  model: 'gemini-3-flash-preview',
  tools: ['web_search', 'web_fetch'],
});

session.send('What is the latest news about AI?');
await printAgentStream(session.stream(), { verbosity: 'verbose' });
