# Astro Starlight Components

Complete reference for MDX components available in Astro Starlight documentation sites.

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Callouts](#callouts)
3. [Tabs and TabItem](#tabs-and-tabitem)
4. [CodeTabs](#codetabs) ← **Use for code examples**
5. [Code](#code)
6. [Cards and CardGrid](#cards-and-cardgrid)
7. [LinkCard](#linkcard)
8. [LinkButton](#linkbutton)
9. [Badge](#badge)
10. [Steps](#steps)
11. [FileTree](#filetree)
12. [Icon](#icon)
13. [Component Import Patterns](#component-import-patterns)

---

## Quick Reference

| Component | Import | Purpose |
|-----------|--------|---------|
| `Note`, `Tip`, `Warning` | `@components/callouts/` | **Callouts** (custom components) |
| `Tabs`, `TabItem` | `@astrojs/starlight/components` | Tabbed content (non-code) |
| `CodeTabs` | `@components/CodeTabs.astro` | **Multi-language code examples** (custom) |
| `Code` | `@astrojs/starlight/components` | Syntax-highlighted code from variables |
| `Card`, `CardGrid` | `@astrojs/starlight/components` | Content cards in grid layout |
| `LinkCard` | `@astrojs/starlight/components` | Prominent link cards |
| `LinkButton` | `@astrojs/starlight/components` | Call-to-action buttons |
| `Badge` | `@astrojs/starlight/components` | Status/category labels |
| `Steps` | `@astrojs/starlight/components` | Styled numbered steps |
| `FileTree` | `@astrojs/starlight/components` | Directory structure display |
| `Icon` | `@astrojs/starlight/components` | Built-in icons |

---

## Callouts

Display secondary information alongside main content. This project uses **custom callout components** instead of Starlight's built-in Aside.

### Import

```javascript
// From root-level docs (e.g., quickstart.mdx)
import Note from '../../components/callouts/Note.astro';
import Tip from '../../components/callouts/Tip.astro';
import Warning from '../../components/callouts/Warning.astro';

// From subdirectory docs (e.g., concepts/session.mdx, guides/streaming.mdx)
import Note from '../../../components/callouts/Note.astro';
import Tip from '../../../components/callouts/Tip.astro';
import Warning from '../../../components/callouts/Warning.astro';
```

### Types

| Component | Color | Usage |
|-----------|-------|-------|
| `<Note>` | Blue | General information, cross-references, methodology notes |
| `<Tip>` | Neutral | Best practices, shortcuts, optimization hints |
| `<Warning>` | Amber | Breaking changes, risks, security issues, destructive actions |

### Usage

```mdx
// For subdirectory docs (concepts/, guides/)
import Note from '../../../components/callouts/Note.astro';
import Tip from '../../../components/callouts/Tip.astro';
import Warning from '../../../components/callouts/Warning.astro';

<Note>
  General information or cross-reference.
</Note>

<Tip>
  A helpful tip for better results.
</Tip>

<Warning>
  Be careful when using this feature!
</Warning>
```

### With Custom Title

```mdx
<Note title="Important">
  This note has a custom title.
</Note>

<Tip title="Performance">
  Optimization advice.
</Tip>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | No | Optional custom title |

---

## Tabs and TabItem

Create tabbed interfaces for grouped content.

> **For code examples**: Use the custom `<CodeTabs>` component instead (see [CodeTabs](#codetabs) below). It provides optimized styling for multi-language code snippets.

### Import

```javascript
import { Tabs, TabItem } from '@astrojs/starlight/components';
```

### Basic Usage

Use `<Tabs>` for non-code content (e.g., OS-specific instructions, alternative approaches):

```mdx
import { Tabs, TabItem } from '@astrojs/starlight/components';

<Tabs>
  <TabItem label="macOS/Linux">
    Open Terminal and run the commands.
  </TabItem>
  <TabItem label="Windows">
    Open PowerShell and run the commands.
  </TabItem>
</Tabs>
```

### Synced Tabs

Keep multiple tab groups synchronized across the page:

```mdx
import { Tabs, TabItem } from '@astrojs/starlight/components';

{/* First tab group */}
<Tabs syncKey="os">
  <TabItem label="macOS">macOS instructions</TabItem>
  <TabItem label="Windows">Windows instructions</TabItem>
</Tabs>

{/* Second tab group - stays in sync with the first */}
<Tabs syncKey="os">
  <TabItem label="macOS">More macOS content</TabItem>
  <TabItem label="Windows">More Windows content</TabItem>
</Tabs>
```

### Props

**`<Tabs>`**

| Prop | Type | Description |
|------|------|-------------|
| `syncKey` | `string` | Sync selected tab across groups with same key |

**`<TabItem>`**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string` | Yes | Tab label text |
| `icon` | `string` | No | Icon name (from Starlight's built-in icons) |

---

## CodeTabs

**Custom component for multi-language code examples.** Always use this instead of `<Tabs>` when displaying code snippets in multiple languages.

### Import

```javascript
import CodeTabs from '@components/CodeTabs.astro';
import { TabItem } from '@astrojs/starlight/components';
```

### Component Source

```astro
---
import { Tabs } from '@astrojs/starlight/components';
---

<div class="sl-code-tabs">
  <Tabs>
    <slot />
  </Tabs>
</div>
```

### Usage

```mdx
import CodeTabs from '@components/CodeTabs.astro';
import { TabItem } from '@astrojs/starlight/components';

<CodeTabs>
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
  <TabItem label="REST">
    ```bash
    curl -X POST https://generativelanguage.googleapis.com/v1beta/interactions \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -d '{"model": "gemini-3-flash-preview", "input": "Hello"}'
    ```
  </TabItem>
</CodeTabs>
```

### Language Order Convention

When showing multi-language examples, use this order:

1. **Shell/REST** (curl commands)
2. **Python**
3. **TypeScript/JavaScript**
4. **Java** (if applicable)

### When to Use

| Use `<CodeTabs>` | Use `<Tabs>` |
|------------------|--------------|
| Multi-language code examples | OS-specific instructions |
| API examples (Python, TypeScript, REST) | Alternative approaches (not code) |
| SDK installation commands | Content tabs (concepts, options) |

---

## Code

Display syntax-highlighted code from variables or imported files.

### Import

```javascript
import { Code } from '@astrojs/starlight/components';
```

### Usage with Variables

```mdx
import { Code } from '@astrojs/starlight/components';

export const exampleCode = `from google import genai

client = genai.Client()
interaction = client.interactions.create(
    model="gemini-3-flash-preview",
    input="Hello, world!"
)`;

<Code code={exampleCode} lang="python" title="example.py" />
```

### Import from File

```mdx
import { Code } from '@astrojs/starlight/components';
import exampleCode from '../examples/example.py?raw';

<Code code={exampleCode} lang="python" title="example.py" />
```

### Line Highlighting

```mdx
<Code 
  code={exampleCode} 
  lang="python" 
  mark={['genai', 'interactions']}
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `code` | `string` | The code to display |
| `lang` | `string` | Language for syntax highlighting |
| `title` | `string` | Filename to display above code |
| `mark` | `string[]` | Words/phrases to highlight |
| `ins` | `number[] \| string` | Lines to mark as inserted |
| `del` | `number[] \| string` | Lines to mark as deleted |
| `frame` | `'code' \| 'terminal' \| 'none'` | Frame style |

---

## Cards and CardGrid

Display content in styled card boxes.

### Import

```javascript
import { Card, CardGrid } from '@astrojs/starlight/components';
```

### Single Card

```mdx
import { Card } from '@astrojs/starlight/components';

<Card title="Getting Started" icon="rocket">
  Learn how to set up your first project.
</Card>
```

### Card Grid

```mdx
import { Card, CardGrid } from '@astrojs/starlight/components';

<CardGrid>
  <Card title="Quickstart" icon="rocket">
    Get up and running in 5 minutes.
  </Card>
  <Card title="API Reference" icon="document">
    Complete API documentation.
  </Card>
  <Card title="Examples" icon="puzzle">
    Sample code and use cases.
  </Card>
</CardGrid>
```

### Staggered Cards

Create visual hierarchy with offset cards:

```mdx
<CardGrid stagger>
  <Card title="Step 1" icon="pencil">
    First action to take.
  </Card>
  <Card title="Step 2" icon="add-document">
    Second action to take.
  </Card>
</CardGrid>
```

### Props

**`<Card>`**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | Yes | Card heading |
| `icon` | `string` | No | Icon name from [Starlight icons](https://starlight.astro.build/reference/icons/) |

**`<CardGrid>`**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `stagger` | `boolean` | `false` | Offset cards for visual hierarchy |

---

## LinkCard

Display links prominently as cards.

### Import

```javascript
import { LinkCard, CardGrid } from '@astrojs/starlight/components';
```

### Basic Usage

```mdx
import { LinkCard } from '@astrojs/starlight/components';

<LinkCard 
  title="Interactions API" 
  href="/docs/api/interactions" 
/>
```

### With Description

```mdx
<LinkCard
  title="Interactions API"
  href="/docs/api/interactions"
  description="Create conversational interactions with Gemini models."
/>
```

### Grid of Link Cards

```mdx
import { LinkCard, CardGrid } from '@astrojs/starlight/components';

<CardGrid>
  <LinkCard title="Quickstart" href="/quickstart" />
  <LinkCard title="API Reference" href="/api" />
</CardGrid>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | Yes | Card title |
| `href` | `string` | Yes | Link destination |
| `description` | `string` | No | Additional description text |

---

## LinkButton

Call-to-action buttons for important links.

### Import

```javascript
import { LinkButton } from '@astrojs/starlight/components';
```

### Variants

```mdx
import { LinkButton } from '@astrojs/starlight/components';

<LinkButton href="/quickstart">Get Started</LinkButton>
<LinkButton href="/api" variant="secondary">API Reference</LinkButton>
<LinkButton href="/examples" variant="minimal">See Examples</LinkButton>
```

### With Icons

```mdx
<LinkButton href="/quickstart" icon="rocket">
  Get Started
</LinkButton>

<LinkButton href="/github" icon="github" iconPlacement="end">
  Star on GitHub
</LinkButton>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `href` | `string` | Required | Link destination |
| `variant` | `'primary' \| 'secondary' \| 'minimal'` | `'primary'` | Button style |
| `icon` | `string` | None | Icon name |
| `iconPlacement` | `'start' \| 'end'` | `'start'` | Icon position |

---

## Badge

Display small status or category labels.

### Import

```javascript
import { Badge } from '@astrojs/starlight/components';
```

### Variants

```mdx
import { Badge } from '@astrojs/starlight/components';

<Badge text="New" />
<Badge text="Note" variant="note" />
<Badge text="Success" variant="success" />
<Badge text="Tip" variant="tip" />
<Badge text="Caution" variant="caution" />
<Badge text="Danger" variant="danger" />
```

### Sizes

```mdx
<Badge text="Small" size="small" />
<Badge text="Medium" size="medium" />
<Badge text="Large" size="large" />
```

### Inline Usage

```mdx
## Interactions API <Badge text="New" variant="tip" />

The new Interactions API provides...
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | Required | Badge text |
| `variant` | `'note' \| 'tip' \| 'caution' \| 'danger' \| 'success'` | Default/accent | Color variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'small'` | Badge size |

---

## Steps

Style numbered lists as step-by-step guides.

### Import

```javascript
import { Steps } from '@astrojs/starlight/components';
```

### Usage

```mdx
import { Steps } from '@astrojs/starlight/components';

<Steps>
1. Install the SDK
   
   ```bash
   pip install google-genai
   ```

2. Set up authentication
   
   ```bash
   export GEMINI_API_KEY="your-key"
   ```

3. Create your first interaction
   
   ```python
   from google import genai
   client = genai.Client()
   ```
</Steps>
```

### Notes

- Wrap around a standard Markdown ordered list
- All Markdown syntax works inside `<Steps>`
- No props available - just wrap your list

### When to Use `<Steps>` vs. H2 Sections

| Use `<Steps>` | Use H2 Sections (`## Step 1:`) |
|---------------|--------------------------------|
| Simple, inline sequential steps | Substantial tutorials with multiple code blocks per step |
| Steps within a section | Steps that need their own TOC entry |
| 3-5 concise steps | Steps with expected output, troubleshooting per step |
| How-to guides | Quickstart tutorials |

---

## FileTree

Display directory structures with icons.

### Import

```javascript
import { FileTree } from '@astrojs/starlight/components';
```

### Basic Usage

```mdx
import { FileTree } from '@astrojs/starlight/components';

<FileTree>
- src/
  - components/
    - Header.astro
    - Footer.astro
  - pages/
    - index.astro
- astro.config.mjs
- package.json
</FileTree>
```

### Highlight Files

Make entries stand out with bold:

```mdx
<FileTree>
- src/
  - components/
    - **Header.astro** important file
    - Footer.astro
</FileTree>
```

### Add Comments

```mdx
<FileTree>
- src/
  - components/
    - Header.astro the main header
    - Footer.astro site footer
</FileTree>
```

### Placeholders

Use `...` for abbreviated content:

```mdx
<FileTree>
- src/
  - components/
    - ...
  - pages/
    - ...
- package.json
</FileTree>
```

### Directory Without Children

End with `/` for empty directories:

```mdx
<FileTree>
- src/
  - utils/
</FileTree>
```

---

## Icon

Display Starlight's built-in icons.

### Import

```javascript
import { Icon } from '@astrojs/starlight/components';
```

### Basic Usage

```mdx
import { Icon } from '@astrojs/starlight/components';

<Icon name="star" />
<Icon name="rocket" />
<Icon name="github" />
```

### With Label (for Accessibility)

```mdx
<Icon name="warning" label="Warning" />
```

### Customization

```mdx
<Icon name="star" size="2rem" color="gold" />
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Icon name from [Starlight icons](https://starlight.astro.build/reference/icons/) |
| `label` | `string` | Accessible label for screen readers |
| `size` | `string` | CSS size value (e.g., `'1.5rem'`) |
| `color` | `string` | CSS color value |

### Common Icons

| Name | Usage |
|------|-------|
| `star` | Favorites, ratings |
| `rocket` | Getting started, launch |
| `document` | Documentation, files |
| `puzzle` | Examples, integrations |
| `github` | GitHub links |
| `warning` | Warnings, cautions |
| `information` | Info, notes |
| `pencil` | Edit, create |
| `external` | External links |
| `open-book` | Guides, learning |

---

## Component Import Patterns

### Single Import

```javascript
import { Aside } from '@astrojs/starlight/components';
```

### Multiple Imports

```javascript
import { 
  Tabs, 
  TabItem, 
  Card, 
  CardGrid,
  Aside,
  Badge 
} from '@astrojs/starlight/components';
```

### Recommended Page Setup

```mdx
---
title: My Documentation Page
description: A comprehensive guide
---

import { 
  Tabs, 
  TabItem, 
  Card, 
  CardGrid,
  LinkCard,
  Steps,
  Aside,
  Badge,
  FileTree
} from '@astrojs/starlight/components';

# Page Title <Badge text="New" variant="tip" />

<Aside type="tip">
  Start here if you're new to the API.
</Aside>

## Quick Start

<Steps>
1. Install the SDK
2. Configure authentication  
3. Make your first request
</Steps>

## Next Steps

<CardGrid>
  <LinkCard title="API Reference" href="/api" />
  <LinkCard title="Examples" href="/examples" />
</CardGrid>
```
