/**
 * Skills Example
 *
 * Demonstrates how to use skills with an agent session.
 * Skills are loaded from .agent/skills/ directories.
 *
 * Run: bun examples/agent/skills.ts
 */

import { createAgentSession, printAgentStream } from '@philschmid/agent';

// Create a session with skills tool enabled
// Skills are automatically loaded from AGENT_ARTIFACTS_PATH (default: .agent/)
const session = createAgentSession({
  model: 'gemini-3-flash-preview',
  tools: ['skills', 'read', 'write'], // skills tool enables skill loading
});

// The agent can now load skills on demand when relevant to the task
session.send(
  'Use the doc-writer skill to review examples/agent-simple.ts and convert into a documentation page, saving it in the current directory.'
);
await printAgentStream(session.stream(), { verbosity: 'verbose' });
