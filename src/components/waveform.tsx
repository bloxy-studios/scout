const BAR_COUNT = 12;

type WaveformProps = {
  level: number;
  label: string;
};

export function Waveform({ level, label }: WaveformProps) {
  return (
    <div className="waveform-wrap">
      <span className="waveform-label">{label}</span>
      <div className="waveform" aria-hidden="true">
        {Array.from({ length: BAR_COUNT }, (_, index) => {
          const offset = Math.abs(index - (BAR_COUNT - 1) / 2);
          const height = 16 + Math.max(0, level * 30 - offset * 3);

          return (
            <span
              key={index}
              className="waveform-bar"
              style={{ height: `${height}px` }}
            />
          );
        })}
      </div>
    </div>
  );
}
