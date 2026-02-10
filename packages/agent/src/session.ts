import {
  type AgentContext as AgentContextType,
  type AgentEvent,
  type AgentLoopResult,
  type AgentTool,
  type Turn,
  agentLoop,
} from '@philschmid/agents-core';
import type { AgentEventStream } from '@philschmid/agents-core';
import { CONFIG } from './config';
import { AgentContext } from './context';
import { HookRunner } from './hooks/runner';
import type { HookHandlers, HookName } from './hooks/types';
import { buildToolSystemInstruction } from './prompts';
import { type ToolName, getTools } from './tools';
import { wrapToolsWithHooks } from './utils/wrap-tools';

// ============================================================================
// AgentSession Options
// ============================================================================

export type { ToolName } from './tools';

export type AgentSessionOptions = {
  /** Model identifier (e.g., 'gemini-3-flash-preview') */
  model?: string;
  /** System instructions */
  systemInstruction?: string;
  /** Tool names to load (e.g., ['read', 'write', 'bash']). Falls back to AGENT_DEFAULT_TOOLS if not specified. */
  tools?: ToolName[];
  /** Previous interaction ID for continuation */
  previousInteractionId?: string;
  /** Maximum number of onAgentEnd injection loops (prevents infinite loops) */
  maxInjectionLoops?: number;
  /** Working directory for file operations. Defaults to process.cwd(). Immutable after creation. */
  cwd?: string;
};

// ============================================================================
// Helper
// ============================================================================

/** Format input to content array. */
function formatInput(input: string | Turn['content']): Turn['content'] {
  if (typeof input === 'string') {
    return [{ type: 'text', text: input }];
  }
  return input;
}

// ============================================================================
// AgentSession Class
// ============================================================================

/**
 * Agent session with hooks support.
 *
 * Features:
 * - Hook registration via `.on()`
 * - Automatic tool wrapping for beforeToolExecute/afterToolExecute
 * - onAgentStart/onAgentEnd lifecycle hooks
 * - Multi-turn conversation state management
 */
export class AgentSession {
  // State management (previously in Session)
  private context: AgentContextType;
  private queue: Turn[] = [];
  private currentStream: AgentEventStream | null = null;
  private abortController: AbortController | null = null;
  private model: string;
  private systemInstruction?: string;
  private readonly _cwd: string;

  // Hook support
  private hooks: HookRunner;
  private originalTools: AgentTool[];
  private wrappedTools: AgentTool[];
  private maxInjectionLoops: number;
  private hasStarted = false;

  constructor(options: AgentSessionOptions = {}) {
    this.hooks = new HookRunner();
    this.maxInjectionLoops = options.maxInjectionLoops ?? 3;
    this.model = options.model || 'gemini-3-flash-preview';
    this._cwd = options.cwd ?? process.cwd();

    // Load tools by name, fallback to default tools from config
    const toolNames = options.tools ?? (CONFIG.defaultTools as ToolName[]);
    this.originalTools = toolNames.length > 0 ? getTools(toolNames) : [];

    // Wrap tools with hooks
    this.wrappedTools = wrapToolsWithHooks(this.originalTools, this.hooks);

    // Build system instruction with tool-specific sections (skills, subagents)
    this.systemInstruction = buildToolSystemInstruction(
      options.systemInstruction ?? '',
      this.originalTools
    );

    // Initialize context
    this.context = {
      interactions: [],
      previousInteractionId: options.previousInteractionId,
      usage: {},
      tools: this.wrappedTools,
      systemInstruction: this.systemInstruction,
    };
  }

  // ============================================================================
  // State Setters
  // ============================================================================

  /** Update available tools. */
  updateTools(tools: AgentTool[]): void {
    this.originalTools = tools;
    this.wrappedTools = wrapToolsWithHooks(tools, this.hooks);
    this.context.tools = this.wrappedTools;
  }

  /** Update system instruction. */
  updateSystemInstruction(instruction: string): void {
    this.systemInstruction = instruction;
    this.context.systemInstruction = instruction;
  }

  // ============================================================================
  // Hook Registration
  // ============================================================================

