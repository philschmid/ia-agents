/**
 * Load Artifacts
 *
 * Load skills and subagents from disk.
 */

// Types
export type {
  ArtifactLayer,
  ArtifactSource,
  Skill,
  SkillMetadata,
  Subagent,
  SubagentMetadata,
} from './types';
export { SkillMetadataSchema, SubagentMetadataSchema } from './types';

// Parser
export { parseArtifact } from './parser';

// Loader
export {
  getDefaultLayers,
  loadArtifact,
  type LoadedArtifact,
  loadSkills,
  loadSubagents,
} from './loader';
