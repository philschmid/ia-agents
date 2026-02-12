---
name: agent-browser
description: Browser automation CLI for AI agents. Use when the user needs to interact with websites, including navigating pages, filling forms, clicking buttons, taking screenshots, extracting data, testing web apps, or automating any browser task. Triggers include requests to "open a website", "fill out a form", "click a button", "take a screenshot", "scrape data from a page", "test this web app", "login to a site", "automate browser actions", or any task requiring programmatic web interaction.
tools:
  - bash
---

# Browser Automation with agent-browser

## Core Workflow

1. **Navigate**: `agent-browser open <url>`
2. **Snapshot**: `agent-browser snapshot -i` (get element refs like `@e1`, `@e2`)
3. **Interact**: Use refs to click, fill, select
4. **Re-snapshot**: After navigation or DOM changes, get fresh refs

```bash
agent-browser open https://example.com/form
agent-browser snapshot -i
# Output: @e1 [input type="email"], @e2 [input type="password"], @e3 [button] "Submit"

agent-browser fill @e1 "user@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
agent-browser wait --load networkidle
agent-browser snapshot -i  # Check result
```

**Important**: Refs (`@e1`, `@e2`) are invalidated on page changes. Always re-snapshot after clicks that navigate, form submissions, or dynamic content changes.

## Essential Commands

```bash
# Navigation
agent-browser open <url>              # Navigate (aliases: goto, navigate)
agent-browser back / forward / reload # History navigation
agent-browser close                   # Close browser

# Snapshot
agent-browser snapshot -i             # Interactive elements with refs (recommended)
agent-browser snapshot -i -C          # Include cursor-interactive elements
agent-browser snapshot -s "#selector" # Scope to CSS selector

# Interaction (use @refs from snapshot)
agent-browser click @e1               # Click element
agent-browser fill @e2 "text"         # Clear and type text
agent-browser type @e2 "text"         # Type without clearing
agent-browser select @e1 "option"     # Select dropdown option
agent-browser check @e1               # Check checkbox
agent-browser press Enter             # Press key
agent-browser scroll down 500         # Scroll page
agent-browser hover @e1               # Hover
agent-browser drag @e1 @e2            # Drag and drop
agent-browser upload @e1 file.pdf     # Upload files

# Get information
agent-browser get text @e1            # Get element text
agent-browser get html @e1            # Get innerHTML
agent-browser get value @e1           # Get input value
agent-browser get attr @e1 href       # Get attribute
agent-browser get url                 # Get current URL
agent-browser get title               # Get page title

# Wait
agent-browser wait @e1                # Wait for element
agent-browser wait --load networkidle # Wait for network idle
agent-browser wait --url "**/page"    # Wait for URL pattern
agent-browser wait --text "Success"   # Wait for text
agent-browser wait 2000               # Wait milliseconds

# Capture
agent-browser screenshot              # Screenshot to temp dir
agent-browser screenshot --full       # Full page screenshot
agent-browser pdf output.pdf          # Save as PDF

# State & Sessions
agent-browser state save auth.json    # Save cookies, storage, auth state
agent-browser state load auth.json    # Restore saved state
agent-browser --session name ...      # Isolated browser session

# Recording
agent-browser record start demo.webm  # Start recording
agent-browser record stop              # Stop and save

# Semantic locators (alternative to refs)
agent-browser find text "Sign In" click
agent-browser find label "Email" fill "user@test.com"
agent-browser find role button click --name "Submit"
agent-browser find testid "submit-btn" click
```

## Common Patterns

### Form Submission

```bash
agent-browser open https://example.com/signup
agent-browser snapshot -i
agent-browser fill @e1 "Jane Doe"
agent-browser fill @e2 "jane@example.com"
agent-browser select @e3 "California"
agent-browser check @e4
agent-browser click @e5
agent-browser wait --load networkidle
```

### Authentication with State Persistence

```bash
agent-browser open https://app.example.com/login
agent-browser snapshot -i
agent-browser fill @e1 "$USERNAME"
agent-browser fill @e2 "$PASSWORD"
agent-browser click @e3
agent-browser wait --url "**/dashboard"
agent-browser state save auth.json

# Reuse in future sessions
agent-browser state load auth.json
agent-browser open https://app.example.com/dashboard
```

### Data Extraction

```bash
agent-browser open https://example.com/products
agent-browser snapshot -i
agent-browser get text @e5            # Specific element
agent-browser get text body > page.txt # All page text
agent-browser snapshot -i --json       # JSON output
```

### Local Files

```bash
agent-browser --allow-file-access open file:///path/to/document.pdf
agent-browser screenshot output.png
```

### JavaScript Execution

```bash
agent-browser eval "document.title"        # Simple expressions
agent-browser eval -b "<base64>"           # Base64-encoded script (reliable)
cat <<'EOF' | agent-browser eval --stdin   # Stdin for multiline
const links = document.querySelectorAll('a');
Array.from(links).map(a => a.href);
EOF
```

## Global Options

```bash
--session <name>       # Isolated browser session
--json                 # JSON output
--headed               # Show browser window
--proxy <url>          # Use proxy server
--ignore-https-errors  # Ignore SSL errors
--allow-file-access    # Allow file:// URLs
--extension <path>     # Load browser extension
-p <provider>          # Cloud browser provider
```

## Deep-Dive References

| Reference | URL |
|-----------|-----|
| Full command reference | https://raw.githubusercontent.com/vercel-labs/agent-browser/refs/heads/main/skills/agent-browser/references/commands.md |
| Snapshot refs & lifecycle | https://raw.githubusercontent.com/vercel-labs/agent-browser/refs/heads/main/skills/agent-browser/references/snapshot-refs.md |
| Session management | https://raw.githubusercontent.com/vercel-labs/agent-browser/refs/heads/main/skills/agent-browser/references/session-management.md |
| Authentication patterns | https://raw.githubusercontent.com/vercel-labs/agent-browser/refs/heads/main/skills/agent-browser/references/authentication.md |
| Video recording | https://raw.githubusercontent.com/vercel-labs/agent-browser/refs/heads/main/skills/agent-browser/references/video-recording.md |
| Proxy support | https://raw.githubusercontent.com/vercel-labs/agent-browser/refs/heads/main/skills/agent-browser/references/proxy-support.md |
