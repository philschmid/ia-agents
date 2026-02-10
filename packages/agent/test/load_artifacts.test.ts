/**
 * Load Artifacts Tests
 *
 * Tests for loading skills and subagents from disk with various edge cases.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  SkillMetadataSchema,
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
// loadSkills tests
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

    const skills = loadSkills(testDir);

    expect(skills.length).toBe(2);
    expect(skills.map((s) => s.name).sort()).toEqual(['skill-one', 'skill-two']);
  });

  test('returns empty array when no skills directory', () => {
    const skills = loadSkills(testDir);
    expect(skills).toEqual([]);
  });

  test('returns empty array when skills directory is empty', () => {
    mkdirSync(join(testDir, 'skills'));
    const skills = loadSkills(testDir);
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

    const skills = loadSkills(testDir);

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

    const skills = loadSkills(testDir);

    expect(skills.length).toBe(1);
    expect(skills[0].name).toBe('valid');
  });

  test('includes content and path in loaded skills', () => {
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

    const skills = loadSkills(testDir);

    expect(skills.length).toBe(1);
    expect(skills[0].content).toBe('Skill instructions here.');
    expect(skills[0].path).toBe(skillDir);
  });
});

// ============================================================================
// loadSubagents tests
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

    const subagents = loadSubagents(testDir);

    expect(subagents.length).toBe(2);
    expect(subagents.map((s) => s.name).sort()).toEqual(['explorer', 'reviewer']);
  });

  test('includes all metadata fields', () => {
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

    const subagents = loadSubagents(testDir);

    expect(subagents.length).toBe(1);
    expect(subagents[0].name).toBe('full-agent');
    expect(subagents[0].tools).toEqual(['read', 'write']);
    expect(subagents[0].skills).toEqual(['context7']);
    expect(subagents[0].model).toBe('gemini-2.5-pro');
    expect(subagents[0].content).toBe('Full system instruction.');
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

    const subagents = loadSubagents(testDir);

    expect(subagents.length).toBe(1);
    expect(subagents[0].tools).toBeUndefined();
    expect(subagents[0].skills).toBeUndefined();
    expect(subagents[0].model).toBeUndefined();
  });

  test('returns empty array when no subagents directory', () => {
    const subagents = loadSubagents(testDir);
    expect(subagents).toEqual([]);
  });

  test('returns empty array when subagents directory is empty', () => {
    mkdirSync(join(testDir, 'subagents'));
    const subagents = loadSubagents(testDir);
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

    const subagents = loadSubagents(testDir);

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

    const subagents = loadSubagents(testDir);

    expect(subagents.length).toBe(1);
    expect(subagents[0].name).toBe('valid');
  });
});

// ============================================================================
// Integration: existing .agent/skills
// ============================================================================

describe('integration', () => {
  test('loads existing .agent/skills', () => {
    const skills = loadSkills('.agent');

    // We know context7 and skill-creator exist
    expect(skills.length).toBeGreaterThanOrEqual(2);

    const context7 = skills.find((s) => s.name === 'context7');
    expect(context7).toBeDefined();
    expect(context7?.description).toContain('documentation');
    expect(context7?.content.length).toBeGreaterThan(0);

    const skillCreator = skills.find((s) => s.name === 'skill-creator');
    expect(skillCreator).toBeDefined();
  });
});
