/**
 * Patch Parser and Applier
 *
 * Fuzzy patch matching for file modifications.
 * Supports Add, Delete, Update, and Move operations.
 */

import fs from 'node:fs/promises';
import { resolvePath } from '../utils';

// --- Types ---

export type Hunk =
  | { type: 'AddFile'; path: string; contents: string }
  | { type: 'DeleteFile'; path: string }
  | { type: 'UpdateFile'; path: string; movePath?: string; chunks: UpdateFileChunk[] };

export type UpdateFileChunk = {
  changeContext?: string;
  oldLines: string[];
  newLines: string[];
  isEndOfFile: boolean;
};

export type ApplyPatchArgs = {
  hunks: Hunk[];
  patch: string;
  workdir?: string;
};

export class ParseError extends Error {
  constructor(
    message: string,
    public lineNumber?: number
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

// --- Seek Sequence (Fuzzy Matching) ---

function normalize(s: string): string {
  return s
    .trim()
    .split('')
    .map((c) => {
      // Various dash / hyphen code-points → ASCII '-'
      if (['\u2010', '\u2011', '\u2012', '\u2013', '\u2014', '\u2015', '\u2212'].includes(c))
        return '-';
      // Fancy single quotes → '\''
      if (['\u2018', '\u2019', '\u201A', '\u201B'].includes(c)) return "'";
      // Fancy double quotes → '"'
      if (['\u201C', '\u201D', '\u201E', '\u201F'].includes(c)) return '"';
      // Non-breaking space and other odd spaces → normal space
      if (
        [
          '\u00A0',
          '\u2002',
          '\u2003',
          '\u2004',
          '\u2005',
          '\u2006',
          '\u2007',
          '\u2008',
          '\u2009',
          '\u200A',
          '\u202F',
          '\u205F',
          '\u3000',
        ].includes(c)
      )
        return ' ';
      return c;
    })
    .join('');
}

export function seekSequence(
  lines: string[],
  pattern: string[],
  start: number,
  eof: boolean
): number | null {
  if (pattern.length === 0) return start;
  if (pattern.length > lines.length) return null;

  const searchStart = eof && lines.length >= pattern.length ? lines.length - pattern.length : start;

  const limit = lines.length - pattern.length;
  if (limit < 0) return null;

  // 1. Exact match
  for (let i = searchStart; i <= limit; i++) {
    let ok = true;
    for (let j = 0; j < pattern.length; j++) {
      if (lines[i + j] !== pattern[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return i;
  }

  // 2. Rstrip match
  for (let i = searchStart; i <= limit; i++) {
    let ok = true;
    for (let j = 0; j < pattern.length; j++) {
      if (lines[i + j].trimEnd() !== pattern[j].trimEnd()) {
        ok = false;
        break;
      }
    }
    if (ok) return i;
  }

  // 3. Trim match
  for (let i = searchStart; i <= limit; i++) {
    let ok = true;
    for (let j = 0; j < pattern.length; j++) {
      if (lines[i + j].trim() !== pattern[j].trim()) {
        ok = false;
        break;
      }
    }
    if (ok) return i;
  }

  // 4. Normalized match
  for (let i = searchStart; i <= limit; i++) {
    let ok = true;
    for (let j = 0; j < pattern.length; j++) {
      if (normalize(lines[i + j]) !== normalize(pattern[j])) {
        ok = false;
        break;
      }
    }
    if (ok) return i;
  }

  return null;
}

// --- Parser ---

const BEGIN_PATCH_MARKER = '*** Begin Patch';
const END_PATCH_MARKER = '*** End Patch';
const ADD_FILE_MARKER = '*** Add File: ';
const DELETE_FILE_MARKER = '*** Delete File: ';
const UPDATE_FILE_MARKER = '*** Update File: ';
const MOVE_TO_MARKER = '*** Move to: ';
const EOF_MARKER = '*** End of File';
const CHANGE_CONTEXT_MARKER = '@@ ';
const EMPTY_CHANGE_CONTEXT_MARKER = '@@';

type ParseMode = 'strict' | 'lenient';

export function parsePatch(patch: string): ApplyPatchArgs {
  return parsePatchText(patch, 'lenient');
}

function parsePatchText(patch: string, mode: ParseMode): ApplyPatchArgs {
  const lines = patch.trim().split(/\r?\n/);

  let effectiveLines = lines;
  try {
    checkPatchBoundariesStrict(lines);
  } catch (e) {
    if (mode === 'strict') throw e;
    effectiveLines = checkPatchBoundariesLenient(lines, e as ParseError);
  }

  const hunks: Hunk[] = [];

  if (effectiveLines.length < 2) return { hunks: [], patch, workdir: undefined };

  let remainingLines = effectiveLines.slice(1, effectiveLines.length - 1);
  let lineNumber = 2;

  while (remainingLines.length > 0) {
    const { hunk, parsedLines } = parseOneHunk(remainingLines, lineNumber);
    hunks.push(hunk);
    lineNumber += parsedLines;
    remainingLines = remainingLines.slice(parsedLines);
  }

  return { hunks, patch: effectiveLines.join('\n'), workdir: undefined };
}

function checkPatchBoundariesStrict(lines: string[]) {
  if (lines.length < 2) throw new ParseError('Patch too short');
  if (lines[0].trim() !== BEGIN_PATCH_MARKER)
    throw new ParseError(
      `The first line of the patch must be '${BEGIN_PATCH_MARKER}', got: '${lines[0]}'`
    );
  if (lines[lines.length - 1].trim() !== END_PATCH_MARKER)
    throw new ParseError(
      `The last line of the patch must be '${END_PATCH_MARKER}', got: '${lines[lines.length - 1]}'`
    );
}

function checkPatchBoundariesLenient(lines: string[], originalError: ParseError): string[] {
  if (lines.length < 2) throw originalError;

  // Helper to normalize a line for marker detection
  // Handles common model mistakes like prefixing markers with +/-
  const normalizeForMarker = (line: string): string => {
    const trimmed = line.trim();
    // Strip leading +, -, or space that models sometimes add to markers
    if (trimmed.startsWith('+') || trimmed.startsWith('-') || trimmed.startsWith(' ')) {
      return trimmed.slice(1).trim();
    }
    return trimmed;
  };

  // Find the actual begin and end indices, tolerating whitespace and empty lines
  let beginIdx = -1;
  let endIdx = -1;

  // Look for begin marker in first few lines
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const normalized = normalizeForMarker(lines[i]);
    if (lines[i].trim() === BEGIN_PATCH_MARKER || normalized === BEGIN_PATCH_MARKER) {
      beginIdx = i;
      break;
    }
  }

  // Look for end marker in last few lines (handles trailing empty lines and +*** End Patch)
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 10); i--) {
    const normalized = normalizeForMarker(lines[i]);
    if (lines[i].trim() === END_PATCH_MARKER || normalized === END_PATCH_MARKER) {
      endIdx = i;
      break;
    }
  }

  if (beginIdx !== -1 && endIdx !== -1 && beginIdx < endIdx) {
    // Return with proper markers (without + prefix if present)
    const result = lines.slice(beginIdx, endIdx + 1);
    // Fix the end marker if it has a + prefix
    if (result[result.length - 1].trim() !== END_PATCH_MARKER) {
      result[result.length - 1] = END_PATCH_MARKER;
    }
    // Fix the begin marker if it has a + prefix
    if (result[0].trim() !== BEGIN_PATCH_MARKER) {
      result[0] = BEGIN_PATCH_MARKER;
    }
    return result;
  }

  // Handle <<EOF heredoc wrapper
  const first = lines[0];
  const last = lines[lines.length - 1];

  if (
    (first.startsWith('<<EOF') || first.startsWith("<<'EOF'") || first.startsWith('<<"EOF"')) &&
    last.endsWith('EOF')
  ) {
    const inner = lines.slice(1, lines.length - 1);
    return checkPatchBoundariesLenient(inner, originalError);
  }

  throw originalError;
}

function parseOneHunk(lines: string[], lineNumber: number): { hunk: Hunk; parsedLines: number } {
  const firstLine = lines[0].trim();

  if (firstLine.startsWith(ADD_FILE_MARKER)) {
    const path = firstLine.substring(ADD_FILE_MARKER.length).trim();
    let contents = '';
    let parsedLines = 1;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('+')) {
        contents += `${line.substring(1)}\n`;
        parsedLines++;
      } else {
        break;
      }
    }
    return { hunk: { type: 'AddFile', path, contents }, parsedLines };
  }

