/**
 * Agents-Core
 *
 * Minimal agent framework for Gemini Interactions API.
 */

export { loadConfig, CoreConfigSchema, CONFIG, type CoreConfig } from './config';

// Core loop
export { agentLoop } from './agent-loop';

// Tool factory
export { tool, type ToolConfig } from './tool';

// Model layer
export { callModel } from './model';

// Event stream
export { EventStream, createAgentEventStream, type AgentEventStream } from './utils/event-stream';

// Formatter
export {
  formatEvent,
  formatArgs,
  printFormattedEvents,
  printStream,
  type FormatOptions,
} from './utils/formatter';

// Debug utilities
export { createDebug, debug, isDebugEnabled } from './utils/debug';

// Types
export type {
  AgentContext,
  AgentEvent,
  AgentLoopConfig,
  AgentLoopResult,
  AgentTool,
  AgentToolResult,
  AgentToolUpdateCallback,
  FunctionCallContent,
  FunctionResultContent,
  InteractionSSEEvent,
  ModelCallConfig,
  ModelCallResult,
  TextContent,
  ThoughtContent,
  ThoughtSummary,
  TransformContextCallback,
  TransformContextModifications,
  Turn,
  Usage,
} from './types';

// Context utilities
export { pruneContext } from './context';
