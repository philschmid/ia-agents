/**
 * Agents-Core Types
 *
 * Core types for the agents-core framework.
 * Re-exports Interactions API types from @google/genai SDK.
 */

import type { Interactions } from '@google/genai';

// ============================================================================
// SDK Re-exports
// ============================================================================

export type Turn = Interactions.Turn;
export type FunctionCallContent = Interactions.FunctionCallContent;
export type FunctionResultContent = Interactions.FunctionResultContent;
export type TextContent = Interactions.TextContent;
export type ThoughtContent = Interactions.ThoughtContent;
export type InteractionSSEEvent = Interactions.InteractionSSEEvent;

// ============================================================================
// Agent Events (manually defined, dot notation)
// ============================================================================

/** Thought summary content - text or image */
export type ThoughtSummary = { type: 'text'; text: string } | { type: 'image'; data: string };

/** Agent event types emitted during agent loop execution */
export type AgentEvent =
  // Agent lifecycle
  | { type: 'agent.start' }
  | { type: 'agent.end'; interactions: Turn[]; interactionId: string; usage: Usage }
  // Interaction lifecycle (includes interaction_id from model)
  | { type: 'interaction.start'; interactionId: string }
  | { type: 'interaction.end'; turn: Turn }
  // Text streaming
  | { type: 'text.start'; index: number }
  | { type: 'text.delta'; index: number; delta: string }
  | { type: 'text.end'; index: number; text: string }
  // Thought streaming
  | { type: 'thought.summary'; summary: ThoughtSummary }
  // Tool execution
  | { type: 'tool.start'; id: string; name: string; arguments: unknown }
  | { type: 'tool.delta'; id: string; name: string; partialResult: AgentToolResult }
  | { type: 'tool.end'; id: string; name: string; result: string; isError: boolean };

// ============================================================================
// Agent Context
// ============================================================================

/** Token usage statistics (SDK format) */
export type Usage = {
  total_input_tokens?: number;
  total_output_tokens?: number;
  total_tokens?: number;
  total_thought_tokens?: number;
};

/** Agent context maintained during loop execution */
export type AgentContext = {
  /** Conversation history (turns) */
  interactions: Turn[];
  /** Previous interaction ID for conversation continuation */
  previousInteractionId?: string;
  /** Accumulated token usage */
  usage: Usage;
  /** Available tools */
  tools: AgentTool[];
  /** System instructions */
  systemInstruction?: string;
};

// ============================================================================
// Agent Tools
// ============================================================================

/** Result returned by a tool's execute function */
// biome-ignore lint/suspicious/noExplicitAny: Generic default for flexibility
export type AgentToolResult<TDetails = any> = {
  /** String result to return to the model */
  result: string;
  /** Whether the result represents an error */
  isError?: boolean;
  /** Optional details for UI display or streaming updates */
  details?: TDetails;
};

/** Callback for streaming tool execution updates */
// biome-ignore lint/suspicious/noExplicitAny: Generic default for flexibility
export type AgentToolUpdateCallback<TDetails = any> = (
  partialResult: AgentToolResult<TDetails>
) => void;

/** Tool definition for agent */
// biome-ignore lint/suspicious/noExplicitAny: Generic default for flexibility
export type AgentTool<TDetails = any> = {
  /** Tool name (function name) */
  name: string;
  /** Human-readable label for UI display */
  label: string;
  /** Description for the LLM */
  description: string;
  /** JSON Schema for parameters */
  parameters: Record<string, unknown>;
  /** Execute function with optional streaming callback */
  execute: (
    toolCallId: string,
    args: Record<string, unknown>,
    signal?: AbortSignal,
    onUpdate?: AgentToolUpdateCallback<TDetails>
  ) => Promise<AgentToolResult<TDetails>>;
};

/**
 * Configuration for defining a tool with Zod schema.
 * Used with the `tool()` factory function.
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic for Zod type inference
export type ToolConfig<TInput extends import('zod').ZodType<any>> = {
  /** Tool name (function name for the LLM) */
  name: string;
  /** Description for the LLM */
  description: string;
  /** Zod schema for parameters */
  parameters: TInput;
  /** Human-readable label for UI display (defaults to name) */
  label?: string;
  /** Execute function implementation */
  execute: (
    toolCallId: string,
    args: import('zod').infer<TInput>,
    signal?: AbortSignal,
    onUpdate?: AgentToolUpdateCallback
  ) => Promise<AgentToolResult> | AgentToolResult;
};

// ============================================================================
// Model Call Types
// ============================================================================

/** Configuration for calling the model */
export type ModelCallConfig = {
  /** Input content to send */
  input: Turn['content'];
  /** Previous interaction ID for continuation */
  previousInteractionId?: string;
  /** Model identifier */
  model: string;
  /** Available tools */
  tools?: AgentTool[];
  /** System instructions */
  systemInstruction?: string;
};

/** Result from model call */
export type ModelCallResult = {
  /** Output content blocks */
  // biome-ignore lint/suspicious/noExplicitAny: SDK output type varies
  outputs: any[];
  /** Interaction ID */
  interactionId: string;
  /** Token usage */
  usage: Usage;
};

// ============================================================================
// Loop Config & Result
// ============================================================================

/** Modifications returned by transformContext callback */
export type TransformContextModifications = Partial<AgentContext> & {
  /** Inject input to trigger additional loop */
  input?: string;
};

/** Transform context callback type */
export type TransformContextCallback = (
  context: Readonly<AgentContext>
) => Promise<TransformContextModifications | undefined> | TransformContextModifications | undefined;

/** Configuration for agentLoop */
export type AgentLoopConfig = {
  /** Model identifier */
  model: string;
  /** System instructions */
  systemInstruction?: string;
  /** Available tools */
  tools?: AgentTool[];
  /** Previous interaction ID for continuation */
  previousInteractionId?: string;
  /** Maximum iterations (prevents infinite loops). Defaults to config value. */
  maxIterations?: number;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Get follow-up messages from queue */
  getFollowUpMessages?: () => Turn[] | undefined;
  /**
   * Transform context before each LLM call.
   * Called by wrapper packages to implement hooks.
   * Can modify interactions, tools, or systemInstruction.
   */
  transformContext?: TransformContextCallback;
};

/** Result returned by agentLoop */
export type AgentLoopResult = {
  /** Full conversation history */
  interactions: Turn[];
  /** Final interaction ID for continuation */
  interactionId: string;
  /** Accumulated token usage */
  usage: Usage;
};