  /**
   * Register a hook handler.
   *
   * @example
   * ```typescript
   * session.on('beforeToolExecute', async (event) => {
   *   if (event.toolName === 'bash' && event.arguments.command?.includes('rm')) {
   *     return { allow: false, reason: 'Destructive command blocked' };
   *   }
   *   return { allow: true };
   * });
   * ```
   */
  on<K extends HookName>(hookName: K, handler: HookHandlers[K]): this {
    this.hooks.on(hookName, handler);
    return this;
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /** Send a message to the session. Queues the message for streaming. */
  send(input: string | Turn['content']): void {
    const content = formatInput(input);
    const turn: Turn = { role: 'user', content };
    this.queue.push(turn);
  }

  /** Stream events from the agent loop with hooks. */
  async *stream(): AsyncGenerator<AgentEvent, AgentLoopResult | undefined, unknown> {
    // Run entire stream within the session's cwd context
    const result = yield* AgentContext.runGenerator({ cwd: this._cwd }, this._streamInternal());
    return result;
  }

  /** Internal stream implementation. */
  private async *_streamInternal(): AsyncGenerator<
    AgentEvent,
    AgentLoopResult | undefined,
    unknown
  > {
    // If no messages queued, nothing to stream
    if (this.queue.length === 0) {
      return undefined;
    }

    // Take first message from queue to start the loop
    const firstTurn = this.queue.shift();
    if (!firstTurn) {
      return undefined;
    }

    let injectionCount = 0;

    // Run onAgentStart hooks before the first stream iteration (only on first call)
    if (!this.hasStarted && this.hooks.has('onAgentStart')) {
      this.hasStarted = true;
      const startResult = await this.hooks.emit('onAgentStart', {
        type: 'onAgentStart',
        tools: this.context.tools,
        systemInstruction: this.context.systemInstruction,
        input: [],
      });

      // Apply modifications from onAgentStart
      if (startResult.tools) {
        this.updateTools(startResult.tools as AgentTool[]);
      }
      if (startResult.systemInstruction) {
        this.updateSystemInstruction(startResult.systemInstruction);
      }
      if (startResult.input) {
        this.send(startResult.input as string | Turn['content']);
      }
    } else if (!this.hasStarted) {
      this.hasStarted = true;
    }

    while (true) {
      this.abortController = new AbortController();

      // Start agent loop
      const stream = agentLoop(firstTurn.content, {
        model: this.model,
        systemInstruction: this.systemInstruction,
        tools: this.context.tools,
        previousInteractionId: this.context.previousInteractionId,
        signal: this.abortController.signal,
        getFollowUpMessages: () => {
          if (this.queue.length === 0) return undefined;
          const messages = this.queue.slice();
          this.queue = [];
          return messages;
        },
      });

      this.currentStream = stream;

      let result: AgentLoopResult | undefined;

      try {
        // Yield all events
        for await (const event of stream) {
          // Update state based on events
          if (event.type === 'interaction.start') {
            this.context.previousInteractionId = event.interactionId;
          } else if (event.type === 'agent.end') {
            this.context.interactions = event.interactions;
          }

          // Run onInteractionEnd hooks
          if (event.type === 'interaction.end' && this.hooks.has('onInteractionEnd')) {
            await this.hooks.emit('onInteractionEnd', {
              type: 'onInteractionEnd',
              turn: event.turn,
            });
          }

          yield event;

          if (event.type === 'agent.end') {
            result = {
              interactions: event.interactions,
              interactionId: this.context.previousInteractionId || '',
              usage: this.context.usage,
            };
          }
        }

        // Get final result
        const loopResult = await stream.result();
        this.context.previousInteractionId = loopResult.interactionId;
        this.context.usage = loopResult.usage;
        this.context.interactions = loopResult.interactions;

        result = loopResult;
      } finally {
        this.currentStream = null;
        this.abortController = null;
      }

      // Run onAgentEnd hooks
      if (this.hooks.has('onAgentEnd') && injectionCount < this.maxInjectionLoops) {
        const endResult = await this.hooks.emit('onAgentEnd', {
          type: 'onAgentEnd',
          interactionCount: result?.interactions.length || 0,
        });

        if (endResult.input) {
          // Inject follow-up input
          this.send(endResult.input);
          injectionCount++;
          continue; // Start another loop iteration
        }
      }

      // No injection, we're done
      return result;
    }
  }

  /** Abort the current stream. */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.currentStream = null;
    this.queue = [];
  }

  /** Get the AbortSignal for the current stream. */
  get signal(): AbortSignal | undefined {
    return this.abortController?.signal;
  }

  /** Clear the message queue. */
  clearQueue(): void {
    this.queue = [];
  }

  /** Get current session state (read-only). */
  get state(): Readonly<AgentContextType> {
    return this.context;
  }

  /** Check if session is currently streaming. */
  get isStreaming(): boolean {
    return this.currentStream !== null;
  }

  /** Get the hook runner for advanced use cases. */
  get hookRunner(): HookRunner {
    return this.hooks;
  }

  /** Get the working directory for this session (read-only). */
  get cwd(): string {
    return this._cwd;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new agent session with hooks support.
 *
 * @example
 * ```typescript
 * const session = createAgentSession({
 *   model: 'gemini-3-flash-preview',
 *   tools: ['read', 'write', 'bash'],
 * });
 *
 * // Register hooks
 * session.on('beforeToolExecute', (event) => {
 *   console.log(`Executing: ${event.toolName}`);
 *   return { allow: true };
 * });
 *
 * // Use the session
 * session.send('Hello');
 * for await (const event of session.stream()) {
 *   console.log(event.type);
 * }
 * ```
 */
export function createAgentSession(options: AgentSessionOptions = {}): AgentSession {
  return new AgentSession(options);
}
