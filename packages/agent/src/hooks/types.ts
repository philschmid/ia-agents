/**
 * Hook Types
 *
 * Event and result types for the hooks system.
 */

import type { AgentContext, AgentToolResult, Turn } from '@philschmid/agents-core';

// ============================================================================
// Hook Event Types
// ============================================================================

/** Event dispatched when agent loop begins */
export type OnAgentStartEvent = {
  type: 'onAgentStart';
  /** Current tools (can be modified) */
  tools: AgentContext['tools'];
  /** Current system instruction (can be modified) */
  systemInstruction?: string;
  /** Current input (can be modified) */
  input: Turn['content'];
};

/** Event dispatched before each LLM call */
export type OnInteractionStartEvent = {
  type: 'onInteractionStart';
  /** Current interactions (can be filtered) */
  interactions: Turn[];
};

/** Event dispatched before tool execution */
export type BeforeToolExecuteEvent = {
  type: 'beforeToolExecute';
  /** Tool name */
  toolName: string;
  /** Tool call ID */
  toolCallId: string;
  /** Tool arguments (can be modified) */
  arguments: Record<string, unknown>;
};

/** Event dispatched after tool execution */
export type AfterToolExecuteEvent = {
  type: 'afterToolExecute';
  /** Tool name */
  toolName: string;
  /** Tool call ID */
  toolCallId: string;
  /** Tool result (can be modified) */
  result: AgentToolResult;
};

/** Event dispatched after an interaction completes */
export type OnInteractionEndEvent = {
  type: 'onInteractionEnd';
  /** The completed turn */
  turn: Turn;
};

/** Event dispatched when agent loop ends */
export type OnAgentEndEvent = {
  type: 'onAgentEnd';
  /** Number of interactions completed */
  interactionCount: number;
  /** Number of files modified (if tracked) */
  filesModified?: number;
};

// ============================================================================
// Hook Result Types
// ============================================================================

/** Result from onAgentStart hook */
export type OnAgentStartResult = {
  /** Modified tools */
  tools?: AgentContext['tools'];
  /** Modified system instruction */
  systemInstruction?: string;
  /** Modified input */
  input?: Turn['content'];
};

/** Result from onInteractionStart hook */
export type OnInteractionStartResult = {
  /** Modified interactions (filtered/transformed) */
  interactions?: Turn[];
};

/** Result from beforeToolExecute hook */
export type BeforeToolExecuteResult = {
  /** Whether to allow execution */
  allow: boolean;
  /** Reason for blocking (if allow is false) */
  reason?: string;
  /** Modified arguments */
  arguments?: Record<string, unknown>;
};

/** Result from afterToolExecute hook */
export type AfterToolExecuteResult = {
  /** Modified result */
  result?: AgentToolResult;
};

/** Result from onInteractionEnd hook (observe only, no modifications) */
export type OnInteractionEndResult = undefined;

/** Result from onAgentEnd hook */
export type OnAgentEndResult = {
  /** Inject follow-up input to trigger another loop */
  input?: string;
};

// ============================================================================
// Hook Handler Types
// ============================================================================

/** Union of all hook events */
export type HookEvent =
  | OnAgentStartEvent
  | OnInteractionStartEvent
  | BeforeToolExecuteEvent
  | AfterToolExecuteEvent
  | OnInteractionEndEvent
  | OnAgentEndEvent;

/** Union of all hook results */
export type HookResult =
  | OnAgentStartResult
  | OnInteractionStartResult
  | BeforeToolExecuteResult
  | AfterToolExecuteResult
  | OnInteractionEndResult
  | OnAgentEndResult;

/** Hook names */
export type HookName =
  | 'onAgentStart'
  | 'onInteractionStart'
  | 'beforeToolExecute'
  | 'afterToolExecute'
  | 'onInteractionEnd'
  | 'onAgentEnd';

/** Generic hook handler type */
export type HookHandler<TEvent extends HookEvent, TResult> = (
  event: TEvent
) => TResult | Promise<TResult>;

/** Map of hook names to their handler types */
export type HookHandlers = {
  onAgentStart: HookHandler<OnAgentStartEvent, OnAgentStartResult | undefined>;
  onInteractionStart: HookHandler<OnInteractionStartEvent, OnInteractionStartResult | undefined>;
  beforeToolExecute: HookHandler<BeforeToolExecuteEvent, BeforeToolExecuteResult>;
  afterToolExecute: HookHandler<AfterToolExecuteEvent, AfterToolExecuteResult | undefined>;
  onInteractionEnd: HookHandler<OnInteractionEndEvent, OnInteractionEndResult>;
  onAgentEnd: HookHandler<OnAgentEndEvent, OnAgentEndResult | undefined>;
};
