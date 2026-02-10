# Documentation Style Guide

Detailed writing principles synthesized from Anthropic Claude, OpenAI Codex, and Google Gemini documentation.

> **Note**: For Astro Starlight projects, see [components.md](components.md) for the complete MDX component reference with imports and props.

---

## Table of Contents

1. [Voice and Tone](#voice-and-tone)
2. [Sentence Structure](#sentence-structure)
3. [Technical Term Introduction](#technical-term-introduction)
4. [Quantified Guidance](#quantified-guidance)
5. [Trade-off Documentation](#trade-off-documentation)
6. [Scannability](#scannability)
7. [Platform-Specific Considerations](#platform-specific-considerations)

---

## Voice and Tone

### Core Characteristics

| Characteristic | Description | Example |
|---------------|-------------|---------|
| **Direct** | State facts directly, avoid hedging | ✅ "Use X for Y" ❌ "You might want to consider using X" |
| **Confident** | Be authoritative without arrogance | ✅ "Gemini excels at..." ❌ "Gemini is the best at..." |
| **Active** | Use active voice, imperative verbs | ✅ "Create an interaction" ❌ "An interaction should be created" |
| **Conversational** | Write like explaining to a colleague | ✅ "Think of it as..." ❌ "The system operates by..." |
| **Inclusive** | Use "you" to invite participation | ✅ "You can configure..." ❌ "The developer can configure..." |

### Imperative vs. Passive

Documentation types require different voices:

| Doc Type | Voice | Example |
|----------|-------|---------|
| **Tutorial** | Imperative | "Install the SDK", "Run the command" |
| **API Reference** | Declarative | "Returns the interaction object", "Accepts a string" |
| **Concept** | Explanatory | "The system caches responses to reduce latency" |

### Confidence Levels

Match confidence to certainty:

```markdown
# High certainty (proven patterns)
"Use thinking mode to improve reasoning accuracy by up to 30%."

# Moderate certainty (recommended approaches)
"We recommend starting with Gemini 3 Flash for most use cases."

# Low certainty (emerging patterns)
"Early results suggest that chain-of-thought prompting may improve accuracy."
```

---

## Sentence Structure

### Lead with Purpose

Every section's first sentence states exactly what it covers:

```markdown
# Good
"The Interactions API simplifies multi-turn conversations by managing state automatically."

# Bad
"In modern API development, there are many ways to handle conversations. One such method..."
```

### Length Guidelines

| Element | Target | Max |
|---------|--------|-----|
| Sentences | 15-20 words | 25 words |
| Paragraphs | 2-3 sentences | 5 sentences |
| Bullet points | 10-15 words | One line |
| Code comments | 5-10 words | One line |

### Parallel Structure

Maintain consistent grammatical structure in lists:

```markdown
# Good (all imperatives)
- Create a new interaction
- Configure the parameters
- Run the request

# Bad (mixed structures)
- Create a new interaction
- The parameters should be configured
- Testing your changes
```

### Transitions

Use explicit transitions between sections:

```markdown
# Sequential
"First... Next... Finally..."
"After [action], you can..."

# Conditional
"If you need X, see [link]."
"For production use, consider..."

# Contrastive
"Unlike X, this approach..."
"While Y works for most cases, Z is better for..."
```

---

## Technical Term Introduction

### Context-First Pattern

Introduce what something does before naming it:

```markdown
# Good
"To maintain conversation history automatically, use stateful interactions."

# Bad
"Use stateful interactions to maintain conversation history automatically."
```

### Acronym Expansion

Always spell out on first use:

```markdown
# First use
"The Model Context Protocol (MCP) enables tool integration."

# Subsequent uses
"MCP servers expose tools to the model."
```

### Inline Definitions

Define terms immediately using colons or em-dashes:

```markdown
# Colon pattern
"Context window: the maximum number of tokens a model can process."

# Em-dash pattern
"The context window—maximum tokens the model processes—determines..."

# Parenthetical
"Set the temperature (randomness of output) to 0 for deterministic responses."
```

### Jargon Handling

| Situation | Approach |
|-----------|----------|
| Common dev terms | Use directly: "API", "SDK", "JSON" |
| Platform-specific terms | Define on first use: "tools (functions Gemini can call)" |
| Domain terms | Always define: "hallucination (generating false information)" |

---

## Quantified Guidance

Be specific. Developers trust numbers over vague claims.

### Numeric Precision

```markdown
# Good
"Place documents longer than ~20K tokens at the start of your input."
"Thinking mode can improve accuracy by up to 30%."
"Responses typically arrive in 200-800ms."

# Bad
"Place long documents at the start."
"Thinking mode improves accuracy significantly."
"Responses arrive quickly."
```

### Version Specificity

```markdown
# Good
"Requires Python 3.10+ and google-genai SDK 1.0+"
"Available in Gemini 2.5 Flash and later"
"Introduced in API version v1beta"

# Bad
"Requires a recent version of Python"
"Available in newer Gemini models"
"Recently introduced"
```

### Performance Claims

Always include conditions for benchmarks:

```markdown
# Good
"Achieves 94% accuracy on MMLU (5-shot, English)."

# Bad
"Achieves 94% accuracy."
```

---

## Trade-off Documentation

Developers trust honest documentation. Always document:

### When NOT to Use

```markdown
## When to use structured outputs

Use structured outputs when:
- You need guaranteed JSON schema compliance
- Parsing reliability is critical

**Don't use** when:
- You need maximum creativity in responses
- Schema flexibility is required
```

### Limitations Sections

```markdown
## Limitations

- Maximum context window: 1M tokens (Gemini 2.5 Flash)
- Background mode required for long-running agents
- May produce verbose outputs for simple queries
```

### Trade-off Tables

| Feature | Benefit | Trade-off |
|---------|---------|-----------|
| Thinking mode | Better reasoning | Higher latency, more tokens |
| Streaming | Faster first token | Complex error handling |
| Stateful mode | Automatic history | Server-side state management |

---

## Scannability

### Hierarchy Principles

1. **H1**: Page title only (one per page)
2. **H2**: Major sections (visible in TOC)
3. **H3**: Subsections within major sections
4. **H4**: Rarely used; consider restructuring

### Formatting for Scanning

| Element | Use For |
|---------|---------|
| **Bold** | Key terms, important values, first use of concepts |
| *Italics* | Emphasis, book/paper titles |
| `Code` | Commands, parameters, file names, function names |
| > Blockquotes | Quotations, callouts without formal admonition |

### Visual Chunking

- Break after every 3-5 paragraphs
- Use horizontal rules between major topics
- Tables for any parallel information
- Code blocks for any executable content

---

## Platform-Specific Considerations

### Multi-Platform Documentation

When writing for multiple platforms (Python, TypeScript, Shell), use the custom `<CodeTabs>` component:

```mdx
import CodeTabs from '@components/CodeTabs.astro';
import { TabItem } from '@astrojs/starlight/components';

<CodeTabs>
  <TabItem label="Python">
    ```python
    from google import genai

    client = genai.Client()
    ```
  </TabItem>
  <TabItem label="TypeScript">
    ```typescript
    import { GoogleGenAI } from '@google/genai';

    const ai = new GoogleGenAI({});
    ```
  </TabItem>
</CodeTabs>
```

**Order convention**: Shell → Python → TypeScript → Java

### OS-Specific Instructions

Use `<Tabs>` for OS-specific content:

```mdx
import { Tabs, TabItem } from '@astrojs/starlight/components';

<Tabs>
  <TabItem label="macOS/Linux">
    ```bash
    export GEMINI_API_KEY="your-key"
    ```
  </TabItem>
  <TabItem label="Windows">
    ```powershell
    $env:GEMINI_API_KEY="your-key"
    ```
  </TabItem>
</Tabs>
```