## Repository Guidelines

- Repo: https://github.com/philschmid/ia-agents
- GitHub issues/comments/PR comments: use literal multiline strings or `-F - <<'EOF'` (or $'...') for real newlines; never embed "\\n".

## Project Overview

Minimal agent framework for the **Gemini Interactions API**.

- Main Package: `packages/agents-core/` — core agent framework (`@philschmid/agents-core`)
  - Source: `packages/agents-core/src/` (agent loop, event streaming, model layer, tools)
  - Tests: `packages/agents-core/tests/`
- Agent Package: `packages/agent/` — higher-level wrapper (`@philschmid/agent`)
  - Source: `packages/agent/src/` (HookRunner, AgentSession, tool wrapping)
  - Tests: `packages/agent/test/`
- Examples: `examples/` (multi-turn with tool calling, interactive CLI)
- Documentation: `docs/src/content/docs/` (Astro Starlight MDX files)
- Model: Model id uses for code is `gemini-3-flash-preview`

## Development Workflow

- Prefer Bun for TypeScript execution (scripts, dev, tests): `bun <file.ts>` / `bunx <tool>`.
- Always run Formatting/linting before commits.
- Run full gate (lints, format, tests) before pushing when you touch logic
- All features must be documented. If new capabilties are included the concepts must be docuemnted with examples. 

### Commit & PR Guidelines

- Follow concise, action-oriented commit messages (e.g., `feat: add verbose flag to send`)
- Group related changes; avoid bundling unrelated refactors
- PRs should summarize scope, note testing performed, and mention any user-facing changes
- PR review flow: when given a PR link, review via `gh pr view`/`gh pr diff` and do **not** change branches.
- PR review calls: prefer a single `gh pr view --json ...` to batch metadata/comments; run `gh pr diff` only when needed.
- Run lint and tests before pushing when you touch logic.
- Goal: merge PRs. Prefer **rebase** when commits are clean; **squash** when history is messy.
- When working on a PR: add a changelog entry with the PR number and thank the contributor.
- When working on an issue: reference the issue in the changelog entry.
- Pure test additions/fixes generally do **not** need a changelog entry unless they alter user-facing behavior
- NEVER run `git reset --hard` without first checking `git status` for untracked files

### Code Style & Conventions

- Prefer `type` over `interface`; never use `enum` (use string literal unions instead)
- Static imports only - No `await import(...)` dynamic imports  
- Use descriptive variable names
- Add brief code comments for tricky or non-obvious logic.
- Keep functions small and focused
- Write tests for new functionality
- Handle errors explicitly, don't swallow them
- Keep files concise; extract helpers instead of “V2” copies. 


## Commands Reference

**Always use `bun`, not `npm`.**

```sh
# 1. Make changes

# 2. Typecheck (fast)
bun run tsc --noEmit

# 3. Run tests
bun test                                # All tests
bun test "my-file.test.ts"              # Specific files
bun test "my-file.test.ts" -t "test name" # Specific test

# 4. Lint before committing
bun run biome check "src/file1.ts"      # Specific files
bun run lint                            # All files
bun run lint:fix                        # Try fix

# 5. Before committing (full gate)
bun run lint && bun test
```

```sh
# Git workflow
git status              # Check current state
git diff                # Review changes before commit
```

## Things the Agent Should NOT Do

<!-- Add mistakes the agent makes so it learns -->

- Don't write shallow tests that only check `.toBeDefined()` — validate content, metadata, and functional behavior
- Don't create parallel/duplicate functions when an existing one can be reused with the right parameters
- Don't use hardcoded relative paths (`../..`) for package root resolution — they break after compilation
- Don't use `any` type in TypeScript without explicit approval
- Don't skip error handling
- Don't commit without running tests first
- Don't make breaking API changes without discussion
- Never commit or publish real phone numbers, API keys, tokens, or live configuration values


## Documentation

- Internal doc links: use root-relative paths without extension (e.g., `[Config](/configuration)`)
- Section cross-references: use anchors (e.g., `[Hooks](/configuration#hooks)`)
- README (GitHub): keep absolute URLs so links work on GitHub
- Docs content must be generic: no personal device names/hostnames/paths; use placeholders
- Docs use Astro Starlight: source in `docs/src/content/docs/*.mdx`
- API reference auto-generated via `createStarlightTypeDocPlugin`
- Use mermaid code blocks for architecture diagrams

## Project-Specific Patterns

<!-- Add patterns as they emerge from your codebase, e.g.  -->

### Artifacts (Skills & Subagents)
- Artifacts location: `.agent/skills/<name>/SKILL.md` (directories) and `.agent/subagents/<name>.md` (files)
- Format: YAML frontmatter (`name`, `description`, optional `tools`/`skills`/`model`) + markdown body as `content`
- Loading: `loadSkills()` and `loadSubagents()` accept `ArtifactLayer[]`; precedence: project > global > built-in
- Built-in artifacts: `packages/agent/skills/` and `packages/agent/subagents/` — shipped via `package.json` `files` field
- Path resolution: use `findPackageRoot()` (not hardcoded `../..`) to resolve paths that work from both `src/` and `dist/`
- Env vars: `AGENT_ARTIFACTS_PATH` (project), `AGENT_GLOBAL_ARTIFACTS_PATH` (global), `AGENT_DISABLED_SKILLS`/`AGENT_DISABLED_SUBAGENTS`
- Optional properties: spread conditionally to avoid `undefined` keys: `...(value && { key: value })`
- Subagent system prompt: append `createSkillSystemInstruction(declaredSkills)` — reuse existing builders, don't create parallel functions

---

_Update this file continuously. Every mistake is a learning opportunity._
