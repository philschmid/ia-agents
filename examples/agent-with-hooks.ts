/**
 * Agent Package with Hooks Example
 *
 * Demonstrates using @philschmid/agent with hooks for:
 * - Blocking dangerous bash commands (rm, rf, etc.)
 * - Logging tool execution
 *
 * Run: bun examples/agent-with-hooks.ts
 */

import { spawn } from 'node:child_process';
import { type AgentTool, createAgentSession } from '@philschmid/agent';

// ============================================================================
// Define a bash tool
// ============================================================================

const bashTool: AgentTool = {
  name: 'bash',
  label: 'Execute Bash Command',
  description: 'Executes a bash command and returns the output.',
  parameters: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'The bash command to execute' },
    },
    required: ['command'],
  },
  execute: async (_id, args) => {
    const command = args.command as string;
    return new Promise((resolve) => {
      const proc = spawn('bash', ['-c', command]);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data;
      });
      proc.stderr.on('data', (data) => {
        stderr += data;
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          resolve({ result: stderr || `Exit code: ${code}`, isError: true });
        } else {
          resolve({ result: stdout || '(no output)' });
        }
      });
    });
  },
};

// ============================================================================
// Create session with hooks
// ============================================================================

const session = createAgentSession({
  model: 'gemini-3-flash-preview',
  systemInstruction: 'You are a helpful coding assistant with bash access.',
});

// Add custom tools that aren't part of the built-in ToolName set
session.updateTools([bashTool]);

// ============================================================================
// Hook: Block dangerous commands
// ============================================================================

const DANGEROUS_PATTERNS = [
  /\brm\s+(-rf?|--recursive)/i,
  /\brm\b.*\/\s*$/,
  /\b(mkfs|dd\s+if=|>\s*\/dev\/)/i,
  /\bchmod\s+777/,
  /\b(shutdown|reboot|halt)\b/i,
];

session.on('beforeToolExecute', (event) => {
  if (event.toolName !== 'bash') {
    return { allow: true };
  }

  const command = event.arguments.command as string;

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      console.log(`\n🚫 BLOCKED: "${command}"\n`);
      return {
        allow: false,
        reason: `Dangerous command detected: ${command}`,
      };
    }
  }

  console.log(`\n✅ ALLOWED: "${command}"\n`);
  return { allow: true };
});

// ============================================================================
// Hook: Log tool results
// ============================================================================

session.on('afterToolExecute', (event) => {
  const preview = event.result.result?.slice(0, 100);
  console.log(`📤 Result: ${preview}${event.result.result?.length > 100 ? '...' : ''}`);
  return {}; // No modifications
});

// ============================================================================
// Run the agent
// ============================================================================

console.log('Agent with Bash Tool (dangerous commands are blocked)\n');
console.log('Try asking: "List files in current dir" or "Remove all files"\n');

session.send('List the files in the current directory, then tell me how many there are.');

for await (const event of session.stream()) {
  if (event.type === 'text.delta') {
    process.stdout.write(event.delta);
  }
}

console.log('\n');
