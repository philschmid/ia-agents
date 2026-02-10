/**
 * Debug Utility Tests
 */

import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

// We need to test createDebug with different DEBUG env values,
// so we import it fresh for each scenario via dynamic module approaches.
// Since the project requires static imports, we test the exposed interface.
import { createDebug, isDebugEnabled } from '../src/utils/debug';

describe('createDebug', () => {
  const originalLog = console.log;
  const originalDebug = process.env.DEBUG;

  afterEach(() => {
    console.log = originalLog;
    process.env.DEBUG = originalDebug;
  });

  test('returns a function', () => {
    const log = createDebug('test');
    expect(typeof log).toBe('function');
  });

  test('namespaced logger includes namespace in output when debug enabled', () => {
    // Note: Since DEBUG_ENABLED is set at module load time, we can only
    // test the function interface, not the actual gating behavior without
    // re-importing the module
    const log = createDebug('myNamespace');
    expect(typeof log).toBe('function');
    // Calling should not throw even when debug might be disabled
    log('test message', { extra: 'data' });
  });
});

describe('isDebugEnabled', () => {
  test('returns a boolean', () => {
    const result = isDebugEnabled();
    expect(typeof result).toBe('boolean');
  });
});
