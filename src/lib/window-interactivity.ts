import { invoke } from "@tauri-apps/api/core";

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function setWindowInteractivity(
  interactive: boolean,
): Promise<void> {
  if (!isTauriRuntime()) {
    return;
  }

  await invoke("set_window_interactivity", { interactive });
}
