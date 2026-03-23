import { useLayoutEffect, useMemo, useState } from "react";
import { useScout } from "../hooks/use-scout";
import {
  setNotchWindowSize,
  setWindowInteractivity,
} from "../lib/window-interactivity";
import { ScoutLogo } from "./ScoutLogo";
import { ScoutBadge } from "./scout-badge";
import { StatusText } from "./status-text";
import { Waveform } from "./waveform";

const NOTCH_DIMENSIONS = {
  idle: { width: 132, height: 36 },
  listening: { width: 290, height: 62 },
  processing: { width: 290, height: 62 },
  searching: { width: 290, height: 62 },
  speaking: { width: 290, height: 62 },
  error: { width: 328, height: 64 },
} as const;

export function NotchWidget() {
  const { state, notchState, audioLevel, activateScout } = useScout();
  const [isHovering, setIsHovering] = useState(false);
  const visualNotchState =
    state.sessionActive || notchState === "error" ? notchState : "idle";

  const dimensions = NOTCH_DIMENSIONS[visualNotchState];

  useLayoutEffect(() => {
    void setNotchWindowSize(dimensions.width, dimensions.height);
  }, [dimensions.height, dimensions.width]);

  const content = useMemo(() => {
    switch (visualNotchState) {
      case "idle":
        return <ScoutBadge />;
      case "listening":
        return (
          <div className="voice-cluster" data-testid="voice-cluster">
            <ScoutLogo className="scout-logo scout-logo--active" />
            <Waveform level={audioLevel} variant="listening" />
          </div>
        );
      case "processing":
        return (
          <div className="status-cluster">
            <ScoutBadge className="scout-badge--small" />
            <Waveform level={audioLevel} variant="processing" />
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
          <div className="voice-cluster" data-testid="voice-cluster">
            <ScoutLogo className="scout-logo scout-logo--active" />
            <Waveform level={audioLevel} variant="speaking" />
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
  }, [audioLevel, state.errorMessage, visualNotchState]);

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
        <div
          className={`notch-shell notch-shell--${visualNotchState} ${
            isHovering ? "is-hovering" : ""
          }`}
          data-testid="notch-shell"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
          }}
        >
          {visualNotchState === "idle" ? (
            <button
              className="notch-shell__hotspot notch-shell__hotspot--idle"
              type="button"
              onDoubleClick={() => {
                if (import.meta.env.DEV) {
                  void activateScout();
                }
              }}
            >
              {content}
            </button>
          ) : (
            <button
              className="notch-rail"
              data-testid="notch-rail"
              type="button"
              onDoubleClick={() => {
                if (import.meta.env.DEV) {
                  void activateScout();
                }
              }}
            >
              {content}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
