import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
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

export function PreferencesWindow() {
  const [settings, setSettings] = useState<ShortcutSettings>(EMPTY_SETTINGS);
  const [draftAccelerator, setDraftAccelerator] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const hasUnsavedChanges = draftAccelerator !== settings.accelerator;
  const heading = settings.hasCompletedSetup
    ? "Keyboard Shortcut"
    : "Set Up Scout Shortcut";
  const description = settings.hasCompletedSetup
    ? "Choose the global shortcut Scout should listen for from anywhere on your Mac."
    : "Choose one global shortcut to start and stop Scout from anywhere on your Mac.";

  return (
    <main className="preferences-window">
      <section className="preferences-window__content">
        <header className="preferences-window__header">
          <p className="preferences-window__eyebrow">Scout Preferences</p>
          <h1>{heading}</h1>
          <p className="preferences-window__description">{description}</p>
        </header>

        <section className="preferences-window__panel" aria-labelledby="activation-shortcut-heading">
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
            {settings.hasCompletedSetup
              ? "Changes save on this Mac only."
              : "Scout needs one shortcut before it can be triggered manually."}
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
