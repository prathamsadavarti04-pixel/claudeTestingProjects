import type { PrDiffFile } from "./client";

/**
 * Two limits, for two different failure modes:
 *
 * - MAX_TOTAL_DIFF_LINES: above this, don't even try — post a comment
 *   asking for a human review / smaller PR instead of burning API calls on
 *   a review that won't fit any reasonable context window anyway.
 * - MAX_CHUNK_CHARS: below the hard cap, split the remaining files into
 *   chunks that comfortably fit a single model call. Rough estimate of
 *   4 chars/token, budgeted well under typical 128k-token context windows
 *   to leave room for the PRD, system prompt, and response.
 */
export const MAX_TOTAL_DIFF_LINES = 6000;
const MAX_CHUNK_CHARS = 60_000;

export interface DiffChunk {
  files: PrDiffFile[];
  totalChars: number;
}

export function totalDiffLines(files: PrDiffFile[]): number {
  return files.reduce((sum, f) => sum + f.additions + f.deletions, 0);
}

export function exceedsHardLimit(files: PrDiffFile[]): boolean {
  return totalDiffLines(files) > MAX_TOTAL_DIFF_LINES;
}

/**
 * Greedy bin-packing by file: walk files in order, start a new chunk
 * whenever adding the next file would exceed the budget. A single file
 * whose own patch exceeds the budget gets its own oversized chunk rather
 * than being silently dropped — the model still sees it, just alone.
 */
export function chunkDiff(files: PrDiffFile[]): DiffChunk[] {
  const withPatches = files.filter((f) => !!f.patch);
  if (withPatches.length === 0) return [];

  const chunks: DiffChunk[] = [];
  let current: PrDiffFile[] = [];
  let currentChars = 0;

  for (const file of withPatches) {
    const fileChars = file.patch!.length + file.filename.length + 20;

    if (current.length > 0 && currentChars + fileChars > MAX_CHUNK_CHARS) {
      chunks.push({ files: current, totalChars: currentChars });
      current = [];
      currentChars = 0;
    }

    current.push(file);
    currentChars += fileChars;
  }

  if (current.length > 0) {
    chunks.push({ files: current, totalChars: currentChars });
  }

  return chunks;
}

export function formatDiffChunkForPrompt(chunk: DiffChunk): string {
  return chunk.files
    .map((f) => `### ${f.filename} (${f.status}, +${f.additions}/-${f.deletions})\n\`\`\`diff\n${f.patch}\n\`\`\``)
    .join("\n\n");
}


