# @philschmid/agent

Agent wrapper with hooks system for `@philschmid/agents-core`.

## Installation

```bash
bun add @philschmid/agent
# or
npm install @philschmid/agent
```

## Features

- **AgentSession**: Stateful session with message queuing and hook support
- **Hooks System**: Intercept agent lifecycle (onAgentStart, beforeToolExecute, etc.)
- **Built-in Tools**: Read/write files, bash, grep, web search, and more
- **Skills & Subagents**: Load specialized skills and delegate to subagents

## Quick Start

```typescript
import { createAgentSession, printAgentStream } from '@philschmid/agent';

const session = createAgentSession({
  model: 'gemini-3-flash-preview',
  tools: ['read', 'write', 'bash'],
});

// Register hooks
session.on('beforeToolExecute', (event) => {
  console.log(`Executing: ${event.toolName}`);
  return { allow: true };
});

// Send message and stream
session.send('Read the package.json file');
await printAgentStream(session.stream(), { verbosity: 'verbose' });
```

## Built-in Tools

| Name | Description |
|------|-------------|
| `read` | Read file contents |
| `write` | Apply patches to files |
| `bash` | Execute shell commands |
| `grep` | Search files with patterns |
| `list` | List directory contents |
| `web_search` | Search the web |
| `web_fetch` | Fetch and parse URLs |
| `skills` | Load skill instructions |
| `subagent` | Delegate to subagents |

## API

See the [documentation](https://ia-agents.philschmid.dev) for full API reference.

## License

Apache-2.0
