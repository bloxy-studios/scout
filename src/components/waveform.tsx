type WaveformProps = {
  level: number;
};

const BAR_PROFILE = [
  0.26, 0.84, 1.0, 0.68, 0.34, 0.16, 0.2, 0.16, 0.28, 0.52, 0.3, 0.2, 0.34,
  0.78, 0.56, 0.22, 0.18, 0.22, 0.34, 0.62, 0.9, 0.54, 0.28, 0.16,
] as const;

export function Waveform({ level }: WaveformProps) {
  const intensity = Math.max(0.12, Math.min(1, level * 1.4 + 0.18));

  return (
    <div className="voice-waveform" data-testid="voice-waveform" aria-hidden="true">
      {BAR_PROFILE.map((shape, index) => {
        const height = 8 + shape * 34 * intensity;
        const opacity = 0.32 + shape * 0.68;

        return (
          <span
            key={index}
            className="voice-waveform__bar"
            style={{
              height: `${height}px`,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
}
