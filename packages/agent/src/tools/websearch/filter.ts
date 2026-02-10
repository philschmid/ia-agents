/**
 * Content Quality Filter
 *
 * Quality scoring for extracted markdown content.
 */

export type QualityConfig = {
  minTextLength: number; // Ignore tiny snippets (e.g., < 50 chars)
  maxAvgWordLength: number; // Max average word length (detects minified code/base64)
};

const DEFAULT_CONFIG: QualityConfig = {
  minTextLength: 50,
  maxAvgWordLength: 20,
};

export type QualityResult = {
  isGoodQuality: boolean;
  reason: string;
};

export function calculateContentScore(
  markdown: string,
  config: QualityConfig = DEFAULT_CONFIG
): QualityResult {
  if (!markdown || markdown.length < config.minTextLength) {
    return { isGoodQuality: false, reason: 'Too short' };
  }

  // Analyzing the first 2000 characters is usually enough to detect garbage.
  const sampleSize = Math.min(markdown.length, 2000);

  let spaceCount = 0;
  let wordCount = 0;
  let currentWordLength = 0;

  // Single Pass Loop: We iterate characters once to gather all metrics.
  for (let i = 0; i < sampleSize; i++) {
    const char = markdown[i];

    // Tokenization logic
    const isWhitespace = char === ' ' || char === '\n' || char === '\t' || char === '\r';

    if (isWhitespace) {
      if (currentWordLength > 0) {
        wordCount++;
        currentWordLength = 0;
      }
      spaceCount++;
    } else {
      currentWordLength++;
    }
  }

  // Count the last word if the sample doesn't end with whitespace
  if (currentWordLength > 0) {
    wordCount++;
  }

  // 2. Calculate Metrics
  const avgWordLength = (sampleSize - spaceCount) / (wordCount || 1);

  // 3. Evaluate Thresholds
  // Check: Are the words unnatural? (e.g. minified code "var a=b;c=d")
  if (avgWordLength > config.maxAvgWordLength) {
    return {
      isGoodQuality: false,
      reason: `Average word length too high: ${avgWordLength.toFixed(1)}`,
    };
  }

  return { isGoodQuality: true, reason: 'Pass' };
}
