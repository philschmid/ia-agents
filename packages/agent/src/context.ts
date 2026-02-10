/**
 * Agent Context
 *
 * Provides scoped context for agent sessions using AsyncLocalStorage.
 * Tools can access session-level configuration (like cwd) without explicit argument passing.
 */

import { AsyncLocalStorage } from 'node:async_hooks';

type SessionContext = {
  /** Working directory for file operations */
  cwd: string;
};

const storage = new AsyncLocalStorage<SessionContext>();

/**
 * Agent context for accessing session-scoped configuration.
 *
 * @example
 * ```typescript
 * // In session - wrap execution in context
 * for await (const event of AgentContext.runGenerator({ cwd: '/project' }, gen)) {
 *   // tools executed here see AgentContext.cwd === '/project'
 * }
 *
 * // In tools - access context directly
 * const targetDir = AgentContext.cwd;
 * ```
 */
export const AgentContext = {
  /**
   * Get current working directory.
   * Returns process.cwd() when not in a session context (standalone tool usage).
   */
  get cwd(): string {
    const ctx = storage.getStore();
    if (!ctx) return process.cwd();
    return ctx.cwd;
  },

  /**
   * Run a function within a session context scope.
   * All code executed within `fn` (including async operations) will see this context.
   */
  run<T>(context: SessionContext, fn: () => T): T {
    return storage.run(context, fn);
  },

  /**
   * Wrap an async generator to maintain context across all yields.
   * Each iteration runs within the provided context.
   */
  async *runGenerator<T, TReturn>(
    context: SessionContext,
    generator: AsyncGenerator<T, TReturn, unknown>
  ): AsyncGenerator<T, TReturn, unknown> {
    while (true) {
      const result = await storage.run(context, () => generator.next());
      if (result.done) {
        return result.value;
      }
      yield result.value;
    }
  },
};
