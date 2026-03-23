import { invoke } from "@tauri-apps/api/core";

export async function setWindowInteractivity(
  interactive: boolean,
): Promise<void> {
  try {
    await invoke("set_window_interactivity", { interactive });
  } catch {
    // No-op outside the Tauri runtime.
  }
}

export async function setNotchWindowSize(
  width: number,
  height: number,
): Promise<void> {
  try {
    await invoke("set_notch_window_size", { width, height });
  } catch {
    // No-op outside the Tauri runtime.
  }
}
