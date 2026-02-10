/**
 * Tool Tests
 *
 * Tests for migrated tools from deep-agents.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// Import tools directly from their modules to avoid circular dependency via config.ts
import { applyPatchTool } from '../src/tools/apply-patch';
import { bashTool } from '../src/tools/bash';
import { grepTool } from '../src/tools/grep';
import { listDirectoryTool } from '../src/tools/list-directory';
import { updatePlanTool } from '../src/tools/planning';
import { readFileTool } from '../src/tools/read-file';
import { sleepTool } from '../src/tools/sleep';

// These must be imported from tools/index.ts since they use getTools helper
import { getTools } from '../src/tools';

import { buildToolSystemInstruction } from '../src/prompts';
// Import skill/subagent tools directly from their modules
import { createSkillSystemInstruction, createSkillTool } from '../src/tools/skills';
import { createSubagentSystemInstruction, createSubagentTool } from '../src/tools/subagent';

// ============================================================================
// Sleep Tool Tests
// ============================================================================

describe('sleepTool', () => {
  test('has correct metadata', () => {
    expect(sleepTool.name).toBe('sleep');
    expect(sleepTool.description).toContain('Pause execution');
    expect(sleepTool.label).toBe('Sleep');
  });

  test('sleeps for specified duration', async () => {
    const startTime = Date.now();
    const result = await sleepTool.execute('test-1', { duration_ms: 50 });
    const elapsed = Date.now() - startTime;

    expect(result.result).toBe('Slept for 50ms.');
    expect(elapsed).toBeGreaterThanOrEqual(45);
  });

  test('handles zero duration', async () => {
    const result = await sleepTool.execute('test-2', { duration_ms: 0 });
    expect(result.result).toBe('Slept for 0ms.');
  });
});

// ============================================================================
// Update Plan Tool Tests
// ============================================================================

describe('updatePlanTool', () => {
  test('has correct metadata', () => {
    expect(updatePlanTool.name).toBe('update_plan');
    expect(updatePlanTool.description).toContain('plan');
  });

  test('accepts valid plan', async () => {
    const result = await updatePlanTool.execute('test-1', {
      plan: [
        { step: 'Research API', status: 'completed' },
        { step: 'Implement changes', status: 'in_progress' },
        { step: 'Test implementation', status: 'pending' },
      ],
    });

    expect(result.result).toContain('Plan updated');
    expect(result.isError).toBeFalsy();
  });

  test('warns about multiple in_progress steps', async () => {
    const result = await updatePlanTool.execute('test-2', {
      plan: [
        { step: 'Step 1', status: 'in_progress' },
        { step: 'Step 2', status: 'in_progress' },
      ],
    });

    expect(result.result).toContain('more than one step is in progress');
  });
});

// ============================================================================
// File Tool Tests
// ============================================================================

describe('File Tools', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'file-tool-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('readFileTool', () => {
    test('reads file with line numbers', async () => {
      const filePath = path.join(tempDir, 'test.txt');
      await fs.writeFile(filePath, 'line 1\nline 2\nline 3');

      const result = await readFileTool.execute('test-1', { filePath });

      expect(result.result).toContain('line 1');
      expect(result.result).toContain('line 2');
      expect(result.result).toContain('line 3');
    });

    test('respects offset and limit', async () => {
      const filePath = path.join(tempDir, 'test.txt');
      await fs.writeFile(filePath, 'line 1\nline 2\nline 3\nline 4');

      const result = await readFileTool.execute('test-2', {
        filePath,
        offset: 1,
        limit: 2,
      });

      expect(result.result).toContain('line 2');
      expect(result.result).toContain('line 3');
    });

    test('handles missing file', async () => {
      const result = await readFileTool.execute('test-3', {
        filePath: path.join(tempDir, 'nonexistent.txt'),
      });

      expect(result.isError).toBe(true);
      expect(result.result).toContain('Error');
    });
  });

  describe('listDirectoryTool', () => {
    test('lists directory contents', async () => {
      await fs.writeFile(path.join(tempDir, 'file1.txt'), 'content');
      await fs.writeFile(path.join(tempDir, 'file2.js'), 'content');
      await fs.mkdir(path.join(tempDir, 'subdir'));

      const result = await listDirectoryTool.execute('test-1', { path: tempDir });

      // listDirectoryTool only lists files, not directories
      expect(result.result).toContain('file1.txt');
      expect(result.result).toContain('file2.js');
    });
  });
});

// ============================================================================
// Grep Tool Tests
// ============================================================================

describe('grepTool', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'grep-tool-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('finds matching content', async () => {
    const filePath = path.join(tempDir, 'test.txt');
    await fs.writeFile(filePath, 'line 1\nTARGET found\nline 3');

    const result = await grepTool.execute('test-1', {
      pattern: 'TARGET',
      path: tempDir,
    });

    expect(result.result).toContain('TARGET');
  });
});

// ============================================================================
// Bash Tool Tests
// ============================================================================

describe('bashTool', () => {
  test('has correct metadata', () => {
    expect(bashTool.name).toBe('bash');
    expect(bashTool.description).toContain('command');
  });

  test('executes simple command', async () => {
    const result = await bashTool.execute('test-1', { command: 'echo "hello world"' });

    expect(result.result).toContain('hello world');
  });

  test('captures stderr', async () => {
    const result = await bashTool.execute('test-2', { command: 'echo "error" >&2' });

    expect(result.result).toContain('error');
  });

  test('handles command failure', async () => {
    const result = await bashTool.execute('test-3', { command: 'exit 1' });

    expect(result.isError).toBe(true);
  });
});

// ============================================================================
// Apply Patch Tool Tests
// ============================================================================

describe('applyPatchTool', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'patch-tool-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('has correct metadata', () => {
    expect(applyPatchTool.name).toBe('apply_patch');
    expect(applyPatchTool.description).toContain('patch');
  });

  // Note: applyPatchTool requires relative paths and uses 'input' as the parameter name.
  // Full integration testing requires a controlled cwd context which is complex to set up.
  // These tests verify the tool is properly configured.
  test('handles patch with missing header', async () => {
    const result = await applyPatchTool.execute('test-1', { input: 'invalid patch content' });

    // For invalid patches without *** Begin Patch, the tool returns a result
    expect(result.result).toBeDefined();
    expect(typeof result.result).toBe('string');
  });
});

// ============================================================================
// Patch Parser Unit Tests (edge cases from agent failures)
// ============================================================================

import { parsePatch } from '../src/tools/apply-patch/patch';

describe('parsePatch edge cases', () => {
  test('parses simple add file patch', () => {
    const patch = `*** Begin Patch
*** Add File: test.txt
+Hello
*** End Patch`;

    const result = parsePatch(patch);

    expect(result.hunks).toHaveLength(1);
    expect(result.hunks[0].type).toBe('AddFile');
    if (result.hunks[0].type === 'AddFile') {
      expect(result.hunks[0].path).toBe('test.txt');
      expect(result.hunks[0].contents).toBe('Hello\n');
    }
  });

  test('parses patch with trailing whitespace on end marker', () => {
    const patch = `*** Begin Patch
*** Add File: test.txt
+Hello
*** End Patch   `;

    const result = parsePatch(patch);

    expect(result.hunks).toHaveLength(1);
    expect(result.hunks[0].type).toBe('AddFile');
  });

  test('parses patch with trailing newlines', () => {
    const patch = `*** Begin Patch
*** Add File: test.txt
+Hello
*** End Patch

`;

    const result = parsePatch(patch);

    expect(result.hunks).toHaveLength(1);
    expect(result.hunks[0].type).toBe('AddFile');
  });

  test('parses patch with leading whitespace on begin marker', () => {
    const patch = `  *** Begin Patch
*** Add File: test.txt
+Hello
*** End Patch`;

    const result = parsePatch(patch);

    expect(result.hunks).toHaveLength(1);
    expect(result.hunks[0].type).toBe('AddFile');
  });

  test('parses multi-line add file patch', () => {
    const patch = `*** Begin Patch
*** Add File: readme.md
+# Title
+
+Some content here.
+
+## Section
+
+More content.
*** End Patch`;

    const result = parsePatch(patch);

    expect(result.hunks).toHaveLength(1);
    if (result.hunks[0].type === 'AddFile') {
      expect(result.hunks[0].contents).toContain('# Title');
      expect(result.hunks[0].contents).toContain('## Section');
    }
  });

  test('parses patch with code blocks in content', () => {
    const patch = `*** Begin Patch
*** Add File: example.md
+# Example
+
+\`\`\`typescript
+const x = 1;
+\`\`\`
*** End Patch`;

    const result = parsePatch(patch);

    expect(result.hunks).toHaveLength(1);
    if (result.hunks[0].type === 'AddFile') {
      expect(result.hunks[0].contents).toContain('```typescript');
      expect(result.hunks[0].contents).toContain('const x = 1;');
    }
  });

  test('parses multiple file operations', () => {
    const patch = `*** Begin Patch
*** Add File: new.txt
+New file content
*** Delete File: old.txt
*** End Patch`;

    const result = parsePatch(patch);

    expect(result.hunks).toHaveLength(2);
    expect(result.hunks[0].type).toBe('AddFile');
    expect(result.hunks[1].type).toBe('DeleteFile');
  });

  test('parses update file with context', () => {
    const patch = `*** Begin Patch
*** Update File: app.ts
@@
 const x = 1;
-const y = 2;
+const y = 3;
 const z = 4;
*** End Patch`;

    const result = parsePatch(patch);

    expect(result.hunks).toHaveLength(1);
    expect(result.hunks[0].type).toBe('UpdateFile');
  });

  test('handles model mistake: end marker prefixed with +', () => {
    // This is a common model mistake where the agent treats *** End Patch as content
    const patch = `*** Begin Patch
*** Add File: test.md
+# Hello
+Some content
+*** End Patch
+`;

    const result = parsePatch(patch);

    expect(result.hunks).toHaveLength(1);
    expect(result.hunks[0].type).toBe('AddFile');
    if (result.hunks[0].type === 'AddFile') {
      expect(result.hunks[0].contents).toContain('# Hello');
      expect(result.hunks[0].contents).toContain('Some content');
      // The +*** End Patch should NOT be in content
      expect(result.hunks[0].contents).not.toContain('End Patch');
    }
  });

  test('handles trailing garbage after end marker', () => {
    const patch = `*** Begin Patch
*** Add File: test.txt
+Hello
+*** End Patch
+
+`;

    const result = parsePatch(patch);

    expect(result.hunks).toHaveLength(1);
    expect(result.hunks[0].type).toBe('AddFile');
  });
});

// ============================================================================
// getTools Tests
// ============================================================================

describe('getTools', () => {
  test('returns tools by name', () => {
    const tools = getTools(['read', 'write']);

    // 'read' expands to read_file + list_directory
    // 'write' expands to write_file + apply_patch
    expect(tools).toHaveLength(4);
    expect(tools[0].name).toBe('read_file');
    expect(tools[1].name).toBe('list_directory');
    expect(tools[2].name).toBe('write_file');
    expect(tools[3].name).toBe('apply_patch');
  });

  test('returns all available tools', () => {
    // Get all core tool names (list is merged into read)
    const allNames = [
      'sleep',
      'plan',
      'read',
      'write',
      'grep',
      'bash',
      'web_fetch',
      'web_search',
    ] as const;
    const tools = getTools([...allNames]);

    // 'read' expands to 2 tools, 'write' expands to 2 tools
    // So total is allNames.length + 2
    expect(tools).toHaveLength(allNames.length + 2);
  });

  test('throws for unknown tool', () => {
    expect(() => getTools(['unknown' as 'sleep'])).toThrow('Unknown tool');
  });

  test('preserves order of requested tools', () => {
    const tools = getTools(['bash', 'read']);

    expect(tools[0].name).toBe('bash');
    expect(tools[1].name).toBe('read_file');
    expect(tools[2].name).toBe('list_directory');
  });
});

// ============================================================================
// Skill Tool Tests
// ============================================================================

describe('createSkillTool', () => {
  test('returns an AgentTool with correct name for empty skills', () => {
    const tool = createSkillTool([]);

    expect(tool.name).toBe('skills');
    expect(tool.description).toContain('No skills are currently available');
  });

  test('includes skill names in description when skills exist', () => {
    const skills = [
      { name: 'test-skill', description: 'A test skill', content: 'content', path: '/p' },
    ];
    const tool = createSkillTool(skills);

    expect(tool.name).toBe('skills');
    expect(tool.description).toContain('Available skills');
  });

  test('accepts multiple skills', () => {
    const skills = [
      { name: 'skill1', description: 'Skill 1', content: 'Content 1', path: '/path/1' },
      { name: 'skill2', description: 'Skill 2', content: 'Content 2', path: '/path/2' },
    ];

    const tool = createSkillTool(skills);

    expect(tool.name).toBe('skills');
    expect(tool.description).toContain('skill');
  });

  test('execute returns skill content', async () => {
    const skills = [
      {
        name: 'my-skill',
        description: 'My skill',
        content: 'This is the skill content',
        path: '/p',
      },
    ];
    const tool = createSkillTool(skills);

    const result = await tool.execute('test-id', { name: 'my-skill' });

    expect(result.result).toBe('This is the skill content');
    expect(result.isError).toBe(false);
  });

  test('execute returns error for unknown skill', async () => {
    const skills = [{ name: 'my-skill', description: 'My skill', content: 'content', path: '/p' }];
    const tool = createSkillTool(skills);

    const result = await tool.execute('test-id', { name: 'unknown' });

    expect(result.isError).toBe(true);
    expect(result.result).toContain('Unknown skill');
  });
});

// ============================================================================
// Subagent Tool Tests
// ============================================================================

describe('createSubagentTool', () => {
  test('returns an AgentTool with correct name for empty subagents', () => {
    const tool = createSubagentTool([]);

    expect(tool.name).toBe('delegate_to_subagent');
    // Empty array still creates a description
    expect(tool.description).toContain('Delegate a task');
  });

  test('includes subagent names in description when subagents exist', () => {
    const subagents = [{ name: 'test-agent', description: 'A test subagent', content: 'content' }];
    const tool = createSubagentTool(subagents);

    expect(tool.name).toBe('delegate_to_subagent');
    expect(tool.description).toContain('test-agent');
  });

  test('accepts multiple subagents', () => {
    const subagents = [
      { name: 'agent1', description: 'Agent 1', content: 'SI 1' },
      { name: 'agent2', description: 'Agent 2', content: 'SI 2', tools: ['read', 'write'] },
    ];

    const tool = createSubagentTool(subagents);

    expect(tool.name).toBe('delegate_to_subagent');
    expect(tool.description).toContain('agent1');
    expect(tool.description).toContain('agent2');
  });

  test('throws error for reserved name delegate_to_subagent', () => {
    const subagents = [{ name: 'delegate_to_subagent', description: 'Bad name', content: 'SI' }];

    expect(() => createSubagentTool(subagents)).toThrow('reserved');
  });
});

// ============================================================================
// System Instruction Builder Tests
// ============================================================================

describe('createSkillSystemInstruction', () => {
  test('returns instruction with empty list for no skills', () => {
    const result = createSkillSystemInstruction([]);

    // Now always returns the full template
    expect(result).toContain('<skills>');
    expect(result).toContain('</skills>');
  });

  test('returns system instruction when skills provided', () => {
    const skills = [
      { name: 'test-skill', description: 'A test skill for testing', content: 'c', path: '/p' },
    ];
    const result = createSkillSystemInstruction(skills);

    expect(result).toContain('<skills>');
    expect(result).toContain('test-skill');
    expect(result).toContain('A test skill for testing');
    expect(result).toContain('</skills>');
  });

  test('formats skill list correctly', () => {
    const skills = [
      { name: 'my-skill', description: 'My skill desc', content: 'content', path: '/p' },
    ];

    const result = createSkillSystemInstruction(skills);

    expect(result).toContain('my-skill');
    expect(result).toContain('My skill desc');
  });
});

describe('createSubagentSystemInstruction', () => {
  test('returns instruction with empty list for no subagents', () => {
    const result = createSubagentSystemInstruction([]);

    // Now always returns the full template
    expect(result).toContain('<subagents>');
    expect(result).toContain('</subagents>');
  });

  test('returns system instruction when subagents provided', () => {
    const subagents = [{ name: 'helper', description: 'A helper subagent', content: 'SI' }];
    const result = createSubagentSystemInstruction(subagents);

    expect(result).toContain('<subagents>');
    expect(result).toContain('helper');
    expect(result).toContain('A helper subagent');
    expect(result).toContain('</subagents>');
  });

  test('formats subagent list correctly', () => {
    const subagents = [{ name: 'my-agent', description: 'My agent desc', content: 'SI' }];

    const result = createSubagentSystemInstruction(subagents);

    expect(result).toContain('my-agent');
    expect(result).toContain('My agent desc');
  });
});

// ============================================================================
// buildToolSystemInstruction Tests
// ============================================================================

describe('buildToolSystemInstruction', () => {
  test('returns initial instruction when no special tools present', () => {
    const tools = [sleepTool, readFileTool, bashTool];

    const result = buildToolSystemInstruction('Base instruction.', tools);

    expect(result).toBe('Base instruction.');
  });

  test('includes skills section when skills tool present', () => {
    const tools = [...getTools(['skills']), sleepTool];

    const result = buildToolSystemInstruction('Base.', tools);

    // Should contain skills section
    expect(result).toContain('<skills>');
    expect(result).toContain('</skills>');
  });

  test('includes subagents section when subagent tool present', () => {
    const tools = [...getTools(['subagent']), sleepTool];

    const result = buildToolSystemInstruction('Base.', tools);

    // Should contain subagents section
    expect(result).toContain('<subagents>');
    expect(result).toContain('</subagents>');
  });

  test('combines sections when both tools present', () => {
    const tools = [...getTools(['skills', 'subagent']), sleepTool];

    const result = buildToolSystemInstruction('Base.', tools);

    expect(result).toContain('<skills>');
    expect(result).toContain('<subagents>');
  });
});
