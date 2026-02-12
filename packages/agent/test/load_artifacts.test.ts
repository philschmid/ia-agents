/**
 * Load Artifacts Tests
 *
 * Tests for loading skills and subagents from disk with various edge cases.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import {
  type ArtifactLayer,
  SkillMetadataSchema,
  getDefaultLayers,
  loadArtifact,
  loadSkills,
  loadSubagents,
  parseArtifact,
} from '../src/load_artifacts';

// Test fixtures directory
const testDir = join(tmpdir(), `load-artifacts-test-${Date.now()}`);

beforeEach(() => {
  mkdirSync(testDir, { recursive: true });
});

afterEach(() => {
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true });
  }
});

// ============================================================================
// parseArtifact tests
// ============================================================================

describe('parseArtifact', () => {
  test('parses frontmatter and content', () => {
    const filePath = join(testDir, 'test.md');
    writeFileSync(
      filePath,
      `---
name: test-skill
description: A test skill
---

This is the body content.

With multiple lines.`
    );

    const { frontmatter, content } = parseArtifact(filePath);

    expect(frontmatter.name).toBe('test-skill');
    expect(frontmatter.description).toBe('A test skill');
    expect(content).toBe('This is the body content.\n\nWith multiple lines.');
  });

  test('handles empty content', () => {
    const filePath = join(testDir, 'empty-content.md');
    writeFileSync(
      filePath,
      `---
name: empty
description: No content
---`
    );

    const { frontmatter, content } = parseArtifact(filePath);

    expect(frontmatter.name).toBe('empty');
    expect(content).toBe('');
  });

  test('handles extra frontmatter fields', () => {
    const filePath = join(testDir, 'extra.md');
    writeFileSync(
      filePath,
      `---
name: extra
description: Extra fields
tools:
  - read
  - write
model: gemini-2.5-pro
---
Content here.`
    );

    const { frontmatter, content } = parseArtifact(filePath);

    expect(frontmatter.name).toBe('extra');
    expect(frontmatter.tools).toEqual(['read', 'write']);
    expect(frontmatter.model).toBe('gemini-2.5-pro');
  });
});

// ============================================================================
// loadArtifact generic tests
// ============================================================================

describe('loadArtifact', () => {
  test('returns null for non-existent file', () => {
    const result = loadArtifact(join(testDir, 'does-not-exist.md'), SkillMetadataSchema);
    expect(result).toBeNull();
  });

  test('returns null for invalid schema', () => {
    const filePath = join(testDir, 'invalid.md');
    writeFileSync(filePath, '---\ninvalid: true\n---\nNo name or description.');

    const result = loadArtifact(filePath, SkillMetadataSchema);
    expect(result).toBeNull();
  });

  test('returns typed result for valid file', () => {
    const filePath = join(testDir, 'valid.md');
    writeFileSync(
      filePath,
      `---
name: valid-skill
description: Valid skill description
---
Skill instructions here.`
    );

    const result = loadArtifact(filePath, SkillMetadataSchema);

    expect(result).not.toBeNull();
    expect(result?.name).toBe('valid-skill');
    expect(result?.description).toBe('Valid skill description');
    expect(result?.content).toBe('Skill instructions here.');
    expect(result?.path).toBe(filePath);
  });
});

// ============================================================================
// loadSkills tests (single layer)
// ============================================================================

describe('loadSkills', () => {
  test('discovers multiple skills in directory', () => {
    const skillsDir = join(testDir, 'skills');
    mkdirSync(skillsDir);

    // Create two skills
    const skill1Dir = join(skillsDir, 'skill-one');
    mkdirSync(skill1Dir);
    writeFileSync(
      join(skill1Dir, 'SKILL.md'),
      `---
name: skill-one
description: First skill
---
Instructions for skill one.`
    );

    const skill2Dir = join(skillsDir, 'skill-two');
    mkdirSync(skill2Dir);
    writeFileSync(
      join(skill2Dir, 'SKILL.md'),
      `---
name: skill-two
description: Second skill
---
Instructions for skill two.`
    );

    const layers: ArtifactLayer[] = [{ path: testDir, source: 'project' }];
    const skills = loadSkills(layers);

    expect(skills.length).toBe(2);
    expect(skills.map((s) => s.name).sort()).toEqual(['skill-one', 'skill-two']);
  });

  test('returns empty array when no skills directory', () => {
    const layers: ArtifactLayer[] = [{ path: testDir, source: 'project' }];
    const skills = loadSkills(layers);
    expect(skills).toEqual([]);
  });

  test('returns empty array when skills directory is empty', () => {
    mkdirSync(join(testDir, 'skills'));
    const layers: ArtifactLayer[] = [{ path: testDir, source: 'project' }];
    const skills = loadSkills(layers);
    expect(skills).toEqual([]);
  });

  test('skips directories without SKILL.md', () => {
    const skillsDir = join(testDir, 'skills');
    mkdirSync(skillsDir);

    // Valid skill
    const validDir = join(skillsDir, 'valid');
    mkdirSync(validDir);
    writeFileSync(
      join(validDir, 'SKILL.md'),
      `---
name: valid
description: Valid skill
---
Instructions.`
    );

    // Directory without SKILL.md
    const noSkillDir = join(skillsDir, 'no-skill');
    mkdirSync(noSkillDir);
    writeFileSync(join(noSkillDir, 'README.md'), 'Not a skill');

    const layers: ArtifactLayer[] = [{ path: testDir, source: 'project' }];
    const skills = loadSkills(layers);

    expect(skills.length).toBe(1);
    expect(skills[0].name).toBe('valid');
  });

  test('skips skills with invalid frontmatter', () => {
    const skillsDir = join(testDir, 'skills');
    mkdirSync(skillsDir);

    // Valid skill
    const validDir = join(skillsDir, 'valid');
    mkdirSync(validDir);
    writeFileSync(
      join(validDir, 'SKILL.md'),
      `---
name: valid
description: Valid skill
---
Instructions.`
    );

    // Invalid skill (missing required fields)
    const invalidDir = join(skillsDir, 'invalid');
    mkdirSync(invalidDir);
    writeFileSync(join(invalidDir, 'SKILL.md'), '---\ninvalid: true\n---\nNo name.');

    // Invalid skill (missing description)
    const missingDescDir = join(skillsDir, 'missing-desc');
    mkdirSync(missingDescDir);
    writeFileSync(join(missingDescDir, 'SKILL.md'), '---\nname: only-name\n---\nContent.');

    const layers: ArtifactLayer[] = [{ path: testDir, source: 'project' }];
    const skills = loadSkills(layers);

    expect(skills.length).toBe(1);
    expect(skills[0].name).toBe('valid');
  });

  test('includes content, path, and source in loaded skills', () => {
    const skillsDir = join(testDir, 'skills');
    mkdirSync(skillsDir);

    const skillDir = join(skillsDir, 'my-skill');
    mkdirSync(skillDir);
    writeFileSync(
      join(skillDir, 'SKILL.md'),
      `---
name: my-skill
description: My skill
---
Skill instructions here.`
    );

    const layers: ArtifactLayer[] = [{ path: testDir, source: 'project' }];
    const skills = loadSkills(layers);

    expect(skills.length).toBe(1);
    expect(skills[0].content).toBe('Skill instructions here.');
    expect(skills[0].path).toBe(skillDir);
    expect(skills[0].source).toBe('project');
  });
});

// ============================================================================
// loadSubagents tests (single layer)
// ============================================================================

describe('loadSubagents', () => {
  test('discovers multiple subagents in directory', () => {
    const subagentsDir = join(testDir, 'subagents');
    mkdirSync(subagentsDir);

    writeFileSync(
      join(subagentsDir, 'reviewer.md'),
      `---
name: reviewer
description: Code reviewer
tools:
  - read
  - grep
---
System prompt for reviewer.`
    );

    writeFileSync(
      join(subagentsDir, 'explorer.md'),
      `---
name: explorer
description: Code explorer
---
Explorer prompt.`
    );

    const layers: ArtifactLayer[] = [{ path: testDir, source: 'project' }];
    const subagents = loadSubagents(layers);

    expect(subagents.length).toBe(2);
    expect(subagents.map((s) => s.name).sort()).toEqual(['explorer', 'reviewer']);
  });

  test('includes all metadata fields and source', () => {
    const subagentsDir = join(testDir, 'subagents');
    mkdirSync(subagentsDir);

    writeFileSync(
      join(subagentsDir, 'full.md'),
      `---
name: full-agent
description: Agent with all fields
tools:
  - read
  - write
skills:
  - context7
model: gemini-2.5-pro
---
Full system instruction.`
    );

    const layers: ArtifactLayer[] = [{ path: testDir, source: 'global' }];
    const subagents = loadSubagents(layers);

    expect(subagents.length).toBe(1);
    expect(subagents[0].name).toBe('full-agent');
    expect(subagents[0].tools).toEqual(['read', 'write']);
    expect(subagents[0].skills).toEqual(['context7']);
    expect(subagents[0].model).toBe('gemini-2.5-pro');
    expect(subagents[0].content).toBe('Full system instruction.');
    expect(subagents[0].source).toBe('global');
  });

  test('handles subagents with minimal fields', () => {
    const subagentsDir = join(testDir, 'subagents');
    mkdirSync(subagentsDir);

    writeFileSync(
      join(subagentsDir, 'minimal.md'),
      `---
name: minimal
description: Minimal agent
---
Prompt.`
    );

    const layers: ArtifactLayer[] = [{ path: testDir, source: 'project' }];
    const subagents = loadSubagents(layers);

    expect(subagents.length).toBe(1);
    expect(subagents[0].tools).toBeUndefined();
    expect(subagents[0].skills).toBeUndefined();
    expect(subagents[0].model).toBeUndefined();
  });

  test('returns empty array when no subagents directory', () => {
    const layers: ArtifactLayer[] = [{ path: testDir, source: 'project' }];
    const subagents = loadSubagents(layers);
    expect(subagents).toEqual([]);
  });

  test('returns empty array when subagents directory is empty', () => {
    mkdirSync(join(testDir, 'subagents'));
    const layers: ArtifactLayer[] = [{ path: testDir, source: 'project' }];
    const subagents = loadSubagents(layers);
    expect(subagents).toEqual([]);
  });

  test('skips non-.md files', () => {
    const subagentsDir = join(testDir, 'subagents');
    mkdirSync(subagentsDir);

    writeFileSync(
      join(subagentsDir, 'valid.md'),
      `---
name: valid
description: Valid agent
---
Prompt.`
    );

    writeFileSync(join(subagentsDir, 'readme.txt'), 'Not a subagent');
    writeFileSync(join(subagentsDir, 'config.json'), '{}');

    const layers: ArtifactLayer[] = [{ path: testDir, source: 'project' }];
    const subagents = loadSubagents(layers);

    expect(subagents.length).toBe(1);
    expect(subagents[0].name).toBe('valid');
  });

  test('skips subagents with invalid frontmatter', () => {
    const subagentsDir = join(testDir, 'subagents');
    mkdirSync(subagentsDir);

    writeFileSync(
      join(subagentsDir, 'valid.md'),
      `---
name: valid
description: Valid agent
---
Prompt.`
    );

    // Missing required fields
    writeFileSync(join(subagentsDir, 'invalid.md'), '---\ninvalid: true\n---\nNo name.');

    // Missing description
    writeFileSync(join(subagentsDir, 'no-desc.md'), '---\nname: no-desc\n---\nPrompt.');

    const layers: ArtifactLayer[] = [{ path: testDir, source: 'project' }];
    const subagents = loadSubagents(layers);

    expect(subagents.length).toBe(1);
    expect(subagents[0].name).toBe('valid');
  });
});

// ============================================================================
// Multi-layer loading tests
// ============================================================================

describe('multi-layer loading', () => {
  test('loads skills from multiple layers', () => {
    // Create project layer
    const projectDir = join(testDir, 'project');
    mkdirSync(join(projectDir, 'skills', 'proj-skill'), { recursive: true });
    writeFileSync(
      join(projectDir, 'skills', 'proj-skill', 'SKILL.md'),
      '---\nname: proj-skill\ndescription: Project skill\n---\nProject content.'
    );

    // Create global layer
    const globalDir = join(testDir, 'global');
    mkdirSync(join(globalDir, 'skills', 'global-skill'), { recursive: true });
    writeFileSync(
      join(globalDir, 'skills', 'global-skill', 'SKILL.md'),
      '---\nname: global-skill\ndescription: Global skill\n---\nGlobal content.'
    );

    const layers: ArtifactLayer[] = [
      { path: projectDir, source: 'project' },
      { path: globalDir, source: 'global' },
    ];

    const skills = loadSkills(layers);

    expect(skills.length).toBe(2);
    expect(skills.find((s) => s.name === 'proj-skill')?.source).toBe('project');
    expect(skills.find((s) => s.name === 'global-skill')?.source).toBe('global');
  });

  test('deduplicates skills by name — project wins over global', () => {
    // Both layers have a skill with the same name
    const projectDir = join(testDir, 'project');
    mkdirSync(join(projectDir, 'skills', 'shared-skill'), { recursive: true });
    writeFileSync(
      join(projectDir, 'skills', 'shared-skill', 'SKILL.md'),
      '---\nname: shared-skill\ndescription: Project version\n---\nProject content.'
    );

    const globalDir = join(testDir, 'global');
    mkdirSync(join(globalDir, 'skills', 'shared-skill'), { recursive: true });
    writeFileSync(
      join(globalDir, 'skills', 'shared-skill', 'SKILL.md'),
      '---\nname: shared-skill\ndescription: Global version\n---\nGlobal content.'
    );

    const layers: ArtifactLayer[] = [
      { path: projectDir, source: 'project' },
      { path: globalDir, source: 'global' },
    ];

    const skills = loadSkills(layers);

    expect(skills.length).toBe(1);
    expect(skills[0].name).toBe('shared-skill');
    expect(skills[0].description).toBe('Project version');
    expect(skills[0].source).toBe('project');
  });

  test('deduplicates subagents by name across layers', () => {
    const projectDir = join(testDir, 'project');
    mkdirSync(join(projectDir, 'subagents'), { recursive: true });
    writeFileSync(
      join(projectDir, 'subagents', 'reviewer.md'),
      '---\nname: reviewer\ndescription: Project reviewer\n---\nProject prompt.'
    );

    const globalDir = join(testDir, 'global');
    mkdirSync(join(globalDir, 'subagents'), { recursive: true });
    writeFileSync(
      join(globalDir, 'subagents', 'reviewer.md'),
      '---\nname: reviewer\ndescription: Global reviewer\n---\nGlobal prompt.'
    );
    writeFileSync(
      join(globalDir, 'subagents', 'extra.md'),
      '---\nname: extra\ndescription: Extra global agent\n---\nExtra prompt.'
    );

    const layers: ArtifactLayer[] = [
      { path: projectDir, source: 'project' },
      { path: globalDir, source: 'global' },
    ];

    const subagents = loadSubagents(layers);

    expect(subagents.length).toBe(2);
    const reviewer = subagents.find((s) => s.name === 'reviewer');
    expect(reviewer?.description).toBe('Project reviewer');
    expect(reviewer?.source).toBe('project');
    const extra = subagents.find((s) => s.name === 'extra');
    expect(extra?.source).toBe('global');
  });

  test('handles three layers with cascading dedup', () => {
    const projectDir = join(testDir, 'project');
    mkdirSync(join(projectDir, 'skills', 'a'), { recursive: true });
    writeFileSync(
      join(projectDir, 'skills', 'a', 'SKILL.md'),
      '---\nname: a\ndescription: Project A\n---\nProject A.'
    );

    const globalDir = join(testDir, 'global');
    mkdirSync(join(globalDir, 'skills', 'a'), { recursive: true });
    mkdirSync(join(globalDir, 'skills', 'b'), { recursive: true });
    writeFileSync(
      join(globalDir, 'skills', 'a', 'SKILL.md'),
      '---\nname: a\ndescription: Global A\n---\nGlobal A.'
    );
    writeFileSync(
      join(globalDir, 'skills', 'b', 'SKILL.md'),
      '---\nname: b\ndescription: Global B\n---\nGlobal B.'
    );

    const builtinDir = join(testDir, 'builtin');
    mkdirSync(join(builtinDir, 'skills', 'a'), { recursive: true });
    mkdirSync(join(builtinDir, 'skills', 'b'), { recursive: true });
    mkdirSync(join(builtinDir, 'skills', 'c'), { recursive: true });
    writeFileSync(
      join(builtinDir, 'skills', 'a', 'SKILL.md'),
      '---\nname: a\ndescription: Builtin A\n---\nBuiltin A.'
    );
    writeFileSync(
      join(builtinDir, 'skills', 'b', 'SKILL.md'),
      '---\nname: b\ndescription: Builtin B\n---\nBuiltin B.'
    );
    writeFileSync(
      join(builtinDir, 'skills', 'c', 'SKILL.md'),
      '---\nname: c\ndescription: Builtin C\n---\nBuiltin C.'
    );

    const layers: ArtifactLayer[] = [
      { path: projectDir, source: 'project' },
      { path: globalDir, source: 'global' },
      { path: builtinDir, source: 'builtin' },
    ];

    const skills = loadSkills(layers);

    expect(skills.length).toBe(3);
    expect(skills.find((s) => s.name === 'a')?.source).toBe('project');
    expect(skills.find((s) => s.name === 'b')?.source).toBe('global');
    expect(skills.find((s) => s.name === 'c')?.source).toBe('builtin');
  });

  test('skips layers with non-existent paths', () => {
    const projectDir = join(testDir, 'project');
    mkdirSync(join(projectDir, 'skills', 'real'), { recursive: true });
    writeFileSync(
      join(projectDir, 'skills', 'real', 'SKILL.md'),
      '---\nname: real\ndescription: Real skill\n---\nContent.'
    );

    const layers: ArtifactLayer[] = [
      { path: projectDir, source: 'project' },
      { path: join(testDir, 'nonexistent'), source: 'global' },
    ];

    const skills = loadSkills(layers);

    expect(skills.length).toBe(1);
    expect(skills[0].name).toBe('real');
  });
});

// ============================================================================
// getDefaultLayers tests
// ============================================================================

describe('getDefaultLayers', () => {
  test('returns three layers in correct precedence order', () => {
    const layers = getDefaultLayers();

    expect(layers.length).toBe(3);
    expect(layers[0].source).toBe('project');
    expect(layers[1].source).toBe('global');
    expect(layers[2].source).toBe('builtin');
  });

  test('project layer path matches config or env default', () => {
    const layers = getDefaultLayers();
    // Default artifactsPath is '.agent'
    expect(layers[0].path).toBe(process.env.AGENT_ARTIFACTS_PATH ?? '.agent');
  });

  test('global layer path points to home .agent directory', () => {
    const { homedir } = require('node:os');
    const layers = getDefaultLayers();
    const expectedGlobal = process.env.AGENT_GLOBAL_ARTIFACTS_PATH ?? join(homedir(), '.agent');
    expect(layers[1].path).toBe(expectedGlobal);
  });

  test('builtin layer path exists and contains skills/ and subagents/', () => {
    const layers = getDefaultLayers();
    const builtinPath = layers[2].path;

    expect(existsSync(builtinPath)).toBe(true);
    expect(existsSync(join(builtinPath, 'skills'))).toBe(true);
    expect(existsSync(join(builtinPath, 'subagents'))).toBe(true);

    // Verify actual artifacts exist there
    expect(existsSync(join(builtinPath, 'skills', 'skill-creator', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(builtinPath, 'subagents', 'general-purpose.md'))).toBe(true);
  });
});

// ============================================================================
// Package bundling tests — verify built-ins ship with npm/bun install
// ============================================================================

describe('package bundling', () => {
  test('npm pack includes skills/ and subagents/ directories', async () => {
    const { execSync } = require('node:child_process');
    const packageDir = resolve(import.meta.dirname, '..');

    // Run npm pack --dry-run and capture file list
    const output = execSync('npm pack --dry-run 2>&1', {
      cwd: packageDir,
      encoding: 'utf-8',
    });

    // Verify built-in skill is in the tarball
    expect(output).toContain('skills/skill-creator/SKILL.md');
    // Verify built-in subagent is in the tarball
    expect(output).toContain('subagents/general-purpose.md');
  });

  test('built-in artifacts resolve correctly from both source and dist paths', () => {
    const packageRoot = resolve(import.meta.dirname, '..');

    // From source: src/load_artifacts/ -> ../.. -> packages/agent/ ✓
    const fromSrc = resolve(import.meta.dirname, '../src/load_artifacts');
    expect(existsSync(join(packageRoot, 'skills', 'skill-creator', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(packageRoot, 'subagents', 'general-purpose.md'))).toBe(true);

    // From dist: dist/ -> .. -> packages/agent/ ✓ (findPackageRoot walks up)
    const distDir = join(packageRoot, 'dist');
    if (existsSync(distDir)) {
      // After build, dist/ exists. findPackageRoot from dist/ should find packages/agent/
      // (walks up 1 level, finds package.json + skills/)
      const parentOfDist = resolve(distDir, '..');
      expect(existsSync(join(parentOfDist, 'package.json'))).toBe(true);
      expect(existsSync(join(parentOfDist, 'skills'))).toBe(true);
    }
  });
});

// ============================================================================
// Built-in artifacts — content + functional validation
// ============================================================================

describe('built-in artifacts', () => {
  test('skill-creator has valid metadata, content, and path', () => {
    const builtinLayer = getDefaultLayers().find((l) => l.source === 'builtin');
    if (!builtinLayer) throw new Error('No builtin layer found');

    const skills = loadSkills([builtinLayer]);
    const sc = skills.find((s) => s.name === 'skill-creator');

    // Metadata
    expect(sc).toBeDefined();
    expect(sc?.name).toBe('skill-creator');
    expect(sc?.description).toContain('creating');
    expect(sc?.source).toBe('builtin');

    // Content includes key sections from the SKILL.md body
    expect(sc?.content).toContain('Anatomy of a Skill');
    expect(sc?.content).toContain('SKILL.md');
    expect(sc?.content).toContain('Frontmatter');

    // Path points to a real directory
    expect(existsSync(sc?.path ?? '')).toBe(true);
    expect(existsSync(join(sc?.path ?? '', 'SKILL.md'))).toBe(true);
  });

  test('general-purpose subagent has valid metadata, tools, and system prompt', () => {
    const builtinLayer = getDefaultLayers().find((l) => l.source === 'builtin');
    if (!builtinLayer) throw new Error('No builtin layer found');

    const subagents = loadSubagents([builtinLayer]);
    const gp = subagents.find((s) => s.name === 'general-purpose');

    // Metadata
    expect(gp).toBeDefined();
    expect(gp?.name).toBe('general-purpose');
    expect(gp?.description).toContain('general-purpose');
    expect(gp?.source).toBe('builtin');

    // Tools — should include common tools
    expect(gp?.tools).toBeDefined();
    expect(gp?.tools).toContain('read');
    expect(gp?.tools).toContain('write');
    expect(gp?.tools).toContain('bash');

    // System prompt — should contain agent instructions
    expect(gp?.content).toContain('Guidelines');
    expect(gp?.content).toContain('Read before writing');
  });

  test('built-in skill is usable through createSkillTool', async () => {
    const builtinLayer = getDefaultLayers().find((l) => l.source === 'builtin');
    if (!builtinLayer) throw new Error('No builtin layer found');

    const skills = loadSkills([builtinLayer]);
    const { createSkillTool } = await import('../src/tools/skills');
    const skillTool = createSkillTool(skills);

    // Tool has correct name
    expect(skillTool.name).toBe('skills');

    // Execute the tool to load the built-in skill content
    const result = await skillTool.execute('test-call', { name: 'skill-creator' });
    expect(result.isError).toBeFalsy();
    expect(result.result).toContain('Anatomy of a Skill');
    expect(result.result).toContain('SKILL.md');
  });

  test('built-in skill-creator returns error for unknown skill name', async () => {
    const builtinLayer = getDefaultLayers().find((l) => l.source === 'builtin');
    if (!builtinLayer) throw new Error('No builtin layer found');

    const skills = loadSkills([builtinLayer]);
    const { createSkillTool } = await import('../src/tools/skills');
    const skillTool = createSkillTool(skills);

    const result = await skillTool.execute('test-call', { name: 'nonexistent-skill' });
    expect(result.isError).toBe(true);
  });

  test('built-in subagent is listed in createSubagentTool description', () => {
    const builtinLayer = getDefaultLayers().find((l) => l.source === 'builtin');
    if (!builtinLayer) throw new Error('No builtin layer found');

    const subagents = loadSubagents([builtinLayer]);
    const { createSubagentTool } = require('../src/tools/subagent');
    const subagentTool = createSubagentTool(subagents);

    expect(subagentTool.name).toBe('delegate_to_subagent');
    expect(subagentTool.description).toContain('general-purpose');
  });

  test('project artifacts shadow built-in with same name', () => {
    const projectDir = join(testDir, 'project');
    mkdirSync(join(projectDir, 'skills', 'skill-creator'), { recursive: true });
    writeFileSync(
      join(projectDir, 'skills', 'skill-creator', 'SKILL.md'),
      '---\nname: skill-creator\ndescription: Custom project skill-creator\n---\nCustom project content.'
    );

    const builtinLayer = getDefaultLayers().find((l) => l.source === 'builtin');
    if (!builtinLayer) throw new Error('No builtin layer found');
    const layers: ArtifactLayer[] = [{ path: projectDir, source: 'project' }, builtinLayer];

    const skills = loadSkills(layers);
    const sc = skills.find((s) => s.name === 'skill-creator');

    expect(sc?.source).toBe('project');
    expect(sc?.description).toBe('Custom project skill-creator');
    expect(sc?.content).toBe('Custom project content.');
    // Built-in content should NOT be present
    expect(sc?.content).not.toContain('Frontmatter Rules');
  });
});

// ============================================================================
// Global artifacts — full content + dedup validation
// ============================================================================

describe('global artifacts', () => {
  test('loads skills from global layer with correct content', () => {
    const globalDir = join(testDir, 'global');
    mkdirSync(join(globalDir, 'skills', 'my-global-skill'), { recursive: true });
    writeFileSync(
      join(globalDir, 'skills', 'my-global-skill', 'SKILL.md'),
      `---
name: my-global-skill
description: A global skill for testing
---

## Global Skill Instructions

1. Step one
2. Step two
3. Step three`
    );

    const layers: ArtifactLayer[] = [{ path: globalDir, source: 'global' }];
    const skills = loadSkills(layers);

    expect(skills.length).toBe(1);
    const skill = skills[0];
    expect(skill.name).toBe('my-global-skill');
    expect(skill.description).toBe('A global skill for testing');
    expect(skill.source).toBe('global');
    expect(skill.content).toContain('Global Skill Instructions');
    expect(skill.content).toContain('Step one');
    expect(skill.path).toBe(join(globalDir, 'skills', 'my-global-skill'));
  });

  test('loads subagents from global layer with full metadata', () => {
    const globalDir = join(testDir, 'global');
    mkdirSync(join(globalDir, 'subagents'), { recursive: true });
    writeFileSync(
      join(globalDir, 'subagents', 'global-reviewer.md'),
      `---
name: global-reviewer
description: A global code reviewer agent
tools:
  - read
  - grep
skills:
  - code-standards
model: gemini-2.5-pro
---

You are a code reviewer. Follow these steps:
1. Read the file
2. Analyze for issues
3. Report findings`
    );

    const layers: ArtifactLayer[] = [{ path: globalDir, source: 'global' }];
    const subagents = loadSubagents(layers);

    expect(subagents.length).toBe(1);
    const sa = subagents[0];
    expect(sa.name).toBe('global-reviewer');
    expect(sa.description).toBe('A global code reviewer agent');
    expect(sa.source).toBe('global');
    expect(sa.tools).toEqual(['read', 'grep']);
    expect(sa.skills).toEqual(['code-standards']);
    expect(sa.model).toBe('gemini-2.5-pro');
    expect(sa.content).toContain('code reviewer');
    expect(sa.content).toContain('Report findings');
  });

  test('global skill is usable through createSkillTool', async () => {
    const globalDir = join(testDir, 'global');
    mkdirSync(join(globalDir, 'skills', 'test-skill'), { recursive: true });
    writeFileSync(
      join(globalDir, 'skills', 'test-skill', 'SKILL.md'),
      '---\nname: test-skill\ndescription: Test global skill\n---\nGlobal skill content for functional test.'
    );

    const layers: ArtifactLayer[] = [{ path: globalDir, source: 'global' }];
    const skills = loadSkills(layers);

    const { createSkillTool } = await import('../src/tools/skills');
    const skillTool = createSkillTool(skills);

    const result = await skillTool.execute('test-call', { name: 'test-skill' });
    expect(result.isError).toBeFalsy();
    expect(result.result).toBe('Global skill content for functional test.');
  });

  test('project skill overrides global skill of the same name', () => {
    const projectDir = join(testDir, 'project');
    mkdirSync(join(projectDir, 'skills', 'shared'), { recursive: true });
    writeFileSync(
      join(projectDir, 'skills', 'shared', 'SKILL.md'),
      '---\nname: shared\ndescription: Project version\n---\nProject-specific instructions.'
    );

    const globalDir = join(testDir, 'global');
    mkdirSync(join(globalDir, 'skills', 'shared'), { recursive: true });
    writeFileSync(
      join(globalDir, 'skills', 'shared', 'SKILL.md'),
      '---\nname: shared\ndescription: Global version\n---\nGlobal default instructions.'
    );

    const layers: ArtifactLayer[] = [
      { path: projectDir, source: 'project' },
      { path: globalDir, source: 'global' },
    ];

    const skills = loadSkills(layers);
    expect(skills.length).toBe(1);
    expect(skills[0].source).toBe('project');
    expect(skills[0].content).toBe('Project-specific instructions.');
    expect(skills[0].content).not.toContain('Global default');
  });
});

// ============================================================================
// Disabled artifacts — filtering validation
// ============================================================================

describe('disabled artifacts filtering', () => {
  test('disabled skills are excluded from loaded results', () => {
    const dir = join(testDir, 'with-disabled');
    mkdirSync(join(dir, 'skills', 'keep-me'), { recursive: true });
    mkdirSync(join(dir, 'skills', 'drop-me'), { recursive: true });
    writeFileSync(
      join(dir, 'skills', 'keep-me', 'SKILL.md'),
      '---\nname: keep-me\ndescription: Keep this\n---\nKeep content.'
    );
    writeFileSync(
      join(dir, 'skills', 'drop-me', 'SKILL.md'),
      '---\nname: drop-me\ndescription: Drop this\n---\nDrop content.'
    );

    const layers: ArtifactLayer[] = [{ path: dir, source: 'project' }];
    const allSkills = loadSkills(layers);
    expect(allSkills.length).toBe(2);

    // Simulate disabled filtering (same logic as tools/index.ts)
    const disabledSkills = ['drop-me'];
    const filtered = allSkills.filter((s) => !disabledSkills.includes(s.name));

    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('keep-me');
  });

  test('disabled subagents are excluded from loaded results', () => {
    const dir = join(testDir, 'with-disabled');
    mkdirSync(join(dir, 'subagents'), { recursive: true });
    writeFileSync(
      join(dir, 'subagents', 'active.md'),
      '---\nname: active\ndescription: Active agent\n---\nActive prompt.'
    );
    writeFileSync(
      join(dir, 'subagents', 'disabled.md'),
      '---\nname: disabled\ndescription: Disabled agent\n---\nDisabled prompt.'
    );

    const layers: ArtifactLayer[] = [{ path: dir, source: 'project' }];
    const allSubagents = loadSubagents(layers);
    expect(allSubagents.length).toBe(2);

    const disabledSubagents = ['disabled'];
    const filtered = allSubagents.filter((s) => !disabledSubagents.includes(s.name));

    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('active');
  });

  test('disabled skill is not accessible via createSkillTool', async () => {
    const dir = join(testDir, 'disabled-tool');
    mkdirSync(join(dir, 'skills', 'secret'), { recursive: true });
    writeFileSync(
      join(dir, 'skills', 'secret', 'SKILL.md'),
      '---\nname: secret\ndescription: Secret skill\n---\nSecret content.'
    );

    const layers: ArtifactLayer[] = [{ path: dir, source: 'project' }];
    const allSkills = loadSkills(layers);
    const filtered = allSkills.filter((s) => !['secret'].includes(s.name));

    const { createSkillTool } = await import('../src/tools/skills');
    const skillTool = createSkillTool(filtered);

    const result = await skillTool.execute('test-call', { name: 'secret' });
    expect(result.isError).toBe(true);
  });
});

// ============================================================================
// Integration: existing .agent/skills
// ============================================================================

describe('integration', () => {
  test('loads existing .agent/skills with full content validation', () => {
    // Resolve to the repo root .agent directory (two levels up from packages/agent/)
    const repoRoot = resolve(import.meta.dirname, '../..');
    const agentDir = join(repoRoot, '.agent');

    // Skip if .agent directory doesn't exist (e.g., in CI)
    if (!existsSync(join(agentDir, 'skills'))) return;

    const layers: ArtifactLayer[] = [{ path: agentDir, source: 'project' }];
    const skills = loadSkills(layers);

    // We know context7 and skill-creator exist in the repo
    expect(skills.length).toBeGreaterThanOrEqual(2);

    // Validate context7 content, not just name
    const context7 = skills.find((s) => s.name === 'context7');
    expect(context7).toBeDefined();
    expect(context7?.description).toContain('documentation');
    expect(context7?.content.length).toBeGreaterThan(100);
    expect(context7?.content).toContain('Context7');
    expect(context7?.source).toBe('project');
    expect(existsSync(context7?.path ?? '')).toBe(true);

    // Validate skill-creator content
    const skillCreator = skills.find((s) => s.name === 'skill-creator');
    expect(skillCreator).toBeDefined();
    expect(skillCreator?.content.length).toBeGreaterThan(100);
    expect(skillCreator?.source).toBe('project');
  });
});