  if (firstLine.startsWith(DELETE_FILE_MARKER)) {
    const path = firstLine.substring(DELETE_FILE_MARKER.length).trim();
    return { hunk: { type: 'DeleteFile', path }, parsedLines: 1 };
  }

  if (firstLine.startsWith(UPDATE_FILE_MARKER)) {
    const path = firstLine.substring(UPDATE_FILE_MARKER.length).trim();
    let remaining = lines.slice(1);
    let parsedLines = 1;
    let movePath: string | undefined;

    if (remaining.length > 0 && remaining[0].startsWith(MOVE_TO_MARKER)) {
      movePath = remaining[0].substring(MOVE_TO_MARKER.length).trim();
      remaining = remaining.slice(1);
      parsedLines++;
    }

    const chunks: UpdateFileChunk[] = [];

    while (remaining.length > 0) {
      if (remaining[0].trim() === '') {
        parsedLines++;
        remaining = remaining.slice(1);
        continue;
      }

      if (remaining[0].startsWith('***')) break;

      const { chunk, chunkLines } = parseUpdateFileChunk(
        remaining,
        lineNumber + parsedLines,
        chunks.length === 0
      );
      chunks.push(chunk);
      parsedLines += chunkLines;
      remaining = remaining.slice(chunkLines);
    }

    if (chunks.length === 0) {
      throw new ParseError(`Update file hunk for path '${path}' is empty`, lineNumber);
    }

    return { hunk: { type: 'UpdateFile', path, movePath, chunks }, parsedLines };
  }

