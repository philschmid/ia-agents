/**
 * Config Tests
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { CoreConfigSchema, loadConfig } from '../src/config';

describe('loadConfig', () => {
  const testSettingsPath = '/tmp/test-settings.json';

  // Save original env vars
  let originalDefaultModel: string | undefined;
  let originalMaxIterations: string | undefined;
  let originalSettingsPath: string | undefined;

  beforeEach(() => {
    originalDefaultModel = process.env.AGENT_DEFAULT_MODEL;
    originalMaxIterations = process.env.AGENT_MAX_ITERATIONS;
    originalSettingsPath = process.env.AGENT_SETTINGS_PATH;
    process.env.AGENT_DEFAULT_MODEL = undefined;
    process.env.AGENT_MAX_ITERATIONS = undefined;
    process.env.AGENT_SETTINGS_PATH = undefined;
  });

  afterEach(() => {
    // Clean up test file
    if (existsSync(testSettingsPath)) {
      unlinkSync(testSettingsPath);
    }
    // Restore original env vars
    process.env.AGENT_DEFAULT_MODEL = originalDefaultModel;
    process.env.AGENT_MAX_ITERATIONS = originalMaxIterations;
    process.env.AGENT_SETTINGS_PATH = originalSettingsPath;
  });

  test('returns defaults when no config sources exist', () => {
    const config = loadConfig(CoreConfigSchema, '/nonexistent/path.json');
    expect(config.defaultModel).toBe('gemini-3-flash-preview');
    expect(config.maxIterations).toBe(100);
  });

  test('loads from settings.json', () => {
    writeFileSync(
      testSettingsPath,
      JSON.stringify({
        defaultModel: 'json-model',
        maxIterations: 25,
      })
    );

    const config = loadConfig(CoreConfigSchema, testSettingsPath);
    expect(config.defaultModel).toBe('json-model');
    expect(config.maxIterations).toBe(25);
  });

  test('env vars override settings.json', () => {
    writeFileSync(
      testSettingsPath,
      JSON.stringify({
        defaultModel: 'json-model',
        maxIterations: 25,
      })
    );

    process.env.AGENT_DEFAULT_MODEL = 'env-model';
    process.env.AGENT_MAX_ITERATIONS = '100';

    const config = loadConfig(CoreConfigSchema, testSettingsPath);
    expect(config.defaultModel).toBe('env-model');
    expect(config.maxIterations).toBe(100);
  });

  test('uses AGENT_SETTINGS_PATH env var', () => {
    writeFileSync(
      testSettingsPath,
      JSON.stringify({
        defaultModel: 'path-env-model',
      })
    );

    process.env.AGENT_SETTINGS_PATH = testSettingsPath;

    const config = loadConfig(CoreConfigSchema);
    expect(config.defaultModel).toBe('path-env-model');
  });

  test('handles malformed JSON gracefully', () => {
    writeFileSync(testSettingsPath, 'not valid json');

    const config = loadConfig(CoreConfigSchema, testSettingsPath);
    expect(config.defaultModel).toBe('gemini-3-flash-preview');
  });

  test('partial env vars work', () => {
    process.env.AGENT_DEFAULT_MODEL = 'only-model';

    const config = loadConfig(CoreConfigSchema, '/nonexistent/path.json');
    expect(config.defaultModel).toBe('only-model');
    expect(config.maxIterations).toBe(100);
  });
});
