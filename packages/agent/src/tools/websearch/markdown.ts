/**
 * HTML to Markdown Converter
 *
 * Converts HTML content to clean Markdown using Readability and html-to-markdown-node.
 */

import { Readability } from '@mozilla/readability';
import { convert } from 'html-to-markdown-node';
import { JSDOM, VirtualConsole } from 'jsdom';

// Create virtual console to suppress CSS parsing warnings from JSDOM
const virtualConsole = new VirtualConsole();
virtualConsole.on('error', () => {
  // Suppress "Could not parse CSS stylesheet" errors
});

export async function convertToMarkdown(
  htmlContent: string,
  baseUrl: string,
  useReadability = true
): Promise<string> {
  let content = htmlContent;

  if (useReadability) {
    // 1. JSDOM with URL (CRITICAL for fixing relative links)
    const dom = new JSDOM(htmlContent, { url: baseUrl, virtualConsole });

    // 2. Readability (Extract Main Content)
    const reader = new Readability(dom.window.document, {
      charThreshold: 100,
      keepClasses: true,
    });
    const article = reader.parse();

    if (!article || !article.content) {
      throw new Error('Failed to extract article content (Readability)');
    }

    // 3. Smart Title Logic
    content = article.content;

    // Remove HTML comments
    content = content.replace(/(\\<!--.*?\\-->)/g, '');

    // Promote H2 to H1 if it matches title, otherwise prepend Title
    if (article.title) {
      const h2Regex = /<h2[^>]*>(.*?)<\/h2>/i;
      const match = content.match(h2Regex);
      if (match?.[1].includes(article.title)) {
        content = content.replace('<h2', '<h1').replace('</h2', '</h1');
      } else {
        content = `<h1>${article.title}</h1>\n${content}`;
      }
    }
  }

  // 1. FIX CODE BLOCKS
  const pattern = /(<code[^>]*>)([\s\S]*?)(<\/code>)/gi;
  content = content.replace(
    pattern,
    (match: string, openTag: string, inner: string, closeTag: string) => {
      const cleanContent = inner.replace(/<\/?span[^>]*>/g, '');
      return openTag + cleanContent + closeTag;
    }
  );

  // 2. REMOVE HEADING ANCHORS
  content = content.replace(/(<h[1-6][^>]*>)\s*<a[^>]*href="#[^"]*"[^>]*>.*?<\/a>\s*/g, '$1');

  // 3. Convert Relative URLs to Absolute
  content = content.replace(/(href|src)=["']([^"']+)["']/gi, (match, attr, urlValue) => {
    try {
      if (urlValue.match(/^(http|https|mailto|tel):/i)) {
        return match;
      }
      const absoluteUrl = new URL(urlValue, baseUrl).href;
      return `${attr}="${absoluteUrl}"`;
    } catch {
      return match;
    }
  });

  // 4. Convert to Markdown
  let markdown = convert(content, {
    headingStyle: 'atx' as const, // JsHeadingStyle.Atx
    codeBlockStyle: 'backticks' as const, // JsCodeBlockStyle.Backticks
    extractMetadata: false,
    bullets: '-',
    preprocessing: {
      enabled: true,
      preset: 'aggressive' as const, // JsPreprocessingPreset.Aggressive
      removeNavigation: true,
      removeForms: true,
    },
    stripTags: [
      'script',
      'style',
      'noscript',
      'iframe',
      // biome-ignore lint/suspicious/noExplicitAny: html-to-markdown types don't expose CSS selector strings
      'svg' as any,
      'nav',
      'footer',
      'header',
      'aside',
      // biome-ignore lint/suspicious/noExplicitAny: html-to-markdown types don't expose CSS selector strings
      '.cookie-banner' as any,
      // biome-ignore lint/suspicious/noExplicitAny: html-to-markdown types don't expose CSS selector strings
      '.ad-container' as any,
    ],
    // biome-ignore lint/suspicious/noExplicitAny: html-to-markdown options type doesn't include all valid config
  } as any);

  // 5. Cleanup
  markdown = markdown.replace(/\[\]\(#[^)]*\)/g, '');

  // 6. Remove everything before first # Heading
  markdown = markdown.replace(/^.*?(?=#)/s, '');

  return markdown;
}
