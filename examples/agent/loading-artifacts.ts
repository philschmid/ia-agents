/**
 * Loading Artifacts Example
 *
 * Demonstrates programmatic loading of skills and subagents.
 *
 * Run: bun examples/agent/loading-artifacts.ts
 */

import { loadSkills, loadSubagents } from '@philschmid/agent';

// Load skills from default path (.agent/skills/)
const skills = loadSkills();
console.log('Loaded skills:');
for (const skill of skills) {
  console.log(`  - ${skill.name}: ${skill.description}`);
  console.log(`    Path: ${skill.path}`);
}

// Load subagents from default path (.agent/subagents/)
const subagents = loadSubagents();
console.log('\nLoaded subagents:');
for (const subagent of subagents) {
  console.log(`  - ${subagent.name}: ${subagent.description}`);
  if (subagent.tools) {
    console.log(`    Tools: ${subagent.tools.join(', ')}`);
  }
  if (subagent.model) {
    console.log(`    Model: ${subagent.model}`);
  }
}

// Load from custom path
const customSkills = loadSkills('/path/to/custom/artifacts');
const customSubagents = loadSubagents('/path/to/custom/artifacts');
console.log(`\nCustom path: ${customSkills.length} skills, ${customSubagents.length} subagents`);