  throw new ParseError(
    `'${firstLine}' is not a valid hunk header. Valid hunk headers: '${ADD_FILE_MARKER}{path}', '${DELETE_FILE_MARKER}{path}', '${UPDATE_FILE_MARKER}{path}'`,
    lineNumber
  );
}

function parseUpdateFileChunk(
  lines: string[],
  lineNumber: number,
  allowMissingContext: boolean
): { chunk: UpdateFileChunk; chunkLines: number } {
  if (lines.length === 0) {
    throw new ParseError('Update hunk does not contain any lines', lineNumber);
  }

  let changeContext: string | undefined;
  let startIndex = 0;

  if (lines[0] === EMPTY_CHANGE_CONTEXT_MARKER) {
    startIndex = 1;
  } else if (lines[0].startsWith(CHANGE_CONTEXT_MARKER)) {
    changeContext = lines[0].substring(CHANGE_CONTEXT_MARKER.length);
    startIndex = 1;
  } else {
    if (!allowMissingContext) {
      throw new ParseError(
        `Expected update hunk to start with a @@ context marker, got: '${lines[0]}'`,
        lineNumber
      );
    }
    startIndex = 0;
  }

  if (startIndex >= lines.length) {
    throw new ParseError('Update hunk does not contain any lines', lineNumber + 1);
  }

  const chunk: UpdateFileChunk = {
    changeContext,
    oldLines: [],
    newLines: [],
    isEndOfFile: false,
  };

  let parsedLines = 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];

    if (line === EOF_MARKER) {
      if (parsedLines === 0) {
        throw new ParseError('Update hunk does not contain any lines', lineNumber + 1);
      }
      chunk.isEndOfFile = true;
      parsedLines++;
      break;
    }

    if (line.length === 0) {
      chunk.oldLines.push('');
      chunk.newLines.push('');
    } else if (line.startsWith(' ')) {
      chunk.oldLines.push(line.substring(1));
      chunk.newLines.push(line.substring(1));
    } else if (line.startsWith('+')) {
      chunk.newLines.push(line.substring(1));
    } else if (line.startsWith('-')) {
      chunk.oldLines.push(line.substring(1));
    } else {
      if (parsedLines === 0) {
        throw new ParseError(
          `Unexpected line found in update hunk: '${line}'. Every line should start with ' ' (context line), '+' (added line), or '-' (removed line)`,
          lineNumber + 1
        );
      }
      break;
    }
    parsedLines++;
  }

  return { chunk, chunkLines: parsedLines + startIndex };
}

