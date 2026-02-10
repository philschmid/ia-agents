# Formatting Conventions

Complete formatting reference for documentation elements.

> **Note**: For Astro Starlight projects, see [components.md](components.md) for the full MDX component reference with imports and props.

---

## Table of Contents

1. [Callouts and Admonitions](#callouts-and-admonitions)
2. [Code Blocks](#code-blocks)
3. [Tables](#tables)
4. [Links](#links)
5. [Headings](#headings)
6. [Lists](#lists)
7. [Custom Components](#custom-components)

---

## Callouts and Admonitions

Starlight uses the `<Aside>` component for callouts. See [components.md](components.md#asides-callouts) for the full API.

### Types and Usage

| Type | Starlight Syntax | Markdown Shorthand | When to Use |
|------|------------------|-------------------|-------------|
| **Note** | `<Aside>` or `<Aside type="note">` | `:::note` | Context, cross-refs, scope clarifications |
| **Tip** | `<Aside type="tip">` | `:::tip` | Best practices, optimization hints |
| **Caution** | `<Aside type="caution">` | `:::caution` | Important warnings, gotchas |
| **Danger** | `<Aside type="danger">` | `:::danger` | Critical warnings, destructive actions |

### Note Examples

**Using the component:**
```mdx
import { Aside } from '@astrojs/starlight/components';

<Aside>
This feature requires Gemini 2.5 Flash or later.
For older models, see [legacy approach](/docs/legacy).
</Aside>
```

**Using markdown shorthand (no import needed):**
```markdown
:::note
This feature requires Gemini 2.5 Flash or later.
For older models, see [legacy approach](/docs/legacy).
:::
```

Use for:
- Cross-references to related documentation
- Methodology notes or benchmark conditions
- Scope clarifications

### Tip Examples

```markdown
:::tip[The golden rule of clear prompting]
Show your prompt to a colleague. If they're confused, Gemini will likely be too.
:::
```

Use for:
- Actionable advice
- Optimization hints
- Best practice highlights

### Warning Examples

```markdown
:::caution
This action cannot be undone. Create a backup before proceeding.
:::

:::danger
Do not share your API key publicly!
:::
```

Use for:
- Breaking changes or deprecations
- Security considerations
- Irreversible operations

### Placement Rules

1. Place AFTER the concept introduction, not before
2. Keep to 2-3 sentences maximum
3. Use bold for emphasis within callouts
4. Never stack multiple callouts consecutively

---

## Code Blocks

### Language Specification

Always specify the language for syntax highlighting:

```markdown
```python
from google import genai
client = genai.Client()
```

```typescript
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({});
```

```bash
export GEMINI_API_KEY="your-key"
```

```json
{
  "model": "gemini-3-flash-preview",
  "input": "Hello"
}
```
```

### Multi-Language Examples with CodeTabs

Use `<CodeTabs>` for multi-language code examples. See [components.md](components.md#codetabs) for the full API.

```mdx
import CodeTabs from '@components/CodeTabs.astro';
import { TabItem } from '@astrojs/starlight/components';

<CodeTabs>
  <TabItem label="Shell">
    ```bash
    curl -X POST https://generativelanguage.googleapis.com/v1beta/interactions \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{"model": "gemini-3-flash-preview", "input": "Hello"}'
    ```
  </TabItem>
  <TabItem label="Python">
    ```python
    from google import genai

    client = genai.Client()
    interaction = client.interactions.create(
        model="gemini-3-flash-preview",
        input="Hello"
    )
    ```
  </TabItem>
  <TabItem label="TypeScript">
    ```typescript
    import { GoogleGenAI } from '@google/genai';

    const ai = new GoogleGenAI({});
    const interaction = await ai.interactions.create({
        model: 'gemini-3-flash-preview',
        input: 'Hello'
    });
    ```
  </TabItem>
</CodeTabs>
```

**Language Order**: Shell → Python → TypeScript → Java

### Code Annotations

```markdown
```python
from google import genai

client = genai.Client()  # Uses GEMINI_API_KEY env var by default

interaction = client.interactions.create(
    model="gemini-3-flash-preview",    # Use Flash for speed
    input="Explain quantum computing",
    generation_config={
        "thinking_level": "medium",     # Enable reasoning
        "max_output_tokens": 1024       # Limit response length
    }
)
```
```

Guidelines:
- Inline comments for non-obvious lines
- One comment per 5-10 lines maximum
- Explain "why" not "what"

### Expected Output Blocks

Show output in separate blocks:

```markdown
**Expected output:**

```json
{
  "id": "v1_ChdPU0F4YWFtNkFwS2kxZThQZ05lbXdROB...",
  "model": "gemini-3-flash-preview",
  "status": "completed",
  "outputs": [{"type": "text", "text": "Hello!"}],
  "usage": {"total_tokens": 25}
}
```
```

### Runnable Code Standards

All code examples should:
- Run without modification (except API key)
- Include necessary imports
- Use realistic variable names
- Handle common errors (for advanced examples)

---

## Tables

### Parameter Tables

```markdown
| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `model` | `string` | Yes | Model identifier (e.g., "gemini-3-flash-preview") |
| `input` | `string \| array` | Yes | Input content or array of content blocks |
| `tools` | `array` | No | Tool declarations. Default: `[]` |
| `stream` | `boolean` | No | Enable streaming. Default: `false` |
```

Conventions:
- Left-align all columns
- Code font for parameter names, types, values
- Include default values for optional parameters
- Mark required vs optional clearly

### Comparison Tables

```markdown
| Feature | Gemini 3 Flash | Gemini 3 Pro |
|---------|----------------|--------------|
| **Speed** | Fast (200ms) | Moderate (800ms) |
| **Context** | 1M tokens | 2M tokens |
| **Best for** | General tasks | Complex reasoning |
```

### Decision Tables

```markdown
| When you need... | Use... | Because... |
|------------------|--------|------------|
| Fast responses | Gemini 3 Flash | Optimized for latency |
| Complex reasoning | Gemini 3 Pro | Best at multi-step tasks |
| Cost efficiency | Gemini 2.5 Flash Lite | Lowest per-token cost |
```

### Table Formatting Rules

1. Keep cells concise (<15 words)
2. Use consistent column alignment
3. Bold key terms in first column
4. Use code font for technical values
5. Add caption above if context needed

---

## Links

### Internal Links

```markdown
<!-- Relative paths for internal docs -->
See [Function Calling](/docs/tools/function-calling) for details.

<!-- Fragment links within page -->
See [Error Handling](#error-handling) below.

<!-- Link with description -->
[Interactions API](/docs/api/interactions) — Complete API reference
```

### Cross-References

```markdown
<!-- Forward reference -->
See [Advanced Patterns](#advanced-patterns) for more options.

<!-- Backward reference -->
As mentioned in [Prerequisites](#prerequisites), you need...

<!-- Related content -->
For related features, see:
- [Thinking Mode](/docs/thinking)
- [Streaming](/docs/streaming)
```

### External Links

```markdown
<!-- External with description -->
[Google AI Studio](https://aistudio.google.com) — Get your API key

<!-- Reference links (for repeated URLs) -->
See the [official documentation][docs] for more.

[docs]: https://ai.google.dev/gemini-api/docs
```

### Next Steps with LinkCards

Use `<LinkCard>` and `<CardGrid>` for navigation. See [components.md](components.md#linkcard) for the full API.

```mdx
import { LinkCard, CardGrid } from '@astrojs/starlight/components';

## Next Steps

<CardGrid>
  <LinkCard 
    title="Function Calling" 
    href="/docs/tools"
    description="Extend Gemini with custom functions"
  />
  <LinkCard 
    title="Multimodal Input" 
    href="/docs/multimodal"
    description="Process images, audio, and video"
  />
</CardGrid>
```

---

## Headings

### Hierarchy

| Level | Use For | Example |
|-------|---------|---------|
| H1 | Page title only | `# Interactions API` |
| H2 | Major sections | `## Parameters` |
| H3 | Subsections | `### Required Parameters` |
| H4 | Rare; consider restructuring | `#### Error Codes` |

### Heading Style

```markdown
# Sentence Case for Page Titles

## Sentence case for sections

### Also sentence case
```

Use action phrases or questions:
- ✅ "How to implement function calling"
- ✅ "Choosing a model"
- ❌ "Implementation" (too vague)

### Anchor Links

Headings automatically generate anchors:

```markdown
## Error Handling

<!-- Links as #error-handling -->
See [Error Handling](#error-handling)
```

---

## Lists

### Bulleted Lists

Use for unordered information:

```markdown
Gemini excels at:

- Language tasks (writing, editing, translation)
- Reasoning and analysis
- Code generation and review
- **Multimodal understanding** (images, video, audio)
```

Guidelines:
- Parallel grammatical structure
- Bold first words if items start with concepts
- 7 items maximum (split longer lists)

### Numbered Lists

Use for sequential steps or ranked items:

```markdown
To create an interaction:

1. Initialize the client with your API key
2. Build the input content
3. Call `interactions.create()`
4. Handle the response
```

Guidelines:
- Start each with imperative verb
- Include explanatory sentence if needed
- Match numbering to actual sequence

### Definition Lists

For term-definition pairs:

```markdown
**Context window**
: The maximum number of tokens a model can process in a single request.

**Thinking level**
: Controls the depth of reasoning. Higher values mean more thorough analysis.
```

---

## Custom Components

For Astro Starlight projects, see [components.md](components.md) for the complete reference.

### Cards and CardGrid

Display content in styled cards. See [components.md](components.md#cards-and-cardgrid).

```mdx
import { Card, CardGrid } from '@astrojs/starlight/components';

<CardGrid>
  <Card title="Quickstart" icon="rocket">
    Get started in 5 minutes
  </Card>
  <Card title="API Reference" icon="document">
    Complete API documentation
  </Card>
</CardGrid>
```

Columns: Use `<CardGrid>` for responsive layouts

### Tabs

Platform-specific content. See [components.md](components.md#tabs-and-tabitem).

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

### Steps

Multi-step procedures. See [components.md](components.md#steps).

```mdx
import { Steps } from '@astrojs/starlight/components';

<Steps>
1. Install the SDK
   
   ```bash
   pip install google-genai
   ```

2. Set your API key
   
   ```bash
   export GEMINI_API_KEY="your-key"
   ```
</Steps>
```

### Collapsible Sections

Starlight uses HTML `<details>` for collapsible content:

```markdown
<details>
<summary>Full code example</summary>

```python
from google import genai

client = genai.Client()

# Create interaction with function calling
interaction = client.interactions.create(
    model="gemini-3-flash-preview",
    tools=[{
        "type": "function",
        "name": "get_weather",
        "description": "Get weather for a location",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {"type": "string"}
            }
        }
    }],
    input="What's the weather in Tokyo?"
)

# Handle function call response
if interaction.status == "requires_action":
    tool_call = interaction.outputs[0]
    print(f"Call {tool_call.name} with {tool_call.arguments}")
```

</details>
```

Use when:
- Examples longer than 30 lines
- Alternative approaches
- Detailed explanations that would disrupt flow
