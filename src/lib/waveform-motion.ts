export type WaveformVariant = "listening" | "speaking" | "processing";

export type WaveformPalette = "light" | "brand";

export type WaveformBarFrame = {
  height: number;
  opacity: number;
  palette: WaveformPalette;
  background: string;
};

export const WAVEFORM_BAR_COUNT = 18;

const MAX_HEIGHT_BY_VARIANT: Record<WaveformVariant, number> = {
  listening: 30,
  speaking: 30,
  processing: 22,
};

const MIN_HEIGHT_BY_VARIANT: Record<WaveformVariant, number> = {
  listening: 6,
  speaking: 7,
  processing: 6,
};

const VARIANT_CONFIG = {
  listening: {
    palette: "light" as const,
    restFloor: 0.16,
    carrierWeight: 0.04,
    signalWeight: 1,
    opacityFloor: 0.42,
  },
  speaking: {
    palette: "brand" as const,
    restFloor: 0.22,
    carrierWeight: 0.24,
    signalWeight: 0.82,
    opacityFloor: 0.5,
  },
  processing: {
    palette: "brand" as const,
    restFloor: 0.14,
    carrierWeight: 0.12,
    signalWeight: 0.34,
    opacityFloor: 0.44,
  },
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function mixHex(from: string, to: string, amount: number): string {
  const [fromR, fromG, fromB] = hexToRgb(from);
  const [toR, toG, toB] = hexToRgb(to);
  const factor = clamp(amount);

  const red = Math.round(fromR + (toR - fromR) * factor);
  const green = Math.round(fromG + (toG - fromG) * factor);
  const blue = Math.round(fromB + (toB - fromB) * factor);

  return `rgb(${red}, ${green}, ${blue})`;
}

function createLightBackground(index: number): string {
  const tint = 0.08 + (index / (WAVEFORM_BAR_COUNT - 1)) * 0.08;
  const top = `rgba(255, 255, 255, ${0.96 - tint * 0.2})`;
  const bottom = `rgba(255, 255, 255, ${0.72 - tint * 0.18})`;

  return `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`;
}

function createBrandBackground(index: number, phase: number): string {
  const sweep = (Math.sin(phase * 0.55 + index * 0.34) + 1) / 2;
  const top = mixHex("#eef0ff", "#c7cbff", 0.25 + sweep * 0.55);
  const bottom = mixHex("#7f85ef", "#5558e3", 0.32 + sweep * 0.5);

  return `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`;
}

export function buildWaveformFrame({
  variant,
  signal,
  phase,
}: {
  variant: WaveformVariant;
  signal: number;
  phase: number;
}): WaveformBarFrame[] {
  const config = VARIANT_CONFIG[variant];
  const normalizedSignal = clamp(signal);

  return Array.from({ length: WAVEFORM_BAR_COUNT }, (_, index) => {
    const position = index / (WAVEFORM_BAR_COUNT - 1);
    const centered = 1 - Math.abs(position - 0.5) / 0.5;
    const dome = 0.34 + centered * 0.66;
    const waveA = (Math.sin(phase * 1.8 + index * 0.58) + 1) / 2;
    const waveB = (Math.sin(phase * 1.15 - index * 0.41 + 1.2) + 1) / 2;
    const waveC =
      (Math.sin(phase * 2.45 + index * 0.22 + Math.cos(phase * 0.4)) + 1) / 2;
    const waveMix = waveA * 0.5 + waveB * 0.32 + waveC * 0.18;
    const bias = 0.93 + Math.sin(index * 0.63 + 0.8) * 0.07;
    const rest = config.restFloor * (0.56 + waveMix * 0.44);
    const carrier = config.carrierWeight * (0.35 + waveB * 0.65);
    const dynamic =
      normalizedSignal * config.signalWeight * (0.4 + waveMix * 0.6);
    const energy = clamp((rest + carrier + dynamic) * dome * bias);
    const height =
      MIN_HEIGHT_BY_VARIANT[variant] +
      energy *
        (MAX_HEIGHT_BY_VARIANT[variant] - MIN_HEIGHT_BY_VARIANT[variant]);
    const opacity =
      config.opacityFloor + (0.98 - config.opacityFloor) * clamp(rest + dynamic + carrier * 0.5);

    return {
      height,
      opacity,
      palette: config.palette,
      background:
        config.palette === "light"
          ? createLightBackground(index)
          : createBrandBackground(index, phase),
    };
  });
}
