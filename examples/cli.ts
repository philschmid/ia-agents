/**
 * Basic CLI Example
 *
 * Simple REPL for chatting with Gemini.
 *
 * Run: bun examples/cli.ts
 */

import * as readline from 'node:readline';
import { createAgentSession } from '@philschmid/agent';

const session = createAgentSession({
  model: 'gemini-3-flash-preview',
  systemInstruction: 'You are a helpful assistant. Be concise.',
  tools: [], // Custom tools not supported via ToolName, use agentLoop for custom tools
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('Chat with Gemini (type "exit" to quit)\n');

async function chat() {
  while (true) {
    const input = await new Promise<string>((resolve) => {
      rl.question('You: ', resolve);
    });

    if (input.toLowerCase() === 'exit') {
      console.log('Goodbye!');
      rl.close();
      break;
    }

    if (!input.trim()) continue;

    process.stdout.write('AI: ');
    session.send(input);

    for await (const event of session.stream()) {
      if (event.type === 'text.delta') {
        process.stdout.write(event.delta);
      }
    }
    console.log('\n');
  }
}

chat().catch(console.error);
