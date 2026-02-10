/** Available tool names for getTools() */
export type ToolName =
  | 'sleep'
  | 'plan'
  | 'read'
  | 'write'
  | 'grep'
  | 'bash'
  | 'web_fetch'
  | 'web_search'
  | 'skills'
  | 'subagent';

export const DEFAULT_TOOL_NAMES: ToolName[] = [
  'sleep',
  'plan',
  'read',
  'write',
  'grep',
  'bash',
  'web_fetch',
  'web_search',
  'skills',
  'subagent',
];
