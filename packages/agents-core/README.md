# @philschmid/agents-core

Minimal agent framework for the **Gemini Interactions API**.

Based on [pi-ai EventStream pattern](https://github.com/badlogic/pi-mono).

## Installation

```bash
bun add @philschmid/agents-core
# or
npm install @philschmid/agents-core
```

## Examples

### 1. Basic Agent Loop

```typescript
import { agentLoop, printStream } from '@philschmid/agents-core';

const stream = agentLoop([{ type: 'text', text: 'What is 5 + 3?' }], {
  model: 'gemini-3-flash-preview',
  systemInstruction: 'You are a helpful assistant.',
});

await printStream(stream, { verbosity: 'normal' });
```

### 2. Multi-turn with previousInteractionId

```typescript
import { agentLoop, printStream } from '@philschmid/agents-core';

// Turn 1
const stream1 = agentLoop([{ type: 'text', text: 'What is 5 + 3?' }], {
  model: 'gemini-3-flash-preview',
});
await printStream(stream1);
const result1 = await stream1.result();

// Turn 2 (continues conversation)
const stream2 = agentLoop([{ type: 'text', text: 'Multiply that by 2' }], {
  model: 'gemini-3-flash-preview',
  previousInteractionId: result1.interactionId,
});
await printStream(stream2);
```

### 3. With Tools

```typescript
import { agentLoop, printStream, type AgentTool } from '@philschmid/agents-core';

const calculate: AgentTool = {
  name: 'calculate',
  label: 'Calculator',
  description: 'Evaluate math expression',
  parameters: { type: 'object', properties: { expr: { type: 'string' } } },
  execute: async (id, args) => ({ result: String(eval(args.expr as string)) }),
};

const stream = agentLoop([{ type: 'text', text: 'What is 123 * 456?' }], {
  model: 'gemini-3-flash-preview',
  tools: [calculate],
});

for await (const event of stream) {
  if (event.type === 'text.delta') process.stdout.write(event.delta);
  if (event.type === 'tool.start') console.log(`\n[Calling ${event.name}]`);
}
```

## API

```typescript
// agentLoop - one-shot agent execution
const stream = agentLoop(input, options);

for await (const event of stream) {
  // Handle events
}

const result = await stream.result();
// result.interactionId - use for multi-turn chaining
// result.interactions - full conversation history
// result.usage - token usage
```

> **Note:** For multi-turn with message queuing, use `AgentSession` from `@philschmid/agent`.