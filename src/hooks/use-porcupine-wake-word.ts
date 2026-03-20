import {
  PorcupineWorker,
  type PorcupineDetection,
} from "@picovoice/porcupine-web";
import {
  VuMeterEngine,
  WebVoiceProcessor,
  browserCompatibilityCheck,
} from "@picovoice/web-voice-processor";
import { useEffect, useEffectEvent, useRef } from "react";
import type { ScoutEnvConfig } from "../config/env";
import { normalizeVuMeter, shouldTriggerWakeWord } from "../lib/wake-word";

const DEFAULT_COOLDOWN_MS = 5_000;

type UsePorcupineWakeWordOptions = {
  config: ScoutEnvConfig | null;
  isSessionActive: boolean;
  onDetected: () => void | Promise<void>;
  onLevelChange: (level: number) => void;
  onError: (message: string) => void;
};

export function usePorcupineWakeWord({
  config,
  isSessionActive,
  onDetected,
  onLevelChange,
  onError,
}: UsePorcupineWakeWordOptions): void {
  const lastDetectedAtRef = useRef(0);
  const onDetectedEvent = useEffectEvent(onDetected);
  const onLevelChangeEvent = useEffectEvent(onLevelChange);
  const onErrorEvent = useEffectEvent(onError);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!import.meta.env.DEV) {
        return;
      }

      if (event.altKey && event.code === "Space") {
        void onDetectedEvent();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onDetectedEvent]);

  useEffect(() => {
    if (!config || isSessionActive) {
      void WebVoiceProcessor.reset();
      onLevelChangeEvent(0);
      return;
    }

    const compatibility = browserCompatibilityCheck();

    if (!compatibility._picovoice) {
      onErrorEvent(
        "Wake word is unavailable in this browser context. Use the hidden Alt+Space fallback in development.",
      );
      return;
    }

    let disposed = false;
    let worker: PorcupineWorker | null = null;
    let vuMeter: VuMeterEngine | null = null;

    const handleDetection = async (_detection: PorcupineDetection) => {
      const now = Date.now();

      if (
        !shouldTriggerWakeWord({
          isSessionActive,
          lastDetectedAt: lastDetectedAtRef.current,
          now,
          cooldownMs: DEFAULT_COOLDOWN_MS,
        })
      ) {
        return;
      }

      lastDetectedAtRef.current = now;
      await onDetectedEvent();
    };

    void (async () => {
      try {
        worker = await PorcupineWorker.create(
          config.picovoice.accessKey,
          config.picovoice.keyword,
          (detection) => {
            void handleDetection(detection);
          },
          config.picovoice.model,
          {
            processErrorCallback: (error) => {
              onErrorEvent(error.message);
            },
          },
        );

        vuMeter = new VuMeterEngine((db) => {
          onLevelChangeEvent(normalizeVuMeter(db));
        });

        await WebVoiceProcessor.subscribe([worker, vuMeter]);
      } catch (error) {
        if (!disposed) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to initialize wake word detection.";
          onErrorEvent(message);
        }
      }
    })();

    return () => {
      disposed = true;
      onLevelChangeEvent(0);

      void (async () => {
        const engines = [worker, vuMeter].filter(Boolean);

        if (engines.length > 0) {
          await WebVoiceProcessor.unsubscribe(
            engines as [PorcupineWorker | VuMeterEngine],
          ).catch(() => undefined);
        }

        if (worker) {
          await worker.release().catch(() => undefined);
          worker.terminate();
        }
      })();
    };
  }, [
    config,
    isSessionActive,
    onDetectedEvent,
    onErrorEvent,
    onLevelChangeEvent,
  ]);
}
