---
name: docs-writer
description: "Comprehensive guide for writing high-quality developer documentation. Use this skill when: (1) Creating new documentation pages (tutorials, API references, guides, concepts), (2) Reviewing or improving existing documentation, (3) Establishing documentation standards for a project, (4) Writing READMEs, quickstarts, or getting-started guides, (5) Formatting code examples, callouts, or navigation elements. Applies synthesized best practices from Anthropic Claude, OpenAI Codex, and Google Gemini documentation."
---

# Documentation Writer

Write developer documentation that is clear, actionable, and developer-centric.

## Core Principles

1. **Code-First**: Get developers to working code within the first scroll. Show-don't-tell.
2. **Progressive Disclosure**: Start simple, layer complexity. Don't overwhelm with edge cases upfront.
3. **Active Voice**: Use "you" and imperatives. "Create a file" not "A file should be created."
4. **Honest Trade-offs**: Document limitations alongside features. Developers trust balanced guidance.
5. **Scannable**: Bullets over paragraphs. Tables over prose. Short sentences.

## Quick Checklist

Before writing any page:

- [ ] **Identify page type**: Tutorial, API Reference, Concept, or Overview?
- [ ] **Define the outcome**: What will the reader accomplish after reading?
- [ ] **First scroll content**: Does the first screen show value (code, clear benefit)?
- [ ] **Prerequisites clear**: Are requirements explicitly listed?
- [ ] **Next steps defined**: Where does the reader go after this page?

## Page Types

| Type | Purpose | Key Pattern |
|------|---------|-------------|
| **Tutorial** | Hands-on learning | What you'll do → Prerequisites → Steps → Verify → Next |
| **API Reference** | Parameter lookup | Intro → Parameters table → Response → Errors → Examples |
| **Concept/Guide** | Deep understanding | Problem → Solution → When to use → Examples → Trade-offs |
| **Overview** | Navigation hub | Value prop → Feature cards → Get started links |

See [references/templates.md](references/templates.md) for complete templates.

## Writing Style

### Voice and Tone

- **Direct**: "Create an interaction" not "You might want to create an interaction"
- **Confident**: "Use X for Y" not "You could possibly use X for Y"
- **Conversational**: Write like explaining to a colleague, not a textbook

### Sentence Structure

- Lead with purpose: First sentence states what the section covers
- Keep sentences under 25 words
- One idea per paragraph

### Technical Terms

- Context first, then name: "To generate responses (using the Interactions API), call..."
- Spell out acronyms on first use: "Model Context Protocol (MCP)"
- Define inline with colons or em-dashes

See [references/style-guide.md](references/style-guide.md) for detailed guidance.

## Formatting Quick Reference

### Callouts

| Type | Usage | When to Use |
|------|-------|-------------|
| `<Note>` | Contextual info, cross-refs | Methodology notes, scope clarifications |
| `<Tip>` | Best practices, shortcuts | Optimization hints, actionable advice |
| `<Warning>` | Breaking changes, risks | Security issues, destructive actions |

### Code Blocks

- Always specify language: ` ```python `, ` ```bash `
- Order: Shell → Python → TypeScript → Java
- Add inline comments for non-obvious lines
- Make code copy-paste ready

### Tables

- Left-align text columns
- Use code font for parameter names, types
- Keep cells concise (<15 words)

See [references/formatting.md](references/formatting.md) for complete conventions.

## Key Patterns

### The First Scroll Rule

The first viewport must answer: "What is this and why should I care?"

**Tutorial**: Show what you'll build + prerequisites  
**API Reference**: Brief description + minimal code example  
**Concept**: Problem statement + solution overview

### Example Placement

1. Introduce concept (1-2 sentences)
2. Show code example
3. Explain key parts

Never code without context or explanation.

### Before/After Comparisons

Show improvement through examples:
- ❌ **Before**: "Unclear prompt..."
- ✅ **After**: "Clear prompt with..."

See [references/patterns.md](references/patterns.md) for all patterns.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Wall of text before code | Lead with code example, explain after |
| Vague prerequisites | State exact versions, include links |
| No next steps | End every page with navigation |
| Marketing language | Use technical, precise terms |
| Hiding limitations | Add dedicated "Limitations" section |

## Reference Files

Load these based on your task:

- **[style-guide.md](references/style-guide.md)**: Detailed voice, tone, sentence patterns
- **[templates.md](references/templates.md)**: Copy-paste templates for each page type
- **[formatting.md](references/formatting.md)**: Callouts, code blocks, tables, links
- **[patterns.md](references/patterns.md)**: Progressive disclosure, examples, navigation
- **[components.md](references/components.md)**: Astro Starlight MDX components (Tabs, Cards, Callouts, Steps, etc.)
