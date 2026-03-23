import { useEffect, useRef, useState } from "react";
import {
  buildWaveformFrame,
  type WaveformBarFrame,
  type WaveformVariant,
} from "../lib/waveform-motion";

type WaveformProps = {
  level: number;
  variant: WaveformVariant;
};

const PHASE_SPEED: Record<WaveformVariant, number> = {
  listening: 3.4,
  speaking: 2.8,
  processing: 1.65,
};

const SMOOTHING_FACTOR: Record<WaveformVariant, number> = {
  listening: 0.24,
  speaking: 0.18,
  processing: 0.12,
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function easeTowards(current: number, target: number, factor: number, deltaMs: number): number {
  const frameFactor = 1 - Math.pow(1 - factor, deltaMs / 16.667);

  return current + (target - current) * frameFactor;
}

export function Waveform({ level, variant }: WaveformProps) {
  const [frame, setFrame] = useState<WaveformBarFrame[]>(() =>
    buildWaveformFrame({
      variant,
      signal: clamp(level),
      phase: 0,
    }),
  );
  const phaseRef = useRef(0);
  const signalRef = useRef(clamp(level));
  const displaySignalRef = useRef(clamp(level));

  useEffect(() => {
    signalRef.current = clamp(level);
  }, [level]);

  useEffect(() => {
    phaseRef.current = 0;
    displaySignalRef.current = clamp(level);
    setFrame(
      buildWaveformFrame({
        variant,
        signal: clamp(level),
        phase: 0,
      }),
    );
  }, [level, variant]);

  useEffect(() => {
    let animationFrameId = 0;
    let lastFrameTime = performance.now();

    const updateFrame = (now: number) => {
      const deltaMs = Math.min(64, now - lastFrameTime);
      lastFrameTime = now;
      displaySignalRef.current = easeTowards(
        displaySignalRef.current,
        signalRef.current,
        SMOOTHING_FACTOR[variant],
        deltaMs,
      );
      phaseRef.current += (deltaMs / 1000) * PHASE_SPEED[variant];

      setFrame(
        buildWaveformFrame({
          variant,
          signal: displaySignalRef.current,
          phase: phaseRef.current,
        }),
      );

      animationFrameId = window.requestAnimationFrame(updateFrame);
    };

    animationFrameId = window.requestAnimationFrame(updateFrame);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [variant]);

  return (
    <div
      className={`voice-waveform voice-waveform--${variant}`}
      data-testid="voice-waveform"
      data-variant={variant}
      aria-hidden="true"
    >
      {frame.map((bar, index) => {
        return (
          <span
            key={`${variant}-${index}`}
            className="voice-waveform__bar"
            data-palette={bar.palette}
            style={{
              height: `${bar.height}px`,
              opacity: bar.opacity,
              backgroundImage: bar.background,
            }}
          />
        );
      })}
    </div>
  );
}
