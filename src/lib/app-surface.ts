import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

export type AppSurface = "notch" | "preferences";

export function getAppSurface(): AppSurface {
  try {
    return getCurrentWebviewWindow().label === "preferences"
      ? "preferences"
      : "notch";
  } catch {
    return "notch";
  }
}
