import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import { ShortcutRecorder } from "./shortcut-recorder";

export type ShortcutSettings = {
  enabled: boolean;
  accelerator: string | null;
  hasCompletedSetup: boolean;
};

const EMPTY_SETTINGS: ShortcutSettings = {
  enabled: false,
  accelerator: null,
  hasCompletedSetup: false,
};

type MicPermissionState = "prompt" | "granted" | "denied" | "checking";

function useMicPermission(): {
  state: MicPermissionState;
  request: () => Promise<void>;
} {
  const [state, setState] = useState<MicPermissionState>("checking");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const result = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });

        if (!cancelled) {
          setState(result.state as MicPermissionState);
        }

        result.addEventListener("change", () => {
          if (!cancelled) {
            setState(result.state as MicPermissionState);
          }
        });
      } catch {
        if (!cancelled) {
          setState("prompt");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const request = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      setState("granted");
    } catch {
      setState("denied");
    }
  }, []);

  return { state, request };
}

function StepIndicator({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="onboarding-steps" role="navigation" aria-label="Setup progress">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`onboarding-steps__dot${i + 1 === current ? " onboarding-steps__dot--active" : ""}${i + 1 < current ? " onboarding-steps__dot--complete" : ""}`}
          aria-current={i + 1 === current ? "step" : undefined}
        />
      ))}
    </div>
  );
}

function MicPermissionPanel({
  micState,
  onRequest,
}: {
  micState: MicPermissionState;
  onRequest: () => void;
}) {
  return (
    <section className="preferences-window__panel" aria-labelledby="mic-permission-heading">
      <div className="preferences-window__mic-row">
        <div className="preferences-window__mic-icon" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z"
              fill={micState === "granted" ? "rgba(52, 199, 89, 0.85)" : "rgba(255, 255, 255, 0.72)"}
            />
            <path
              d="M19 10v2a7 7 0 0 1-14 0v-2"
              stroke={micState === "granted" ? "rgba(52, 199, 89, 0.85)" : "rgba(255, 255, 255, 0.72)"}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <line
              x1="12" y1="19" x2="12" y2="23"
              stroke={micState === "granted" ? "rgba(52, 199, 89, 0.85)" : "rgba(255, 255, 255, 0.72)"}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="8" y1="23" x2="16" y2="23"
              stroke={micState === "granted" ? "rgba(52, 199, 89, 0.85)" : "rgba(255, 255, 255, 0.72)"}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="preferences-window__label-stack">
          <h2 id="mic-permission-heading">Microphone Access</h2>
          <p className="preferences-window__helper">
            {micState === "granted"
              ? "Microphone access is enabled. Scout can hear you."
              : micState === "denied"
                ? "Microphone access was denied. Enable it in System Settings > Privacy & Security > Microphone."
                : "Scout needs your microphone for voice conversations and wake-word detection."}
          </p>
        </div>
      </div>

      {micState !== "granted" ? (
        <button
          className="preferences-window__button preferences-window__button--primary preferences-window__button--wide"
          type="button"
          disabled={micState === "checking"}
          onClick={onRequest}
        >
          {micState === "denied" ? "Try Again" : "Allow Microphone"}
        </button>
      ) : (
        <div className="preferences-window__permission-granted">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="rgba(52, 199, 89, 0.92)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Permission granted</span>
        </div>
      )}
    </section>
  );
}

