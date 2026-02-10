/**
 * Agent Config Tests
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync, unlinkSync, writeFileSync } from 'node:fs';

describe('loadAgentConfig', () => {
  const testSettingsPath = '/tmp/test-agent-settings.json';

  // Save original env vars
  let originalDefaultTools: string | undefined;
  let originalSettingsPath: string | undefined;

  beforeEach(() => {
    originalDefaultTools = process.env.AGENT_DEFAULT_TOOLS;
    originalSettingsPath = process.env.AGENT_SETTINGS_PATH;
    process.env.AGENT_DEFAULT_TOOLS = undefined;
    process.env.AGENT_SETTINGS_PATH = undefined;
  });

  afterEach(() => {
    // Clean up test file
    if (existsSync(testSettingsPath)) {
      unlinkSync(testSettingsPath);
    }
    // Restore original env vars
    process.env.AGENT_DEFAULT_TOOLS = originalDefaultTools;
    process.env.AGENT_SETTINGS_PATH = originalSettingsPath;
  });

  test('defaults to all tools when no config', async () => {
    // Re-import to get fresh config
    const { loadAgentConfig } = await import('../src/config');
    const config = loadAgentConfig('/nonexistent/path.json');

    expect(config.defaultTools).toContain('read');
    expect(config.defaultTools).toContain('write');
    expect(config.defaultTools).toContain('bash');
    expect(config.defaultTools).toContain('grep');
    expect(config.defaultTools.length).toBeGreaterThan(5);
  });

  test('loads defaultTools from settings.json', async () => {
    writeFileSync(
      testSettingsPath,
      JSON.stringify({
        defaultTools: ['read', 'write'],
      })
    );

    const { loadAgentConfig } = await import('../src/config');
    const config = loadAgentConfig(testSettingsPath);

    expect(config.defaultTools).toEqual(['read', 'write']);
  });

  test('env var overrides settings.json with comma-separated list', async () => {
    writeFileSync(
      testSettingsPath,
      JSON.stringify({
        defaultTools: ['read', 'write', 'bash'],
      })
    );

    process.env.AGENT_DEFAULT_TOOLS = 'grep,list';

    const { loadAgentConfig } = await import('../src/config');
    const config = loadAgentConfig(testSettingsPath);

    expect(config.defaultTools).toEqual(['grep', 'list']);
  });

  test('trims whitespace from env var tool names', async () => {
    process.env.AGENT_DEFAULT_TOOLS = ' read , write , bash ';

    const { loadAgentConfig } = await import('../src/config');
    const config = loadAgentConfig('/nonexistent/path.json');

    expect(config.defaultTools).toEqual(['read', 'write', 'bash']);
  });

  test('inherits core config defaults', async () => {
    const { loadAgentConfig } = await import('../src/config');
    const config = loadAgentConfig('/nonexistent/path.json');

    expect(config.defaultModel).toBe('gemini-3-flash-preview');
    expect(config.maxIterations).toBe(100);
  });
});
