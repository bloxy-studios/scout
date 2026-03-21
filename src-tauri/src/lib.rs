mod windowing;

#[cfg(test)]
mod windowing_tests;

use std::io::Error as IoError;
use std::sync::{Arc, Mutex};

use tauri::{Manager, State, WebviewWindow};

#[derive(Debug, Default)]
struct WindowInteractivityState {
    force_interactive: bool,
}

#[tauri::command]
fn set_window_interactivity(
    window: WebviewWindow,
    state: State<'_, Arc<Mutex<WindowInteractivityState>>>,
    interactive: bool,
) -> Result<(), String> {
    {
        let mut guard = state.lock().map_err(|_| "interactivity state lock poisoned")?;
        guard.force_interactive = interactive;
    }

    windowing::sync_window_interactivity(&window, interactive)
}

#[tauri::command]
fn set_notch_window_size(
    window: WebviewWindow,
    width: u32,
    height: u32,
) -> Result<(), String> {
    windowing::resize_notch_window(&window, width, height)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let interactivity_state = Arc::new(Mutex::new(WindowInteractivityState::default()));

    tauri::Builder::default()
        .manage(interactivity_state)
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let notch_window = app
                .get_webview_window("notch")
                .ok_or_else(|| IoError::other("notch window was not created"))?;

            windowing::configure_notch_window(&notch_window).map_err(IoError::other)?;
            windowing::start_cursor_sync(
                notch_window,
                app.state::<Arc<Mutex<WindowInteractivityState>>>()
                    .inner()
                    .clone(),
            );

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_window_interactivity,
            set_notch_window_size
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
