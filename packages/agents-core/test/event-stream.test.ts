/**
 * EventStream Unit Tests
 */

import { describe, expect, it } from 'bun:test';
import { EventStream } from '../src/utils/event-stream';

describe('EventStream', () => {
  it('should push events and iterate', async () => {
    const stream = new EventStream<{ type: string; value: number }, number>(
      (event) => event.type === 'end',
      (event) => event.value
    );

    // Push events
    stream.push({ type: 'data', value: 1 });
    stream.push({ type: 'data', value: 2 });
    stream.push({ type: 'end', value: 3 });

    const events: { type: string; value: number }[] = [];
    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({ type: 'data', value: 1 });
    expect(events[1]).toEqual({ type: 'data', value: 2 });
    expect(events[2]).toEqual({ type: 'end', value: 3 });
  });

  it('should resolve result() when end() is called with result', async () => {
    const stream = new EventStream<{ type: string; value: number }, number>(
      (event) => event.type === 'end',
      (event) => event.value
    );

    stream.push({ type: 'data', value: 1 });
    stream.push({ type: 'end', value: 42 });
    stream.end(42); // Result is resolved by end(), not push()

    const result = await stream.result();
    expect(result).toBe(42);
  });

  it('should queue events when no consumer is waiting', async () => {
    const stream = new EventStream<{ type: string }, void>(
      (event) => event.type === 'end',
      () => undefined
    );

    // Push before consuming
    stream.push({ type: 'a' });
    stream.push({ type: 'b' });
    stream.push({ type: 'end' });

    const events: { type: string }[] = [];
    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toHaveLength(3);
    expect(events.map((e) => e.type)).toEqual(['a', 'b', 'end']);
  });

  it('should terminate iteration with end()', async () => {
    const stream = new EventStream<{ type: string }, string>(
      () => false, // Never complete via push
      () => ''
    );

    stream.push({ type: 'a' });
    stream.end('final');

    const events: { type: string }[] = [];
    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    const result = await stream.result();
    expect(result).toBe('final');
  });

  it('should ignore events pushed after done', async () => {
    const stream = new EventStream<{ type: string; value: number }, number>(
      (event) => event.type === 'end',
      (event) => event.value
    );

    stream.push({ type: 'end', value: 1 });
    stream.push({ type: 'data', value: 2 }); // Should be ignored

    const events: { type: string; value: number }[] = [];
    for await (const event of stream) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('end');
  });

  it('should deliver events to waiting consumers immediately', async () => {
    const stream = new EventStream<{ type: string }, void>(
      (event) => event.type === 'end',
      () => undefined
    );

    // Start consuming before pushing
    const iteratorPromise = (async () => {
      const events: { type: string }[] = [];
      for await (const event of stream) {
        events.push(event);
      }
      return events;
    })();

    // Push async
    await Promise.resolve();
    stream.push({ type: 'a' });
    stream.push({ type: 'end' });

    const events = await iteratorPromise;
    expect(events).toHaveLength(2);
  });
});
