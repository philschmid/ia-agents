/**
 * Subagents Example
 *
 * Demonstrates how to delegate tasks to specialized subagents.
 * Subagents are loaded from .agent/subagents/ .md files.
 *
 * Run: bun examples/agent/subagents.ts
 */

import { createAgentSession, printAgentStream } from '@philschmid/agent';

// Create a session with subagent tool enabled
// Subagents are automatically loaded from AGENT_ARTIFACTS_PATH (default: .agent/)
const session = createAgentSession({
  model: 'gemini-3-flash-preview',
  tools: ['subagent', 'read'], // subagent tool enables delegation, read includes directory listing
});

// The agent can delegate tasks to specialized subagents
session.send(
  'Delegate the task of listing files in the examples directory to the file-explorer subagent'
);
await printAgentStream(session.stream(), { verbosity: 'verbose' });
