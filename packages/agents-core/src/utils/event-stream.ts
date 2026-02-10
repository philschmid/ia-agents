/**
 * EventStream - Push-based async event stream
 *
 * Based on pi-ai EventStream:
 * https://raw.githubusercontent.com/badlogic/pi-mono/93c39faa933abe2ec15768cbf014b5f53d17a7d0/packages/ai/src/utils/event-stream.ts
 */

import type { AgentEvent, AgentLoopResult } from '../types';
import { debug } from './debug';

/**
 * Generic event stream for async iteration with push-based event delivery.
 *
 * @template T - Event type
 * @template R - Result type (extracted from final event)
 */
export class EventStream<T, R = T> implements AsyncIterable<T> {
  private queue: T[] = [];
  private waiting: ((value: IteratorResult<T>) => void)[] = [];
  private done = false;
  private finalResultPromise: Promise<R>;
  private resolveFinalResult!: (result: R) => void;

  constructor(
    private isComplete: (event: T) => boolean,
    private extractResult: (event: T) => R
  ) {
    this.finalResultPromise = new Promise((resolve) => {
      this.resolveFinalResult = resolve;
    });
  }

  /**
   * Push an event to the stream.
   * Events are either delivered to waiting consumers or queued.
   */
  push(event: T): void {
    if (this.done) return;

    // Just mark as done, but don't resolve result here
    // The result should be resolved by end() with the correct value
    if (this.isComplete(event)) {
      this.done = true;
    }

    // Deliver to waiting consumer or queue it
    const waiter = this.waiting.shift();
    if (waiter) {
      waiter({ value: event, done: false });
    } else {
      this.queue.push(event);
    }
  }

  /**
   * End the stream with an optional result.
   */
  end(result?: R): void {
    this.done = true;
    if (result !== undefined) {
      this.resolveFinalResult(result);
    }
    // Notify all waiting consumers that we're done
    while (this.waiting.length > 0) {
      const waiter = this.waiting.shift();
      if (waiter) {
        waiter({ value: undefined as unknown as T, done: true });
      }
    }
  }

  /**
   * Async iterator for consuming events.
   */
  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    while (true) {
      if (this.queue.length > 0) {
        const event = this.queue.shift();
        if (event !== undefined) {
          yield event;
        }
      } else if (this.done) {
        return;
      } else {
        const result = await new Promise<IteratorResult<T>>((resolve) =>
          this.waiting.push(resolve)
        );
        if (result.done) return;
        yield result.value;
      }
    }
  }

  /**
   * Get the final result (resolves when stream completes).
   */
  result(): Promise<R> {
    return this.finalResultPromise;
  }
}

/** Agent event stream type */
export type AgentEventStream = EventStream<AgentEvent, AgentLoopResult>;

/**
 * Create an agent event stream.
 */
export function createAgentEventStream(): AgentEventStream {
  return new EventStream<AgentEvent, AgentLoopResult>(
    (event) => event.type === 'agent.end',
    (event) => {
      if (event.type === 'agent.end') {
        return {
          interactions: event.interactions,
          interactionId: event.interactionId,
          usage: event.usage,
        };
      }
      // This shouldn't happen in normal operation
      debug('event-stream', `extractResult called with unexpected event type: ${event.type}`);
      return { interactions: [], interactionId: '', usage: {} };
    }
  );
}
