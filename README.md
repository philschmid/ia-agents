# ia-agents

Minimal agent framework for the **Gemini Interactions API**.

## Features

- 🔄 **Streaming Agent Loop** — Built on the stateful Interactions API with multi-turn, multi-modal support
- 🛠️ **Tool Calling** — Define tools with JSON Schema and let Gemini execute them
- 🪝 **Hooks System** — Intercept and control agent lifecycle events (block, modify, observe, inject)
- 🧰 **Built-in Tools** — File I/O, bash, grep, web search, planning, and more out of the box
- 🧩 **Skills & Subagents** — Extend capabilities with disk-loaded YAML+Markdown artifacts
- ⚙️ **Configuration** — Typesafe config via `settings.json` and `AGENT_*` environment variables
- 📦 **Modular Packages** — Use the core or add the agent wrapper as needed

## Installation

Install packages directly from the GitHub repository:

```bash
# bun
bun add github:philschmid/ia-agents/packages/agents-core
bun add github:philschmid/ia-agents/packages/agent

# npm
npm install github:philschmid/ia-agents#main --workspace=packages/agents-core
npm install github:philschmid/ia-agents#main --workspace=packages/agent
```

## Quick Start

```bash
bun install
bun run build                # Build packages
bun examples/simple.ts       # Run example
```

## Packages

| Package | Description |
|---------|-------------|
| [@philschmid/agents-core](./packages/agents-core) | Core agent framework (agentLoop, tool execution) |
| [@philschmid/agent](./packages/agent) | Agent wrapper with hooks, tools, skills, and session management |

### Core Package (`agents-core`)

The foundation for building agents:

```typescript
import { agentLoop, printStream } from '@philschmid/agents-core';

const stream = agentLoop([{ type: 'text', text: 'Hello!' }], {
  model: 'gemini-3-flash-preview',
  tools: [myTool],
});

await printStream(stream, { verbosity: 'verbose' });
```

### Agent Package (`agent`)

Adds lifecycle hooks, built-in tools, and session management:

```typescript
import { createAgentSession, printAgentStream } from '@philschmid/agent';

const session = createAgentSession({
  model: 'gemini-3-flash-preview',
  tools: ['read', 'bash', 'web_search'],
});

// Block dangerous commands
session.on('beforeToolExecute', (event) => {
  if (event.toolName === 'bash' && event.arguments.command?.includes('rm -rf')) {
    return { allow: false, reason: 'Destructive command blocked' };
  }
  return { allow: true };
});

session.send('List files');
await printAgentStream(session.stream(), { verbosity: 'verbose' });
```

## Hook Types

| Hook | When | Can |
|------|------|-----|
| `onAgentStart` | Before first LLM call | Modify tools, system instruction |
| `onInteractionStart` | Before each LLM call | Filter interactions (context window) |
| `beforeToolExecute` | Before tool runs | Block execution, modify arguments |
| `afterToolExecute` | After tool runs | Modify results |
| `onInteractionEnd` | After LLM turn | Observe (logging, metrics) |
| `onAgentEnd` | After agent completes | Inject follow-up input |

## Examples

| Example | Description |
|---------|-------------|
| [`simple.ts`](./examples/simple.ts) | Core agent loop with a custom tool |
| [`multi-turn.ts`](./examples/multi-turn.ts) | Multi-turn conversation |
| [`cli.ts`](./examples/cli.ts) | Interactive chat REPL |
| [`agent-simple.ts`](./examples/agent-simple.ts) | Agent package with hooks |
| [`agent-with-hooks.ts`](./examples/agent-with-hooks.ts) | Bash tool with command blocking |
| [`agent/all-tools.ts`](./examples/agent/all-tools.ts) | All built-in tools |
| [`agent/skills.ts`](./examples/agent/skills.ts) | Skills artifact loading |
| [`agent/subagents.ts`](./examples/agent/subagents.ts) | Subagent delegation |

## Development

```bash
bun run lint      # Check code style
bun run lint:fix  # Fix lint issues
bun test          # Run tests
bun run build     # Build packages
```

## Acknowledgements

This project was inspired by [pi-mono](https://github.com/badlogic/pi-mono) by [Mario Zechner](https://github.com/badlogic). The agent loop architecture and event streaming patterns were adapted from their excellent work.

## License

Apache-2.0
