# Documentation Patterns

Cross-cutting patterns for effective technical documentation.

> **Note**: Pattern examples use Astro Starlight components. See [components.md](components.md) for the complete MDX component reference with imports and props.

---

## Table of Contents

1. [Progressive Disclosure](#progressive-disclosure)
2. [The First Scroll Rule](#the-first-scroll-rule)
3. [Example Placement](#example-placement)
4. [Before/After Comparisons](#beforeafter-comparisons)
5. [Prerequisites Pattern](#prerequisites-pattern)
6. [Decision Guidance](#decision-guidance)
7. [Error Documentation](#error-documentation)
8. [Version and Compatibility Notes](#version-and-compatibility-notes)
9. [Navigation Patterns](#navigation-patterns)
10. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---

## Progressive Disclosure

Start simple, layer complexity. Don't overwhelm readers upfront.

### Structure

```
Level 1: Quick start (minimal viable example)
Level 2: How it works (conceptual explanation)  
Level 3: Basic usage (common use cases)
Level 4: Advanced usage (power features, edge cases)
Level 5: Troubleshooting (when things go wrong)
```

### Example Flow

```markdown
# Interactions API

## Quick Start
[5-line code example that works immediately]

## How It Works
[Conceptual explanation - what, not how]

## Basic Usage
[Common patterns most users need]

## Advanced Patterns
[Power user techniques]

## Troubleshooting
[Common issues and fixes]
```

### Progressive Complexity in Code

```python
# Quick start version (works immediately)
from google import genai

client = genai.Client()
interaction = client.interactions.create(
    model="gemini-3-flash-preview",
    input="Hello, how are you?"
)
print(interaction.outputs[-1].text)
```

```python
# Advanced version (full configuration)
from google import genai

client = genai.Client()
interaction = client.interactions.create(
    model="gemini-3-flash-preview",
    input=[
        {"role": "user", "content": "Hello"},
        {"role": "model", "content": "Hi there!"},
        {"role": "user", "content": "What's the weather?"}
    ],
    system_instruction="You are a helpful assistant.",
    tools=[{
        "type": "function",
        "name": "get_weather",
        "description": "Get weather for a location",
        "parameters": {"type": "object", "properties": {"location": {"type": "string"}}}
    }],
    generation_config={
        "temperature": 0.7,
        "thinking_level": "medium",
        "max_output_tokens": 1024
    }
)
```

---

## The First Scroll Rule

The first viewport must answer: **"What is this and why should I care?"**

### By Page Type

| Page Type | First Scroll Must Include |
|-----------|---------------------------|
| **Tutorial** | What you'll build + prerequisites list |
| **API Reference** | Brief description + minimal working code |
| **Concept** | Problem statement + solution overview |
| **Overview** | Value proposition + get started links |

### Tutorial First Scroll

```markdown
# Build a Chatbot with Gemini

Create a conversational AI assistant that remembers context and handles multi-turn conversations.

**What you'll do:**
1. Set up the Gemini SDK
2. Build a conversation loop
3. Add memory for context
```

### API Reference First Scroll

```markdown
# Interactions API

Create conversational interactions with Gemini models.

```python
from google import genai

client = genai.Client()
interaction = client.interactions.create(
    model="gemini-3-flash-preview",
    input="Hello, how are you?"
)
print(interaction.outputs[-1].text)
```
```

### Concept First Scroll

```markdown
# Stateful Interactions

Maintain conversation history automatically without manual state management.

**Problem:** Managing multi-turn conversation history is complex and error-prone.

**Solution:** Use `store=True` and `previous_interaction_id` to let the API handle state.
```

---

## Example Placement

Always follow: **Explanation → Example → Analysis**

### Pattern

```markdown
## Creating Interactions

The `interactions.create()` method sends input to Gemini and returns a response.

```python
from google import genai

client = genai.Client()
interaction = client.interactions.create(
    model="gemini-3-flash-preview",
    input="Explain quantum computing"
)
print(interaction.outputs[-1].text)
```

This code:
1. Uses the Gemini 3 Flash model for fast responses
2. Sends a simple text prompt as input
3. Prints the generated text from the response

The response contains the model's output in `interaction.outputs[-1].text`.
```

### Never Do This

```markdown
❌ Code without context:

```python
interaction = client.interactions.create(...)
```

❌ Explanation without code:

"You can create interactions by calling the create method with your parameters..."

❌ Code after lengthy explanation:

[500 words of explanation]
```python
# Reader has lost interest
```
```

---

## Before/After Comparisons

Show improvement through concrete examples.

### Prompt Comparison Table

```markdown
| Aspect | ❌ Unclear | ✅ Clear |
|--------|-----------|----------|
| **Prompt** | "Summarize this" | "Summarize this article in 3 bullet points, each under 20 words" |
| **Result** | Inconsistent length | Consistent 3 bullets, concise |
```

### Side-by-Side Code

```markdown
### Before: Manual History Management

```python
# Manually track all messages
history = []
history.append({"role": "user", "content": "Hello"})
response = client.interactions.create(
    model="gemini-3-flash-preview",
    input=history
)
history.append({"role": "model", "content": response.outputs[-1].text})
```

### After: Stateful Interactions

```python
# Let the API manage history
interaction = client.interactions.create(
    model="gemini-3-flash-preview",
    input="Hello",
    store=True
)

# Continue conversation automatically
follow_up = client.interactions.create(
    model="gemini-3-flash-preview",
    input="What did I just say?",
    previous_interaction_id=interaction.id
)
```
```

### Inline Annotations

```markdown
The clear prompt specifies:
- **Output format** (3 bullet points)
- **Length constraint** (under 20 words each)
- **Explicit task** (summarize, not analyze or critique)
```

---

## Prerequisites Pattern

Clear, actionable requirements at the start.

### Standard Format

```markdown
## Prerequisites

- **Python 3.10+** ([installation guide](link))
- A **Gemini API key** ([get one here](https://aistudio.google.com/apikey))
- The **google-genai SDK** (`pip install google-genai`)
- Optional: familiarity with REST APIs

:::note
Windows users: WSL2 is recommended for best compatibility.
:::
```

### Elements

| Element | Example | Why |
|---------|---------|-----|
| **Exact versions** | "Python 3.10+" | Prevents "works on my machine" |
| **Links** | "([get one here](link))" | Removes friction |
| **Optional items** | "Optional: familiarity with X" | Sets expectations |
| **Platform notes** | "Windows users: ..." | Platform-specific guidance |

### Prerequisite Checklist

```markdown
## Before You Begin

- [ ] Python 3.10+ installed (`python --version`)
- [ ] API key set as `GEMINI_API_KEY` environment variable
- [ ] 5 minutes for this tutorial
```

---

## Decision Guidance

Help readers choose between options.

### When to Use Matrix

```markdown
| When you need... | Use... | Example use cases |
|------------------|--------|-------------------|
| Fastest responses | Gemini 3 Flash | Chatbots, real-time apps |
| Best reasoning | Gemini 3 Pro | Research, complex analysis |
| Cost efficiency | Gemini 2.5 Flash Lite | High-volume batch processing |
```

### Explicit Recommendations

```markdown
**Our recommendation:** Start with Gemini 3 Flash for most applications. 
It offers the best balance of speed, capability, and cost.

Move to Gemini 3 Pro when you need:
- Multi-step reasoning over complex documents
- Tasks requiring deep analysis
- Higher accuracy on nuanced tasks
```

### Decision Tree

```markdown
## Choosing a Model

**Are responses time-sensitive?**
- Yes → Gemini 3 Flash (fastest)
- No → Continue below

**Is complex reasoning required?**
- Yes → Gemini 3 Pro
- No → Gemini 3 Flash

**Is cost the primary concern?**
- Yes → Gemini 2.5 Flash Lite
- No → Gemini 3 Flash
```

---

## Error Documentation

### Standard Error Format

```markdown
### RateLimitError

**Symptom:** Request fails with 429 status code

**Cause:** Too many requests in a short period

**Solution:**

1. Implement exponential backoff:
   ```python
   import time
   from google import genai
   from google.genai import errors
   
   client = genai.Client()
   
   for attempt in range(5):
       try:
           interaction = client.interactions.create(
               model="gemini-3-flash-preview",
               input="Hello"
           )
           break
       except errors.RateLimitError:
           time.sleep(2 ** attempt)
   ```

2. Check your [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)

**Prevention:** Use request queuing for high-volume applications
```

### Error Table

```markdown
| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| `AuthenticationError` | 401 | Invalid API key | Check key in AI Studio |
| `RateLimitError` | 429 | Too many requests | Implement backoff |
| `InvalidRequestError` | 400 | Malformed request | Validate parameters |
```

---

## Version and Compatibility Notes

### Feature Availability

```markdown
:::note
**Availability:** Thinking mode is available for Gemini 2.5 Flash, Gemini 3 Flash, and Gemini 3 Pro.
Not available for Gemini 2.5 Flash Lite.
:::
```

### Preview Features

```markdown
:::caution[Preview Feature]
This feature is in public preview. The API may change without notice.
Model names ending in `-preview` indicate preview status.

```python
# Preview models may be updated
interaction = client.interactions.create(
    model="gemini-3-flash-preview",  # Preview version
    input="Hello"
)
```
:::
```

### Deprecation Notices

```markdown
:::caution[Deprecated]
The `generateContent` endpoint is deprecated. Use the Interactions API instead.

```python
# Old (deprecated)
response = client.generate_content(prompt="Hello")

# New (recommended)
interaction = client.interactions.create(
    model="gemini-3-flash-preview",
    input="Hello"
)
```
:::
```

---

## Navigation Patterns

### Next Steps Cards

Use Starlight's `<LinkCard>` and `<CardGrid>` for navigation. See [components.md](components.md#linkcard).

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
    title="Streaming" 
    href="/docs/streaming"
    description="Get responses in real-time"
  />
</CardGrid>
```

### See Also Section

```markdown
## See Also

- [Thinking Mode](/docs/thinking) — Enhanced reasoning capabilities
- [Rate Limits](/docs/limits) — Understanding API quotas
- [Examples](/docs/examples) — Sample applications
```

### Inline Navigation

```markdown
For more on error handling, see [Error Reference](/docs/errors).

This feature works with [Function Calling](/docs/tools) and [Streaming](/docs/streaming).
```

---

## Anti-Patterns to Avoid

### Wall of Text

```markdown
❌ Bad
[Three paragraphs explaining a concept before any code]

✅ Good
[One sentence] + [Code example] + [Brief explanation]
```

### Buried Prerequisites

```markdown
❌ Bad
[Start with explanation]
[More explanation]
[Prerequisites at the bottom]

✅ Good
## Prerequisites
[List at the top, before any content]
```

### Marketing Language

```markdown
❌ Bad
"Our revolutionary AI technology transforms your workflow..."

✅ Good
"Gemini generates responses based on your prompts."
```

### Missing Trade-offs

```markdown
❌ Bad
"Thinking mode improves performance."

✅ Good
"Thinking mode improves reasoning accuracy by up to 30%, 
but increases latency and token usage."
```

### Orphan Pages

```markdown
❌ Bad
[Content that ends abruptly without navigation]

✅ Good
## Next Steps
[Links to related content]
```

### Undocumented Limitations

```markdown
❌ Bad
[Feature works great!]

✅ Good
## Limitations
- Maximum context: 1M tokens (Gemini 3 Flash)
- Background mode required for tasks >5 minutes
- May timeout for very long generations
```
