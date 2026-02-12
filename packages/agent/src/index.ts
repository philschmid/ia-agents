/**
 * @philschmid/agent
 *
 * Agent wrapper with hooks system for @philschmid/agents-core.
 */

// Session with hooks
export { AgentSession, createAgentSession, type AgentSessionOptions } from './session';

// Agent context for tools
export { AgentContext } from './context';

// Hook system
export { HookRunner } from './hooks/runner';
export type {
  AfterToolExecuteEvent,
  AfterToolExecuteResult,
  BeforeToolExecuteEvent,
  BeforeToolExecuteResult,
  HookEvent,
  HookHandler,
  HookHandlers,
  HookName,
  HookResult,
  OnAgentEndEvent,
  OnAgentEndResult,
  OnAgentStartEvent,
  OnAgentStartResult,
  OnInteractionEndEvent,
  OnInteractionEndResult,
  OnInteractionStartEvent,
  OnInteractionStartResult,
} from './hooks/types';

// Utilities
export { wrapToolsWithHooks } from './utils/wrap-tools';
export { printAgentStream } from './utils/print-agent-stream';

// Tools
export {
  sleepTool,
  updatePlanTool,
  readFileTool,
  listDirectoryTool,
  grepTool,
  bashTool,
  applyPatchTool,
  webFetchTool,
  webSearchTool,
  getTools,
  // Skill tool factory and system instruction
  createSkillTool,
  createSkillSystemInstruction,
  // Subagent tool factory and system instruction
  createSubagentTool,
  createSubagentSystemInstruction,
  // Type exports
  type ToolName,
  DEFAULT_TOOL_NAMES,
} from './tools';

// System instruction builder
export { buildToolSystemInstruction } from './prompts';

// Load artifacts (skills, subagents)
export {
  parseArtifact,
  loadArtifact,
  type LoadedArtifact,
  getDefaultLayers,
  loadSkills,
  loadSubagents,
  SkillMetadataSchema,
  SubagentMetadataSchema,
  type ArtifactLayer,
  type ArtifactSource,
  type Skill,
  type SkillMetadata,
  type Subagent,
  type SubagentMetadata,
} from './load_artifacts';

// Re-export core types for convenience
export type {
  AgentContext as SessionState,
  AgentEvent,
  AgentLoopResult,
  AgentTool,
  AgentToolResult,
  Turn,
} from '@philschmid/agents-core';
