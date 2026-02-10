/**
 * Web Fetch Tool
 *
 * Fetches a website and returns its content as Markdown.
 */

import { tool } from '@philschmid/agents-core';
import { z } from 'zod';
import { fetchUrl } from './scrape';

/**
 * Web fetch tool - fetches a website and returns its content as Markdown.
 */
export const webFetchTool = tool({
  name: 'web_fetch',
  description:
    'Fetches a website and returns its content as Markdown. Handles standard HTML pages. Use this to read the content of a specific URL.',
  parameters: z.object({
    url: z.string().url().describe('The URL to fetch'),
    maxLines: z
      .number()
      .optional()
      .describe('Maximum number of lines to return (default: unlimited)'),
  }),
  label: 'Fetch URL',
  execute: async (_toolCallId, { url, maxLines }) => {
    try {
      const content = await fetchUrl(url, { maxLines });
      return { result: content };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { result: `Error fetching ${url}: ${message}`, isError: true };
    }
  },
});
