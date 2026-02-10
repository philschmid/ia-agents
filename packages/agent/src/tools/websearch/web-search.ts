/**
 * Web Search Tool
 *
 * Performs web searches using the Google Custom Search API.
 */

import { tool } from '@philschmid/agents-core';
import { z } from 'zod';
import { googleSearch } from './google-search';

const description = `Performs web searches using the Google Search API and returns comprehensive search results with rich metadata.

Use this tool to perform: 
    - General web searches for information, facts, or current topics
    - Location-based information (restaurants, businesses, points of interest)
    - News information for recent events or breaking stories
    - Finding videos, discussions, or FAQ content
    - For accessing information beyond your knowledge cutoff

Returns a JSON list of web results with title, source (url) and the page content as markdown. The default number of results is 5, the maximum is 10.`;

/**
 * Web search tool - performs Google searches and fetches content from results.
 */
export const webSearchTool = tool({
  name: 'web_search',
  description,
  parameters: z.object({
    query: z.string().describe('The optimized google search query.'),
    num: z
      .number()
      .optional()
      .default(5)
      .describe('Number of results to return (max 10), default 5'),
  }),
  label: 'Web Search',
  execute: async (_toolCallId, { query, num }) => {
    try {
      const results = await googleSearch(query, num);
      return { result: JSON.stringify(results, null, 2) };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { result: `Error searching for "${query}": ${message}`, isError: true };
    }
  },
});
