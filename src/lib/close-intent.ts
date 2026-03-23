const CLOSE_INTENT_PATTERNS = [
  /^(?:bye|goodbye|see you(?: later)?|talk to you later|take care)$/,
  /^(?:that(?:'s| is) (?:it|all)|that(?:'s| is) what i needed)$/,
  /^(?:i(?:'m| am) done|we(?:'re| are) done|all set|i(?:'m| am) good)$/,
  /^(?:no thanks|no thank you)$/,
  /^(?:thanks|thank you)(?: so much)? (?:that(?:'s| is) (?:it|all)|i(?:'m| am) done|we(?:'re| are) done|that(?:'s| is) what i needed)$/,
  /^(?:that(?:'s| is) all i needed|that(?:'s| is) what i needed thanks)$/,
] as const;

const CONTINUATION_PATTERNS = [
  /that(?:'s| is) all the context/,
  /that(?:'s| is) all .* (?:now|and|but) /,
  /i(?:'m| am) done with that part/,
  /(?:here(?:'s| is)|now|and|but) .* (?:question|help|need|want)/,
  /one more thing/,
] as const;

function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9?' ]+/g, " ")
    .replace(/\s+/g, " ");
}

export function detectCloseIntent(text: string): boolean {
  if (!text.trim()) {
    return false;
  }

  if (text.includes("?")) {
    return false;
  }

  const normalized = normalizeText(text);

  if (CONTINUATION_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return false;
  }

  return CLOSE_INTENT_PATTERNS.some((pattern) => pattern.test(normalized));
}

function extractStringCandidate(value: unknown, depth = 0): string {
  if (depth > 4 || value == null) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const candidate = extractStringCandidate(item, depth + 1);

      if (candidate) {
        return candidate;
      }
    }

    return "";
  }

  if (typeof value === "object") {
    const candidateKeys = ["text", "message", "transcript", "content"] as const;

    for (const key of candidateKeys) {
      if (key in value) {
        const candidate = extractStringCandidate(
          (value as Record<string, unknown>)[key],
          depth + 1,
        );

        if (candidate) {
          return candidate;
        }
      }
    }
  }

  return "";
}

export function extractTranscriptText(event: unknown): string {
  return extractStringCandidate(event);
}
