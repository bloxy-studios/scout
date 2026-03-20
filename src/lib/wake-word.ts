export type WakeWordGateInput = {
  isSessionActive: boolean;
  lastDetectedAt: number;
  now: number;
  cooldownMs: number;
};

export function shouldTriggerWakeWord({
  isSessionActive,
  lastDetectedAt,
  now,
  cooldownMs,
}: WakeWordGateInput): boolean {
  if (isSessionActive) {
    return false;
  }

  return now - lastDetectedAt >= cooldownMs;
}

export function normalizeVuMeter(db: number): number {
  const normalized = (db + 96) / 96;
  return Math.min(1, Math.max(0, normalized));
}
