import type { CodeDiff, DiffHunk, DiffSuggestion } from "@/types";

export function computeDiff(
  original: string,
  modified: string,
  title: string = "Code Changes"
): CodeDiff {
  const originalLines = original.split("\n");
  const modifiedLines = modified.split("\n");

  const lcs = computeLCS(originalLines, modifiedLines);

  const hunks: DiffHunk[] = [];
  let oi = 0;
  let mi = 0;
  let li = 0;

  while (oi < originalLines.length || mi < modifiedLines.length) {
    if (li < lcs.length && oi < originalLines.length && mi < modifiedLines.length) {
      const lcsEntry = lcs[li];

      if (originalLines[oi] !== lcsEntry && modifiedLines[mi] !== lcsEntry) {
        const removed: string[] = [];
        const added: string[] = [];

        while (oi < originalLines.length && originalLines[oi] !== lcsEntry) {
          removed.push(originalLines[oi]);
          oi++;
        }

        while (mi < modifiedLines.length && modifiedLines[mi] !== lcsEntry) {
          added.push(modifiedLines[mi]);
          mi++;
        }

        if (removed.length > 0) {
          hunks.push({
            type: "removed",
            lines: removed,
            lineStart: oi - removed.length + 1,
            lineEnd: oi,
          });
        }

        if (added.length > 0) {
          hunks.push({
            type: "added",
            lines: added,
            lineStart: mi - added.length + 1,
            lineEnd: mi,
          });
        }
      } else {
        const unchanged: string[] = [];
        while (oi < originalLines.length && mi < modifiedLines.length && originalLines[oi] === modifiedLines[mi] && originalLines[oi] === lcs[li]) {
          unchanged.push(originalLines[oi]);
          oi++;
          mi++;
          if (li < lcs.length && (oi >= originalLines.length || originalLines[oi] !== lcs[li])) {
            break;
          }
        }

        if (unchanged.length > 0) {
          hunks.push({
            type: "unchanged",
            lines: unchanged,
            lineStart: oi - unchanged.length + 1,
            lineEnd: oi,
          });
        }
      }
    } else {
      if (oi < originalLines.length) {
        const removed = originalLines.slice(oi);
        hunks.push({
          type: "removed",
          lines: removed,
          lineStart: oi + 1,
          lineEnd: originalLines.length,
        });
        oi = originalLines.length;
      }
      if (mi < modifiedLines.length) {
        const added = modifiedLines.slice(mi);
        hunks.push({
          type: "added",
          lines: added,
          lineStart: mi + 1,
          lineEnd: modifiedLines.length,
        });
        mi = modifiedLines.length;
      }
    }
  }

  const additions = hunks.filter((h) => h.type === "added").reduce((sum, h) => sum + h.lines.length, 0);
  const deletions = hunks.filter((h) => h.type === "removed").reduce((sum, h) => sum + h.lines.length, 0);

  const suggestions = analyzeDiffSuggestions(original, modified, hunks);

  return {
    original,
    modified,
    title,
    hunks,
    stats: {
      additions,
      deletions,
      files: 1,
    },
    suggestions,
  };
}

function computeLCS(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: string[] = [];
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return result;
}

function analyzeDiffSuggestions(
  original: string,
  modified: string,
  hunks: DiffHunk[]
): DiffSuggestion[] {
  const suggestions: DiffSuggestion[] = [];

  const addedHunks = hunks.filter((h) => h.type === "added");
  const removedHunks = hunks.filter((h) => h.type === "removed");

  for (let i = 0; i < addedHunks.length; i++) {
    const hunk = addedHunks[i];
    const hunkText = hunk.lines.join("\n");

    if (hunkText.includes("const") || hunkText.includes("let")) {
      suggestions.push({
        type: "best_practice",
        title: "Variable declaration added",
        description: "New variable declarations were added. Consider using const for immutable bindings.",
        severity: "info",
        hunkIndex: hunks.indexOf(hunk),
      });
    }

    if (hunkText.includes("function") || hunkText.includes("=>")) {
      suggestions.push({
        type: "readability",
        title: "Function added",
        description: "New function was added. Ensure it has clear naming and single responsibility.",
        severity: "info",
        hunkIndex: hunks.indexOf(hunk),
      });
    }

    if (hunkText.includes("console.log")) {
      suggestions.push({
        type: "best_practice",
        title: "Console log detected",
        description: "Consider removing console.log statements before production use.",
        severity: "warning",
        hunkIndex: hunks.indexOf(hunk),
      });
    }
  }

  for (let i = 0; i < removedHunks.length; i++) {
    const hunk = removedHunks[i];
    const hunkText = hunk.lines.join("\n");

    if (hunkText.includes("var ")) {
      suggestions.push({
        type: "best_practice",
        title: "Removed var declaration",
        description: "Good: var was replaced. Prefer const and let over var for better scoping.",
        severity: "info",
        hunkIndex: hunks.indexOf(hunk),
      });
    }
  }

  if (modified.length < original.length * 0.7) {
    suggestions.push({
      type: "readability",
      title: "Significant code reduction",
      description: "The code was significantly shortened. Verify no critical logic was removed.",
      severity: "warning",
      hunkIndex: -1,
    });
  }

  return suggestions;
}