import { createAgentSession } from '@philschmid/agent';

const session = createAgentSession({
  model: 'gemini-3-flash-preview',
  systemInstruction: 'You are a helpful file assistant. Be concise.',
  tools: ['read', 'plan'],
});

session.send('Explore the current directory');

for await (const event of session.stream()) {
  console.log(event);
}
