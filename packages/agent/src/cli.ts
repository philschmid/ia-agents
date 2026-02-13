/**
 * Agent CLI
 *
 * Send a prompt to the agent:
 *   agent "say hello"
 *   echo "Summarize this" | agent
 *   cat prompt.md | agent --model gemini-3-flash-preview --tools read,grep
 *
 * Flags:
 *   --model, -m    Model ID (default: gemini-3-flash-preview)
 *   --tools, -t    Comma-separated tool names (default: all)
 *   --system, -s   System instruction
 *   --help, -h     Show usage
 */

import { parseArgs } from 'node:util';
import { createAgentSession, printAgentStream, DEFAULT_TOOL_NAMES, type ToolName } from './index';

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const USAGE = `
Usage: agent [options] [prompt]

Send a prompt to the agent:
  agent "say hello"
  echo "Hello" | agent
  cat prompt.md | agent --tools read,grep

Options:
  -m, --model <id>      Model ID (default: gemini-3-flash-preview)
  -t, --tools <names>   Comma-separated tool names (default: all)
                        Available: ${DEFAULT_TOOL_NAMES.join(', ')}
  -s, --system <text>   System instruction
  -h, --help            Show this help
`.trim();

const { values, positionals } = parseArgs({
  options: {
    model: { type: 'string', short: 'm' },
    tools: { type: 'string', short: 't' },
    system: { type: 'string', short: 's' },
    help: { type: 'boolean', short: 'h' },
  },
  strict: true,
  allowPositionals: true,
});

if (values.help) {
  console.log(USAGE);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Read stdin
// ---------------------------------------------------------------------------

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8').trim()));
    process.stdin.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Resolve input: positional args + piped stdin (combined when both present)
// ---------------------------------------------------------------------------

const prompt = positionals.length > 0 ? positionals.join(' ') : '';
const piped = !process.stdin.isTTY ? await readStdin() : '';

let input: string;

if (prompt && piped) {
  input = `${prompt}\n\n${piped}`;
} else if (piped) {
  input = piped;
} else if (prompt) {
  input = prompt;
} else {
  console.error('Error: No prompt provided. Pass a prompt or pipe text via stdin.\n');
  console.log(USAGE);
  process.exit(1);
}

if (!input) {
  console.error('Error: Empty input.');
  process.exit(1);
}

const toolNames = values.tools
  ? (values.tools.split(',').map((t) => t.trim()) as ToolName[])
  : undefined;

const session = createAgentSession({
  model: values.model ?? 'gemini-3-flash-preview',
  ...(toolNames && { tools: toolNames }),
  ...(values.system && { systemInstruction: values.system }),
});

session.send(input);
await printAgentStream(session.stream());
