/**
 * HookRunner
 *
 * Manages hook registration and execution.
 * Runs handlers in registration order, merging results.
 */

import type {
  AfterToolExecuteEvent,
  AfterToolExecuteResult,
  BeforeToolExecuteEvent,
  BeforeToolExecuteResult,
  HookHandlers,
  HookName,
  OnAgentEndEvent,
  OnAgentEndResult,
  OnAgentStartEvent,
  OnAgentStartResult,
  OnInteractionEndEvent,
  OnInteractionStartEvent,
  OnInteractionStartResult,
} from './types';

// biome-ignore lint/suspicious/noExplicitAny: Generic handler storage
type AnyHandler = (event: any) => Promise<any> | any;

/**
 * Hook execution engine.
 * Registers handlers and executes them in order, merging results.
 */
export class HookRunner {
  private handlers = new Map<HookName, AnyHandler[]>();

  /**
   * Register a handler for a hook.
   * Handlers run in registration order.
   */
  on<K extends HookName>(hookName: K, handler: HookHandlers[K]): void {
    if (!this.handlers.has(hookName)) {
      this.handlers.set(hookName, []);
    }
    this.handlers.get(hookName)?.push(handler as AnyHandler);
  }

  /**
   * Execute all handlers for a hook.
   * Returns merged results from all handlers.
   */
  async emit(hookName: 'onAgentStart', event: OnAgentStartEvent): Promise<OnAgentStartResult>;
  async emit(
    hookName: 'onInteractionStart',
    event: OnInteractionStartEvent
  ): Promise<OnInteractionStartResult>;
  async emit(
    hookName: 'beforeToolExecute',
    event: BeforeToolExecuteEvent
  ): Promise<BeforeToolExecuteResult>;
  async emit(
    hookName: 'afterToolExecute',
    event: AfterToolExecuteEvent
  ): Promise<AfterToolExecuteResult>;
  async emit(hookName: 'onInteractionEnd', event: OnInteractionEndEvent): Promise<undefined>;
  async emit(hookName: 'onAgentEnd', event: OnAgentEndEvent): Promise<OnAgentEndResult>;
  async emit(
    hookName: HookName,
    event: unknown
  ): Promise<
    | OnAgentStartResult
    | OnInteractionStartResult
    | BeforeToolExecuteResult
    | AfterToolExecuteResult
    | OnAgentEndResult
    | undefined
  > {
    const handlers = this.handlers.get(hookName);
    if (!handlers || handlers.length === 0) {
      // Default results for hooks that require specific structure
      if (hookName === 'beforeToolExecute') {
        return { allow: true };
      }
      return {};
    }

    // Special handling for beforeToolExecute (cancel hook)
    if (hookName === 'beforeToolExecute') {
      let mergedArguments: Record<string, unknown> | undefined;
      for (const handler of handlers) {
        const result = await handler(event);
        if (result && !result.allow) {
          return result; // First block wins
        }
        // Accumulate arguments modifications
        if (result?.arguments) {
          mergedArguments = { ...(mergedArguments ?? {}), ...result.arguments };
        }
      }
      return { allow: true, arguments: mergedArguments };
    }

    // Special handling for onInteractionEnd (observe only)
    if (hookName === 'onInteractionEnd') {
      for (const handler of handlers) {
        await handler(event);
      }
      return;
    }

    // Special handling for onAgentEnd (collect all inputs)
    if (hookName === 'onAgentEnd') {
      const inputs: string[] = [];
      for (const handler of handlers) {
        const result = await handler(event);
        if (result?.input) {
          inputs.push(result.input);
        }
      }
      // Return combined inputs as array joined with newlines
      if (inputs.length > 0) {
        return { input: inputs.join('\n\n') };
      }
      return {};
    }

    // Default: merge results from all handlers
    let mergedResult: Record<string, unknown> = {};
    for (const handler of handlers) {
      const result = await handler(event);
      if (result) {
        mergedResult = { ...mergedResult, ...result };
      }
    }
    return mergedResult;
  }

  /**
   * Check if any handlers are registered for a hook.
   */
  has(hookName: HookName): boolean {
    const handlers = this.handlers.get(hookName);
    return handlers !== undefined && handlers.length > 0;
  }

  /**
   * Remove all handlers for a hook.
   */
  off(hookName: HookName): void {
    this.handlers.delete(hookName);
  }

  /**
   * Remove all handlers for all hooks.
   */
  clear(): void {
    this.handlers.clear();
  }
}
