/**
 * Google Custom Search API
 *
 * Performs web searches using the Google Custom Search API.
 */

import pLimit from 'p-limit';
import { fetchUrl } from './scrape';

/**
 * Perform Google Custom Search API call and fetch content from results.
 */
export async function googleSearch(
  query: string,
  num = 5
): Promise<{ source: string; title: string; content: string }[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;

  if (!apiKey || !cx) {
    throw new Error('Missing GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_CX environment variables');
  }

  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.append('key', apiKey);
  url.searchParams.append('cx', cx);
  url.searchParams.append('q', query);
  url.searchParams.append('num', Math.min(num, 10).toString());

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Google Search API failed: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    items?: { link: string; title: string; snippet: string }[];
  };

  if (!data.items) {
    throw new Error('No items found');
  }

  // Limit concurrency to 5
  const limit = pLimit(5);

  // biome-ignore lint/suspicious/noExplicitAny: Google API response type
  const tasks = data.items.map((item: any) =>
    limit(async () => {
      let content: string;
      try {
        content = await fetchUrl(item.link.toString());
      } catch (error) {
        content = `Error fetching content from ${item.link}: ${error}, Fallback to search snippet.\n\n${item.snippet}`;
      }

      return {
        source: item.link,
        title: item.title,
        content: content,
      };
    })
  );

  const results = await Promise.all(tasks);
  return results;
}
