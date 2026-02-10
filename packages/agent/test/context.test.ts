/**
 * Tests for AgentContext
 */

import { describe, expect, test } from 'bun:test';
import { AgentContext } from '../src/context';

describe('AgentContext', () => {
  describe('cwd property', () => {
    test('returns process.cwd() when not in context', () => {
      expect(AgentContext.cwd).toBe(process.cwd());
    });

    test('returns context cwd when inside run()', () => {
      AgentContext.run({ cwd: '/custom/path' }, () => {
        expect(AgentContext.cwd).toBe('/custom/path');
      });
    });

    test('restores original after run completes', () => {
      AgentContext.run({ cwd: '/temp' }, () => {
        expect(AgentContext.cwd).toBe('/temp');
      });
      expect(AgentContext.cwd).toBe(process.cwd());
    });
  });

  describe('run method', () => {
    test('returns function result', () => {
      const result = AgentContext.run({ cwd: '/test' }, () => 42);
      expect(result).toBe(42);
    });

    test('supports nested contexts', () => {
      AgentContext.run({ cwd: '/outer' }, () => {
        expect(AgentContext.cwd).toBe('/outer');
        AgentContext.run({ cwd: '/inner' }, () => {
          expect(AgentContext.cwd).toBe('/inner');
        });
        expect(AgentContext.cwd).toBe('/outer');
      });
    });
  });

  describe('runGenerator method', () => {
    test('maintains context across yields', async () => {
      const cwds: string[] = [];

      async function* generator() {
        cwds.push(AgentContext.cwd);
        yield 1;
        cwds.push(AgentContext.cwd);
        yield 2;
        cwds.push(AgentContext.cwd);
        return 'done';
      }

      const results: number[] = [];
      for await (const value of AgentContext.runGenerator({ cwd: '/project' }, generator())) {
        results.push(value);
      }

      expect(results).toEqual([1, 2]);
      expect(cwds).toEqual(['/project', '/project', '/project']);
    });

    test('isolates concurrent generators', async () => {
      const results: string[] = [];

      async function* makeGenerator(id: string, cwd: string) {
        for (let i = 0; i < 3; i++) {
          await new Promise((r) => setTimeout(r, 5));
          results.push(`${id}:${AgentContext.cwd}`);
          yield i;
        }
      }

      await Promise.all([
        (async () => {
          for await (const _ of AgentContext.runGenerator(
            { cwd: '/a' },
            makeGenerator('A', '/a')
          )) {
            // consume
          }
        })(),
        (async () => {
          for await (const _ of AgentContext.runGenerator(
            { cwd: '/b' },
            makeGenerator('B', '/b')
          )) {
            // consume
          }
        })(),
      ]);

      // Each generator should only see its own cwd
      const aResults = results.filter((r) => r.startsWith('A:'));
      const bResults = results.filter((r) => r.startsWith('B:'));

      expect(aResults.every((r) => r === 'A:/a')).toBe(true);
      expect(bResults.every((r) => r === 'B:/b')).toBe(true);
    });
  });
});
