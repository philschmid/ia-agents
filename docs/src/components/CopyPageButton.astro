---
/**
 * CopyPageButton - A simple button to copy page content as Markdown
 */

// Get the current page's raw content
const rawBody = Astro.locals.starlightRoute.entry.body;
---

<div class="copy-page-wrapper">
  <button class="copy-page-btn lg:mb-4" type="button">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
    </svg>
    <span>Copy page</span>
  </button>
</div>

<!-- Store raw content for JS access -->
<script define:vars={{ rawBody }}>
  window.__pageMarkdown = rawBody;
</script>

<script>
  function initCopyPageButtons() {
    const buttons = document.querySelectorAll('.copy-page-btn');
    
    buttons.forEach((btn) => {
      // Skip if already initialized
      if (btn.hasAttribute('data-copy-init')) return;
      btn.setAttribute('data-copy-init', 'true');
      
      btn.addEventListener('click', async () => {
        const markdown = (window as any).__pageMarkdown || '';
        
        try {
          await navigator.clipboard.writeText(markdown);
          
          // Show feedback on all copy buttons
          buttons.forEach((b) => {
            const span = b.querySelector('span');
            if (span) {
              const originalText = span.textContent;
              span.textContent = 'Copied!';
              setTimeout(() => {
                span.textContent = originalText || 'Copy page';
              }, 2000);
            }
          });
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      });
    });
  }
  
  // Run on page load and navigation
  initCopyPageButtons();
  document.addEventListener('astro:page-load', initCopyPageButtons);
</script>

<style>
  .copy-page-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--sl-color-text);
    background: transparent;
    border: 1px solid var(--sl-color-gray-5);
    border-radius: 9999px;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }
  
  .copy-page-btn:hover {
    background: var(--sl-color-bg-accent);
    border-color: var(--sl-color-gray-4);
  }
</style>
