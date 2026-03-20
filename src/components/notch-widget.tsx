import { useMemo, useState } from "react";
import { useScout } from "../hooks/use-scout";
import { setWindowInteractivity } from "../lib/window-interactivity";
import { IdleDot } from "./idle-dot";
import { StatusText } from "./status-text";
import { Waveform } from "./waveform";

const NOTCH_DIMENSIONS = {
  idle: { width: 120, height: 36 },
  listening: { width: 340, height: 56 },
  processing: { width: 260, height: 48 },
  searching: { width: 280, height: 48 },
  speaking: { width: 340, height: 56 },
  error: { width: 320, height: 52 },
} as const;

export function NotchWidget() {
  const { state, notchState, audioLevel, activateScout } = useScout();
  const [isHovering, setIsHovering] = useState(false);

  const dimensions = NOTCH_DIMENSIONS[notchState];
  const content = useMemo(() => {
    switch (notchState) {
      case "idle":
        return <IdleDot />;
      case "listening":
        return <Waveform level={audioLevel} label="Listening…" />;
      case "processing":
        return <StatusText text="Thinking…" />;
      case "searching":
        return <StatusText text="Searching the web…" showSpinner />;
      case "speaking":
        return <Waveform level={audioLevel} label="Scout is speaking" />;
      case "error":
        return (
          <StatusText
            text={state.errorMessage ?? "Scout hit an unexpected error."}
            tone="error"
          />
        );
      default:
        return null;
    }
  }, [audioLevel, notchState, state.errorMessage]);

  return (
    <div className="scout-app">
      <div
        className="notch-anchor"
        onMouseEnter={() => {
          setIsHovering(true);
          void setWindowInteractivity(true);
        }}
        onMouseLeave={() => {
          setIsHovering(false);
          void setWindowInteractivity(false);
        }}
      >
        <button
          className={`notch-widget notch-widget--${notchState} ${
            isHovering ? "is-hovering" : ""
          }`}
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
          }}
          type="button"
          onDoubleClick={() => {
            if (import.meta.env.DEV) {
              void activateScout();
            }
          }}
        >
          {content}
        </button>
      </div>
    </div>
  );
}
