import * as fs from 'node:fs';
import { type AgentTool, agentLoop, printStream } from '@philschmid/agents-core';

// Define tool with AgentTool type
const listDirTool: AgentTool = {
  name: 'list_dir',
  label: 'List Directory',
  description: 'Lists the contents of a directory.',
  parameters: {
    type: 'object',
    properties: {
      directory_path: { type: 'string', description: 'Path to directory' },
    },
    required: ['directory_path'],
  },
  execute: async (_id, args) => {
    const items = fs.readdirSync(args.directory_path as string);
    return { result: items.join(', ') };
  },
};

// Run the agent loop and print formatted output
const stream = agentLoop([{ type: 'text', text: 'List my files in the current directory' }], {
  model: 'gemini-3-flash-preview',
  tools: [listDirTool],
});

await printStream(stream, {
  verbosity: 'verbose',
});