export function PreferencesWindow() {
  const [settings, setSettings] = useState<ShortcutSettings>(EMPTY_SETTINGS);
  const [draftAccelerator, setDraftAccelerator] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const { state: micState, request: requestMic } = useMicPermission();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const loaded = await invoke<ShortcutSettings>("get_shortcut_settings");

        if (cancelled) {
          return;
        }

        setSettings(loaded);
        setDraftAccelerator(loaded.accelerator);
        setIsOnboarding(!loaded.hasCompletedSetup);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load shortcut settings.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const persistSettings = async (nextSettings: ShortcutSettings) => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const saved = await invoke<ShortcutSettings>("save_shortcut_settings", {
        settings: nextSettings,
      });

      setSettings(saved);
      setDraftAccelerator(saved.accelerator);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save shortcut settings.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const saveShortcut = async () => {
    if (!draftAccelerator) {
      return;
    }

    await persistSettings({
      enabled: true,
      accelerator: draftAccelerator,
      hasCompletedSetup: true,
    });
  };

  if (isLoading) {
    return (
      <main className="preferences-window">
        <div className="preferences-window__content preferences-window__content--loading">
          Loading preferences…
        </div>
      </main>
    );
  }

  if (isOnboarding) {
    return (
      <main className="preferences-window">
        <section className="preferences-window__content">
          <header className="preferences-window__header">
            <StepIndicator current={onboardingStep} total={2} />
            <p className="preferences-window__eyebrow">Welcome to Scout</p>
            <h1>
              {onboardingStep === 1
                ? "Set Up Your Shortcut"
                : "Microphone Permission"}
            </h1>
            <p className="preferences-window__description">
              {onboardingStep === 1
                ? "Choose a global shortcut to activate Scout from anywhere on your Mac."
                : "Scout needs microphone access to listen and have voice conversations."}
            </p>
          </header>

          {onboardingStep === 1 ? (
            <>
              <section
                className="preferences-window__panel"
                aria-labelledby="activation-shortcut-heading"
              >
                <div className="preferences-window__row">
                  <div className="preferences-window__label-stack">
                    <h2 id="activation-shortcut-heading">Activation Shortcut</h2>
                    <p className="preferences-window__helper">
                      Works globally, even when Scout is in the background.
                    </p>
                  </div>
                  <ShortcutRecorder
                    value={draftAccelerator}
                    onChange={(value) => {
                      setDraftAccelerator(value);
                      setErrorMessage(null);
                    }}
                    onError={setErrorMessage}
                  />
                </div>

                {errorMessage ? (
                  <p className="preferences-window__error" role="alert">
                    {errorMessage}
                  </p>
                ) : null}
              </section>

              <footer className="preferences-window__actions">
                <p className="preferences-window__footer-copy">
                  Step 1 of 2
                </p>
                <div />
                <button
                  className="preferences-window__button preferences-window__button--primary"
                  disabled={!draftAccelerator || isSaving || Boolean(errorMessage)}
                  type="button"
                  onClick={() => {
                    void (async () => {
                      await saveShortcut();
                      setOnboardingStep(2);
                    })();
                  }}
                >
                  {isSaving ? "Saving…" : "Continue"}
                </button>
              </footer>
            </>
          ) : (
            <>
              <MicPermissionPanel
                micState={micState}
                onRequest={() => {
                  void requestMic();
                }}
              />

              <footer className="preferences-window__actions">
                <p className="preferences-window__footer-copy">
                  Step 2 of 2
                </p>
                <button
                  className="preferences-window__button preferences-window__button--secondary"
                  type="button"
                  onClick={() => {
                    setOnboardingStep(1);
                  }}
                >
                  Back
                </button>
                <button
                  className="preferences-window__button preferences-window__button--primary"
                  type="button"
                  onClick={() => {
                    setIsOnboarding(false);
                  }}
                >
                  {micState === "granted" ? "Done" : "Skip for Now"}
                </button>
              </footer>
            </>
          )}
        </section>
      </main>
    );
  }

  const hasUnsavedChanges = draftAccelerator !== settings.accelerator;

  return (
    <main className="preferences-window">
      <section className="preferences-window__content">
        <header className="preferences-window__header">
          <p className="preferences-window__eyebrow">Scout Preferences</p>
          <h1>Keyboard Shortcut</h1>
          <p className="preferences-window__description">
            Choose the global shortcut Scout should listen for from anywhere on
            your Mac.
          </p>
        </header>

        <section
          className="preferences-window__panel"
          aria-labelledby="activation-shortcut-heading"
        >
          <div className="preferences-window__row">
            <div className="preferences-window__label-stack">
              <h2 id="activation-shortcut-heading">Activation Shortcut</h2>
              <p className="preferences-window__helper">
                Works globally, even when Scout is in the background.
              </p>
            </div>
            <ShortcutRecorder
              value={draftAccelerator}
              onChange={(value) => {
                setDraftAccelerator(value);
                setErrorMessage(null);
              }}
              onError={setErrorMessage}
            />
          </div>

          {errorMessage ? (
            <p className="preferences-window__error" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </section>

        <MicPermissionPanel
          micState={micState}
          onRequest={() => {
            void requestMic();
          }}
        />

        <footer className="preferences-window__actions">
          <p className="preferences-window__footer-copy">
            Changes save on this Mac only.
          </p>
          <button
            className="preferences-window__button preferences-window__button--secondary"
            disabled={isSaving || (!hasUnsavedChanges && !errorMessage)}
            type="button"
            onClick={() => {
              setDraftAccelerator(settings.accelerator);
              setErrorMessage(null);
            }}
          >
            Revert
          </button>
          <button
            className="preferences-window__button preferences-window__button--primary"
            disabled={!draftAccelerator || isSaving || Boolean(errorMessage)}
            type="button"
            onClick={() => {
              void saveShortcut();
            }}
          >
            Save
          </button>
        </footer>
      </section>
    </main>
  );
}
