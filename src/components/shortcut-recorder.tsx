import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EMPTY_SHORTCUT_LABEL,
  formatShortcutDisplay,
  getShortcutValidationError,
  normalizeShortcutCandidate,
  type ShortcutCandidate,
} from "../lib/shortcut-format";

type ShortcutRecorderProps = {
  value: string | null;
  onChange: (value: string) => void;
  onError?: (message: string | null) => void;
};

function toCandidate(event: Pick<KeyboardEvent, "metaKey" | "ctrlKey" | "altKey" | "shiftKey" | "code" | "key">): ShortcutCandidate | null {
  const modifiers = [
    event.metaKey ? "CommandOrControl" : null,
    event.ctrlKey && !event.metaKey ? "Control" : null,
    event.altKey ? "Alt" : null,
    event.shiftKey ? "Shift" : null,
  ].filter((value): value is string => Boolean(value));

  const modifierCodes = new Set([
    "ShiftLeft",
    "ShiftRight",
    "AltLeft",
    "AltRight",
    "MetaLeft",
    "MetaRight",
    "ControlLeft",
    "ControlRight",
  ]);

  if (modifierCodes.has(event.code)) {
    return null;
  }

  return {
    modifiers,
    key: event.code || event.key,
  };
}

export function ShortcutRecorder({
  value,
  onChange,
  onError,
}: ShortcutRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const fieldRef = useRef<HTMLButtonElement | null>(null);
  const label = useMemo(() => {
    if (value) {
      return formatShortcutDisplay(value);
    }

    return EMPTY_SHORTCUT_LABEL;
  }, [value]);
  const hint = isRecording
    ? "Press the keys you want Scout to use. Escape cancels."
    : "Click to record a global shortcut.";
  const commitKeyDown = useCallback((
    event: Pick<
      KeyboardEvent,
      | "key"
      | "code"
      | "metaKey"
      | "ctrlKey"
      | "altKey"
      | "shiftKey"
      | "preventDefault"
      | "stopPropagation"
    >,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onError?.(null);
      setIsRecording(false);
      return;
    }

    const candidate = toCandidate(event);

    if (!candidate) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const validationError = getShortcutValidationError(candidate);
    if (validationError) {
      onError?.(validationError);
      setIsRecording(false);
      return;
    }

    onError?.(null);
    onChange(normalizeShortcutCandidate(candidate));
    setIsRecording(false);
  }, [onChange, onError]);

  useEffect(() => {
    if (!isRecording) {
      return;
    }

    fieldRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      commitKeyDown(event);
    };

    const handleWindowBlur = () => {
      setIsRecording(false);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [commitKeyDown, isRecording]);

  return (
    <div className="shortcut-recorder">
      <button
        aria-label="Record shortcut"
        className="shortcut-recorder__field"
        data-recording={isRecording ? "true" : "false"}
        ref={fieldRef}
        type="button"
        onKeyDown={(event) => {
          if (!isRecording) {
            return;
          }

          commitKeyDown(event.nativeEvent);
        }}
        onClick={() => {
          onError?.(null);
          setIsRecording(true);
        }}
      >
        <span className="shortcut-recorder__value">
          {isRecording ? "Press shortcut…" : label}
        </span>
        <span className="shortcut-recorder__badge">
          {isRecording ? "Recording" : "Change"}
        </span>
      </button>
      <p className="shortcut-recorder__hint">{hint}</p>
    </div>
  );
}
