/**
 * Multi-Turn Example - Debug Session State
 *
 * Tests whether AgentSession properly maintains context across multiple turns.
 *
 * Run: bun examples/multi-turn.ts
 */

import { type AgentEvent, createAgentSession } from '@philschmid/agent';

async function main() {
  console.log('=== Multi-Turn Session Debug ===\n');

  const session = createAgentSession({
    model: 'gemini-3-flash-preview',
    systemInstruction: 'Be extremely concise. One sentence max.',
    tools: [], // No built-in tools for this test
  });

  // Turn 1
  console.log('--- Turn 1: Introduce name ---');
  session.send('My name is Alice.');

  const turn1Events: AgentEvent[] = [];
  for await (const event of session.stream()) {
    turn1Events.push(event);
    if (event.type === 'interaction.start') {
      console.log('  >> interaction.start event:', JSON.stringify(event));
    }
    if (event.type === 'text.delta') {
      process.stdout.write(event.delta);
    }
  }
  console.log('\n');

  console.log('Turn 1 State:');
  console.log('  interactions.length:', session.state.interactions.length);
  console.log('  previousInteractionId:', session.state.previousInteractionId);
  console.log('  Event types:', turn1Events.map((e) => e.type).join(', '));
  console.log();

  // Turn 2
  console.log('--- Turn 2: Ask for name ---');
  session.send('What is my name?');

  const turn2Events: AgentEvent[] = [];
  let turn2Text = '';
  for await (const event of session.stream()) {
    turn2Events.push(event);
    console.log('Event:', event.type, JSON.stringify(event).substring(0, 100));
    if (event.type === 'text.delta') {
      turn2Text += event.delta;
    }
  }
  console.log('\n');

  console.log('Turn 2 State:');
  console.log('  interactions.length:', session.state.interactions.length);
  console.log('  previousInteractionId:', session.state.previousInteractionId);
  console.log('  Event types:', turn2Events.map((e) => e.type).join(', '));
  console.log('  Response text:', turn2Text);
  console.log();

  // Validation
  console.log('=== Validation ===');
  const hasAlice = turn2Text.toLowerCase().includes('alice');
  console.log('Response mentions Alice:', hasAlice ? '✅' : '❌');
  console.log('Interactions > 0:', session.state.interactions.length > 0 ? '✅' : '❌');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
