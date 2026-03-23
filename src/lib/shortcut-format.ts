export const EMPTY_SHORTCUT_LABEL = "No shortcut set";
export const MISSING_MODIFIER_MESSAGE = "Use at least one modifier key.";
export const TOO_MANY_KEYS_MESSAGE =
  "Use up to three keys total, including modifiers.";
export const RESERVED_SHORTCUT_MESSAGE =
  "That shortcut is reserved by macOS. Try another combination.";

const DISPLAY_TOKEN_MAP: Record<string, string> = {
  Alt: "\u2325",
  Option: "\u2325",
  Shift: "\u21e7",
  CommandOrControl: "\u2318",
  Command: "\u2318",
  Super: "\u2318",
  Control: "\u2303",
  Ctrl: "\u2303",
};

const MODIFIER_ORDER = ["CommandOrControl", "Command", "Super", "Control", "Ctrl", "Alt", "Option", "Shift"] as const;

export type ShortcutCandidate = {
  modifiers: string[];
  key: string;
};

const RESERVED_SHORTCUTS = new Set([
  "CommandOrControl+Space",
  "CommandOrControl+Tab",
  "CommandOrControl+Q",
  "CommandOrControl+W",
  "CommandOrControl+Alt+Escape",
  "CommandOrControl+Shift+3",
  "CommandOrControl+Shift+4",
  "CommandOrControl+Shift+5",
]);

function normalizeKeyToken(key: string): string {
  if (key.startsWith("Key")) {
    return key.slice(3).toUpperCase();
  }

  if (key.startsWith("Digit")) {
    return key.slice(5);
  }

  return key.length === 1 ? key.toUpperCase() : key;
}

export function isValidShortcutCandidate(candidate: ShortcutCandidate): boolean {
  return getShortcutValidationError(candidate) === null;
}

export function normalizeShortcutCandidate(
  candidate: ShortcutCandidate,
): string {
  const normalizedModifiers = [...candidate.modifiers].sort((left, right) => {
    const leftIndex = MODIFIER_ORDER.indexOf(left as (typeof MODIFIER_ORDER)[number]);
    const rightIndex = MODIFIER_ORDER.indexOf(right as (typeof MODIFIER_ORDER)[number]);

    return leftIndex - rightIndex;
  });

  return [...normalizedModifiers, normalizeKeyToken(candidate.key)].join("+");
}

export function formatShortcutDisplay(shortcut?: string | null): string {
  if (!shortcut) {
    return EMPTY_SHORTCUT_LABEL;
  }

  return shortcut
    .split("+")
    .filter(Boolean)
    .map((token) => DISPLAY_TOKEN_MAP[token] ?? normalizeKeyToken(token))
    .join("");
}

export function getShortcutValidationError(
  candidate: ShortcutCandidate,
): string | null {
  if (candidate.modifiers.length === 0 || candidate.key.trim().length === 0) {
    return MISSING_MODIFIER_MESSAGE;
  }

  if (candidate.modifiers.length + 1 > 3) {
    return TOO_MANY_KEYS_MESSAGE;
  }

  const normalized = normalizeShortcutCandidate(candidate);

  if (RESERVED_SHORTCUTS.has(normalized)) {
    return RESERVED_SHORTCUT_MESSAGE;
  }

  return null;
}
