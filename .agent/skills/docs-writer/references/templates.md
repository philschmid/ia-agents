# Documentation Templates

Ready-to-use templates for each documentation page type. Copy and customize.

> **Note**: These templates use Astro Starlight components. See [components.md](components.md) for the complete MDX component reference with imports and props.

---

## Table of Contents

1. [Tutorial/Quickstart Template](#tutorialquickstart-template)
2. [API Reference Template](#api-reference-template)
3. [Concept/Guide Template](#conceptguide-template)
4. [Overview Page Template](#overview-page-template)
5. [How-To Guide Template](#how-to-guide-template)
6. [Troubleshooting Template](#troubleshooting-template)

---

## Tutorial/Quickstart Template

Use for hands-on learning experiences where users build something.

> **Steps pattern choice**: This template uses H2 sections (`## Step 1:`) for substantial steps with multiple code blocks. For simpler sequential steps within a section, use the `<Steps>` component instead (see [How-To Guide Template](#how-to-guide-template)).

```mdx
---
title: "[Feature] Quickstart"
description: "[What you'll build and the benefit]"
---

import CodeTabs from '@components/CodeTabs.astro';
import { TabItem, Steps, LinkCard, CardGrid } from '@astrojs/starlight/components';

[One sentence: what you'll build and the benefit]

**What you'll do:**

1. [First outcome]
2. [Second outcome]
3. [Third outcome]

---

## Prerequisites

- **Python 3.10+** ([installation guide](link))
- A **Gemini API key** ([get one here](https://aistudio.google.com/apikey))
- Optional: familiarity with [concept]

---

## Step 1: [Action verb] [object]

[Brief explanation of why this step matters]

<CodeTabs>
  <TabItem label="Shell">
    ```bash
    pip install google-genai
    ```
  </TabItem>
  <TabItem label="Python">
    ```python
    from google import genai

    client = genai.Client()
    ```
  </TabItem>
</CodeTabs>

[1-2 sentences explaining what this code does]

---

## Step 2: [Action verb] [object]

[Explanation]

```python
interaction = client.interactions.create(
    model="gemini-3-flash-preview",
    input="Hello, how are you?"
)
print(interaction.outputs[-1].text)
```

**Expected output:**

```json
{
  "id": "v1_abc123...",
  "model": "gemini-3-flash-preview",
  "status": "completed",
  "outputs": [
    {
      "type": "text",
      "text": "Hello! I'm doing well. How can I help you today?"
    }
  ]
}
```

---

## Step 3: [Action verb] [object]

[Explanation and code]

---

## Verify Your Setup

[How to confirm everything works]

```bash
python your_script.py
```

You should see: [expected output description]

---

## Next Steps

<CardGrid>
  <LinkCard title="[Next Topic]" href="/docs/path" description="[Brief description]" />
  <LinkCard title="[Related Feature]" href="/docs/path" description="[Brief description]" />
</CardGrid>
```

---

## API Reference Template

Use for parameter documentation and response formats.

```mdx
---
title: "[API/Tool Name]"
description: "[One sentence description of what it does]"
---

import { Tabs, TabItem, LinkCard, CardGrid, Badge } from '@astrojs/starlight/components';

# [API/Tool Name] <Badge text="Stable" variant="success" />

[One sentence description of what it does]

---

## Model Compatibility

| Model | Supported | Notes |
|-------|-----------|-------|
| Gemini 3 Flash | ✅ | Recommended for speed |
| Gemini 3 Pro | ✅ | Best for complex tasks |
| Gemini 2.5 Flash | ✅ | Balanced performance |

---

## Quick Start

```python
from google import genai

client = genai.Client()
interaction = client.interactions.create(
    model="gemini-3-flash-preview",
    input="Your prompt here"
)
print(interaction.outputs[-1].text)
```

---

## Parameters

### Required Parameters

| Parameter | Type | Description |
|:----------|:-----|:------------|
| `model` | `string` | Model identifier (e.g., "gemini-3-flash-preview") |
| `input` | `string \| array` | The input content for the interaction |

### Optional Parameters

| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `system_instruction` | `string` | `null` | System-level instructions for the model |
| `tools` | `array` | `[]` | Tool declarations the model may call |
| `generation_config` | `object` | `{}` | Configuration for generation. See [Config Options](#config-options). |
| `stream` | `boolean` | `false` | Whether to stream the response |

---

## Response Format

```json
{
  "id": "v1_ChdPU0F4YWFtNkFwS2kxZThQZ05lbXdROB...",
  "model": "gemini-3-flash-preview",
  "status": "completed",
  "object": "interaction",
  "created": "2025-01-14T12:25:15Z",
  "outputs": [
    {
      "type": "text",
      "text": "Response content here"
    }
  ],
  "usage": {
    "total_input_tokens": 100,
    "total_output_tokens": 50,
    "total_tokens": 150
  }
}
```

### Response Fields

| Field | Type | Description |
|:------|:-----|:------------|
| `id` | `string` | Unique interaction identifier |
| `status` | `string` | Status: `completed`, `in_progress`, `requires_action`, `failed` |
| `outputs` | `array` | Array of content blocks |
| `usage` | `object` | Token usage information |

---

## Error Handling

### Common Errors

| Error Code | Cause | Solution |
|:-----------|:------|:---------|
| `400` | Invalid parameters | Check required fields |
| `401` | Invalid API key | Verify your API key |
| `429` | Rate limit exceeded | Implement backoff |

```python
from google.genai import errors

try:
    interaction = client.interactions.create(
        model="gemini-3-flash-preview",
        input="Your prompt"
    )
except errors.APIError as e:
    print(f"API error: {e.status_code}")
```

---

## Examples

### Basic Usage

```python
# Minimal example
interaction = client.interactions.create(
    model="gemini-3-flash-preview",
    input="What is the capital of France?"
)
print(interaction.outputs[-1].text)
```

### Advanced Usage

```python
# Full-featured example with all options
interaction = client.interactions.create(
    model="gemini-3-flash-preview",
    input="Analyze this code and suggest improvements",
    system_instruction="You are a senior software engineer.",
    generation_config={
        "temperature": 0.7,
        "max_output_tokens": 1024,
        "thinking_level": "medium"
    }
)
```

---

## Best Practices

- **Do** use specific model versions for production stability
- **Do** implement error handling and retries
- **Don't** send sensitive data without proper security measures

---

## Next Steps

<CardGrid>
  <LinkCard title="[Related API]" href="/docs/api/related" description="[Description]" />
</CardGrid>
```

---

## Concept/Guide Template

Use for explaining ideas, patterns, or best practices.

```mdx
---
title: "[Concept Name]"
description: "[Hook: what this is and why it matters]"
---

import { Aside, LinkCard, CardGrid } from '@astrojs/starlight/components';

[Hook paragraph: what this is and why it matters]

---

## Why Use [Concept]?

[Problem statement]

Use [concept] when you need to:

- [Benefit/use case 1]
- [Benefit/use case 2]
- [Benefit/use case 3]

**Don't use** when:

- [Anti-pattern 1]
- [Anti-pattern 2]

---

## How It Works

[Conceptual explanation - focus on the "what" and "why", not implementation]

1. [Step 1 of the process]
2. [Step 2 of the process]
3. [Step 3 of the process]

<Aside>
[Important clarification or cross-reference]
</Aside>

---

## How to Implement

### Basic Implementation

```python
from google import genai

client = genai.Client()

# Multi-turn conversation using stateful mode
interaction = client.interactions.create(
    model="gemini-3-flash-preview",
    input="Hello!",
    store=True  # Enable stateful mode
)

# Continue the conversation
follow_up = client.interactions.create(
    model="gemini-3-flash-preview",
    input="What did I just say?",
    previous_interaction_id=interaction.id
)
```

[Explain what this code does]

### Full Implementation

```python
# Complete example with error handling
from google import genai
from google.genai import errors

client = genai.Client()

try:
    interaction = client.interactions.create(
        model="gemini-3-flash-preview",
        input="Explain quantum computing",
        generation_config={
            "thinking_level": "high",
            "max_output_tokens": 2048
        }
    )
    print(interaction.outputs[-1].text)
except errors.APIError as e:
    print(f"Error: {e}")
```

---

## Examples

### Example 1: [Simple Use Case]

[Context for when you'd use this]

```python
interaction = client.interactions.create(
    model="gemini-3-flash-preview",
    input="Summarize this article in 3 bullet points"
)
```

### Example 2: [Complex Use Case]

[Context]

```python
# Function calling example
interaction = client.interactions.create(
    model="gemini-3-flash-preview",
    tools=[{
        "type": "function",
        "name": "get_weather",
        "description": "Get current weather for a location",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {"type": "string"}
            },
            "required": ["location"]
        }
    }],
    input="What's the weather in Boston?"
)
```

---

## Advanced Techniques

### [Advanced Pattern 1]

[Explanation]

```python
# Streaming responses
for event in client.interactions.create(
    model="gemini-3-flash-preview",
    input="Write a long story",
    stream=True
):
    if event.event_type == "content.delta":
        print(event.delta.text, end="")
```

### [Advanced Pattern 2]

[Explanation]

---

## Limitations

- [Limitation 1]
- [Limitation 2]
- [Workaround for limitation 2]

---

## Best Practices

| Do | Don't |
|----|-------|
| [Good practice] | [Anti-pattern] |
| [Good practice] | [Anti-pattern] |

---

## Next Steps

<CardGrid>
  <LinkCard title="[Related Concept]" href="/docs/concept" description="[Description]" />
</CardGrid>
```

---

## Overview Page Template

Use for landing pages and feature hubs.

```mdx
---
title: "[Product/Feature Name]"
description: "[Value proposition: one sentence stating what it is and the main benefit]"
---

import { Card, CardGrid, LinkCard, Aside } from '@astrojs/starlight/components';

[Value proposition: one sentence stating what it is and the main benefit]

<Aside type="tip">
**Latest update:** [Recent news or model announcement with link]
</Aside>

---

## Get Started

<CardGrid>
  <Card title="Quickstart" icon="rocket">
    Get up and running in 5 minutes
  </Card>
  <Card title="API Reference" icon="document">
    Complete API documentation
  </Card>
  <Card title="Examples" icon="puzzle">
    Sample code and use cases
  </Card>
</CardGrid>

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Multimodal** | Process text, images, audio, video, and documents |
| **Function Calling** | Extend capabilities with custom tools |
| **Thinking Mode** | Enhanced reasoning with configurable depth |
| **Streaming** | Real-time response streaming |

---

## Quick Example

```python
from google import genai

client = genai.Client()
interaction = client.interactions.create(
    model="gemini-3-flash-preview",
    input="Explain the Gemini API in one paragraph"
)
print(interaction.outputs[-1].text)
```

---

## Learn More

<CardGrid>
  <LinkCard title="[Deep Dive Topic]" href="/docs/topic" description="[Description]" />
  <LinkCard title="[Best Practices]" href="/docs/practices" description="[Description]" />
</CardGrid>
```

---

## How-To Guide Template

Use for task-oriented articles solving specific problems.

```mdx
---
title: "How to [Accomplish Task]"
description: "[One sentence stating what the reader will achieve]"
---

import { Steps, Tabs, TabItem } from '@astrojs/starlight/components';

[One sentence stating what the reader will achieve]

---

## When to Use This

Use this approach when:

- [Scenario 1]
- [Scenario 2]

---

## Prerequisites

- Python 3.10+ with `google-genai` installed
- A Gemini API key set as `GEMINI_API_KEY`

---

## Steps

<Steps>
1. **[First Action]**
   
   [Explanation]
   
   ```python
   from google import genai

   client = genai.Client()
   ```

2. **[Second Action]**
   
   [Explanation]
   
   ```python
   interaction = client.interactions.create(
       model="gemini-3-flash-preview",
       input=[
           {"type": "text", "text": "What's in this image?"},
           {"type": "image", "data": base64_image, "mime_type": "image/png"}
       ]
   )
   ```

3. **[Third Action]**
   
   [Explanation]
</Steps>

---

## Verification

[How to confirm success]

```bash
python your_script.py
```

**Expected result:** [Description]

---

## Troubleshooting

### [Common Issue 1]

**Symptom:** [What the user sees]

**Solution:** [How to fix]

### [Common Issue 2]

**Symptom:** [What the user sees]

**Solution:** [How to fix]

---

## Next Steps

- [Follow-up task with link]
- [Related guide with link]
```

---

## Troubleshooting Template

Use for debugging guides and FAQ pages.

```mdx
---
title: "Troubleshooting [Feature/Area]"
description: "Common issues and solutions for [area]"
---

import { Aside } from '@astrojs/starlight/components';

Common issues and solutions for [area].

---

## [Issue Category 1]

### [Error Name/Symptom]

**Symptom:** [What the user sees]

**Cause:** [Why this happens]

**Solution:**

1. [Step 1]
2. [Step 2]

```python
# Example fix
from google import genai
from google.genai import errors

try:
    interaction = client.interactions.create(...)
except errors.RateLimitError:
    time.sleep(60)  # Wait and retry
```

---

### [Another Error]

**Symptom:** [Description]

**Cause:** [Explanation]

**Solution:** [Fix]

---

## [Issue Category 2]

### [Error Name]

[Same pattern as above]

---

## Getting Help

<Aside>
If you're still stuck:

- Check the [documentation](https://ai.google.dev/gemini-api/docs)
- Search [community forums](https://discuss.ai.google.dev)
- Report issues on [GitHub](https://github.com/googleapis/python-genai)
</Aside>
```
