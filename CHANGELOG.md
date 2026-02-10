# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 2026-02-10

### Added
- Initial release of `@philschmid/agents-core` — minimal agent framework for the Gemini Interactions API
- Initial release of `@philschmid/agent` — higher-level agent wrapper with tools, hooks, and session management
- EventStream pattern for push-based async event streaming
- Multi-turn `AgentSession` with `send()` and `stream()` API
- Tool calling with JSON Schema definitions and string-based tool registry
- Built-in tools: `read`, `write`, `grep`, `bash`, `sleep`, `plan`, `web_fetch`, `web_search`
- Hook system with 6 lifecycle hooks (`onAgentStart`, `onInteractionStart`, `beforeToolExecute`, `afterToolExecute`, `onInteractionEnd`, `onAgentEnd`)
- Typesafe configuration system with `settings.json` and `AGENT_*` environment variables
- Skills and subagents artifact system for extending agent capabilities
- `AgentContext` using `AsyncLocalStorage` for scoped session context
- Thinking summaries support
- Documentation site built with Astro Starlight
- Example scripts for multi-turn, CLI, hooks, tools, skills, and subagents
