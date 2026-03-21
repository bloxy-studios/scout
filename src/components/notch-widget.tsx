import { useMemo, useState } from "react";
import { useScout } from "../hooks/use-scout";
import { setWindowInteractivity } from "../lib/window-interactivity";
import { ScoutLogo } from "./ScoutLogo";
import { ScoutBadge } from "./scout-badge";
import { StatusText } from "./status-text";
import { Waveform } from "./waveform";

const NOTCH_DIMENSIONS = {
  idle: { width: 122, height: 34 },
  listening: { width: 356, height: 58 },
  processing: { width: 224, height: 44 },
  searching: { width: 244, height: 44 },
  speaking: { width: 356, height: 58 },
  error: { width: 296, height: 48 },
} as const;

export function NotchWidget() {
  const { state, notchState, audioLevel, activateScout } = useScout();
  const [isHovering, setIsHovering] = useState(false);

  const dimensions = NOTCH_DIMENSIONS[notchState];
  const content = useMemo(() => {
    switch (notchState) {
      case "idle":
        return <ScoutBadge />;
      case "listening":
        return (
          <div className="voice-cluster">
            <ScoutLogo className="scout-logo scout-logo--active" />
            <Waveform level={audioLevel} />
          </div>
        );
      case "processing":
        return (
          <div className="status-cluster">
            <ScoutBadge className="scout-badge--small" />
            <StatusText text="Thinking…" />
          </div>
        );
      case "searching":
        return (
          <div className="status-cluster">
            <ScoutBadge className="scout-badge--small" />
            <StatusText text="Searching the web…" showSpinner />
          </div>
        );
      case "speaking":
        return (
          <div className="voice-cluster">
            <ScoutLogo className="scout-logo scout-logo--active" />
            <Waveform level={audioLevel} />
          </div>
        );
      case "error":
        return (
          <div className="status-cluster">
            <ScoutBadge className="scout-badge--small" />
            <StatusText
              text={state.errorMessage ?? "Scout hit an unexpected error."}
              tone="error"
            />
          </div>
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