// --- Main Apply Logic ---

export async function applyPatch(patchText: string, cwd: string): Promise<string> {
  try {
    const args = parsePatch(patchText);
    const results: string[] = [];

    for (const hunk of args.hunks) {
      try {
        const result = await applyHunk(hunk, cwd);
        results.push(result);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        results.push(`Failed to apply hunk for ${hunk.path}: ${message}`);
      }
    }
    return results.join('\n');
  } catch (e: unknown) {
    if (e instanceof ParseError) {
      return `Patch parse error: ${e.message} ${e.lineNumber ? `at line ${e.lineNumber}` : ''}`;
    }
    const message = e instanceof Error ? e.message : String(e);
    return `Error applying patch: ${message}`;
  }
}

async function applyHunk(hunk: Hunk, cwd: string): Promise<string> {
  const targetPath = resolvePath(cwd, hunk.path);

  if (hunk.type === 'DeleteFile') {
    try {
      await fs.unlink(targetPath);
      return `Deleted ${hunk.path}`;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return `Deleted ${hunk.path} (failed to unlink: ${message})`;
    }
  }

  if (hunk.type === 'AddFile') {
    await fs.writeFile(targetPath, hunk.contents, 'utf-8');
    return `Added ${hunk.path}`;
  }

  if (hunk.type === 'UpdateFile') {
    let content = '';
    try {
      content = await fs.readFile(targetPath, 'utf-8');
    } catch {
      throw new Error(`File not found: ${hunk.path}`);
    }

    const lines = content.split(/\r?\n/);
    const endsWithNewline = content.endsWith('\n');
    if (endsWithNewline && lines[lines.length - 1] === '') {
      lines.pop();
    }

    let currentSearchIndex = 0;
    let lastEnd = 0;
    const finalLines: string[] = [];

    for (const chunk of hunk.chunks) {
      let searchStart = Math.max(lastEnd, currentSearchIndex);

      if (chunk.changeContext) {
        const contextIdx = seekSequence(lines, [chunk.changeContext], searchStart, false);
        if (contextIdx !== null) {
          searchStart = contextIdx + 1;
        } else {
          throw new Error(`Could not find context '${chunk.changeContext}'`);
        }
      }

      const foundIdx = seekSequence(lines, chunk.oldLines, searchStart, chunk.isEndOfFile);

      if (foundIdx === null) {
        const contextMsg = chunk.changeContext ? ` after context '${chunk.changeContext}'` : '';
        throw new Error(`Could not find hunk match${contextMsg}`);
      }

      for (let i = lastEnd; i < foundIdx; i++) {
        finalLines.push(lines[i]);
      }

      finalLines.push(...chunk.newLines);

      lastEnd = foundIdx + chunk.oldLines.length;
      currentSearchIndex = lastEnd;
    }

    for (let i = lastEnd; i < lines.length; i++) {
      finalLines.push(lines[i]);
    }

    const newContent = finalLines.join('\n') + (endsWithNewline ? '\n' : '');

    if (hunk.movePath) {
      const destPath = resolvePath(cwd, hunk.movePath);
      await fs.writeFile(destPath, newContent, 'utf-8');
      if (targetPath !== destPath) {
        await fs.unlink(targetPath);
      }
      return `Moved ${hunk.path} to ${hunk.movePath}`;
    }
    await fs.writeFile(targetPath, newContent, 'utf-8');
    return `Updated ${hunk.path}`;
  }

  return '';
}
