/**
 * Web Scraping Utilities
 *
 * Multi-fallback web content fetching with Impit, native fetch, and Playwright.
 */

import { createDebug } from '@philschmid/agents-core';
import { Impit } from 'impit';
import { type Browser, type BrowserContext, chromium } from 'playwright-core';
import { calculateContentScore } from './filter';
import { convertToMarkdown } from './markdown';

const log = createDebug('scrape');

let impit: Impit | null = null;

/** Get or create the Impit instance (lazy to avoid import-time crashes). */
function getImpit(): Impit {
  if (!impit) {
    impit = new Impit({ browser: 'chrome', maxRedirects: 10 });
  }
  return impit;
}

const FETCH_TIMEOUT_MS = 15000; // 15 seconds timeout
const PLAYWRIGHT_TIMEOUT_MS = 30000; // 30 seconds for browser operations
const CDP_ENDPOINT = process.env.CDP_ENDPOINT || 'http://localhost:9222';

// Cached browser instance for reuse across fetches
let cachedBrowser: Browser | null = null;
let cachedContext: BrowserContext | null = null;

// Helper to wrap a promise with a timeout
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), timeoutMs)),
  ]);
}

// Helper to create a fetch with timeout using AbortController
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Get or create a browser instance.
 * First tries to connect to an existing Chrome via CDP.
 * If that fails, launches a new headless Chrome that persists.
 */
async function getOrCreateBrowser(): Promise<{ browser: Browser; context: BrowserContext }> {
  // Return cached browser if still connected
  if (cachedBrowser && cachedContext) {
    try {
      // Check if browser is still alive
      await cachedBrowser.version();
      return { browser: cachedBrowser, context: cachedContext };
    } catch (error) {
      log('Cached browser died, clearing cache: %s', error);
      cachedBrowser = null;
      cachedContext = null;
    }
  }

  // Try to connect to existing Chrome via CDP first
  try {
    const browser = await chromium.connectOverCDP(CDP_ENDPOINT, {
      timeout: 3000,
    });
    const contexts = browser.contexts();
    const context = contexts.length > 0 ? contexts[0] : await browser.newContext();
    cachedBrowser = browser;
    cachedContext = context;
    return { browser, context };
  } catch (error) {
    log('CDP connection to %s failed, launching new browser: %s', CDP_ENDPOINT, error);
  }

  // Launch new headless Chrome
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  cachedBrowser = browser;
  cachedContext = context;

  // Handle browser disconnect
  browser.on('disconnected', () => {
    cachedBrowser = null;
    cachedContext = null;
  });

  return { browser, context };
}

/**
 * Fetch URL using Playwright.
 * Uses a cached headless browser or connects to existing Chrome.
 */
export async function fetchWithPlaywright(
  url: string
): Promise<{ html: string; finalUrl: string }> {
  const { context } = await getOrCreateBrowser();
  const page = await context.newPage();

  try {
    // Navigate to URL and wait for content to load
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: PLAYWRIGHT_TIMEOUT_MS,
    });

    // Wait a bit for any dynamic content
    await page.waitForTimeout(1000);

    // Get the final URL after redirects
    const finalUrl = page.url();

    // Get page content
    const html = await page.content();

    return { html, finalUrl };
  } finally {
    // Always close the page to free resources
    await page.close().catch(() => {});
  }
}

/**
 * Cleanup: Close the cached browser.
 * Call this when shutting down the application.
 */
export async function closeBrowser(): Promise<void> {
  if (cachedBrowser) {
    await cachedBrowser.close().catch(() => {});
    cachedBrowser = null;
    cachedContext = null;
  }
}

export async function fetchUrl(url: string, options: { maxLines?: number } = {}): Promise<string> {
  let htmlContent = '';
  let fetchedUrl = url;

  // 1. Try Impit with timeout
  try {
    const response = await withTimeout(
      getImpit().fetch(url),
      FETCH_TIMEOUT_MS,
      `Impit request timed out after ${FETCH_TIMEOUT_MS}ms`
    );
    if (!response.ok) {
      throw new Error(`Impit failed with status ${response.status}, ${await response.text()}`);
    }
    htmlContent = await response.text();
    fetchedUrl = response.url || url;
  } catch {
    // 2. Fallback to native fetch
    try {
      const response = await fetchWithTimeout(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AgentBot/1.0)',
        },
      });
      if (!response.ok) {
        throw new Error(`Fetch failed with status ${response.status}`);
      }
      htmlContent = await response.text();
      fetchedUrl = response.url;
    } catch (fetchError) {
      // 3. Fallback to Playwright (headless Chrome)
      try {
        const result = await fetchWithPlaywright(url);
        htmlContent = result.html;
        fetchedUrl = result.finalUrl;
      } catch (playwrightError) {
        throw new Error(
          `All fetch methods failed for ${url}. Playwright error: ${playwrightError}`
        );
      }
    }
  }

  // 4. Quality Checks (Pre-conversion)
  if (!htmlContent || htmlContent.length < 200) {
    throw new Error(`Content too short (${htmlContent?.length} chars), possibly blocked or empty.`);
  }

  // 5. Convert to Markdown
  let markdown = await convertToMarkdown(htmlContent, fetchedUrl);

  // 6. Advanced Quality Scoring
  const { isGoodQuality, reason } = calculateContentScore(markdown);

  // Threshold for "Failed Quality Check"
  if (!isGoodQuality) {
    throw new Error(`Couldn't fetch content because it's not in a good quality. Reason: ${reason}`);
  }

  // 7. Truncate Lines
  if (options.maxLines) {
    const lines = markdown.split('\n');
    if (lines.length > options.maxLines) {
      markdown = lines.slice(0, options.maxLines).join('\n');
      markdown += `\n\n... (truncated to ${options.maxLines} lines)`;
    }
  }

  return markdown;
}
