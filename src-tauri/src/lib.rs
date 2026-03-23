mod menu_actions;
mod preferences_window;
mod shortcut_manager;
mod shortcut_settings;
mod windowing;

#[cfg(test)]
mod windowing_tests;

use std::io::Error as IoError;
use std::sync::{Arc, Mutex};

use tauri::{
    image::Image,
    menu::Menu,
    tray::TrayIconBuilder,
    AppHandle, Emitter, Manager, State, WebviewWindow,
};
use tauri_plugin_global_shortcut::ShortcutState;

use crate::menu_actions::{
    action_event_for_menu_id, build_menu_handles, is_bring_all_to_front_item,
    is_preferences_item, is_quit_item, is_reload_item, is_toggle_devtools_item,
    quick_tray_action_for_active_state,
};
use crate::preferences_window::show_preferences_window;
use crate::shortcut_manager::{
    apply_shortcut_settings, register_saved_shortcut, toggle_request_event_name,
};
use crate::shortcut_settings::{
    load_shortcut_settings, save_shortcut_settings as persist_shortcut_settings,
    ShortcutSettings,
};

#[derive(Debug, Default)]
struct WindowInteractivityState {
    force_interactive: bool,
}

type ShortcutSettingsState = Arc<Mutex<ShortcutSettings>>;
type ScoutMenuStateHandle = Arc<Mutex<ScoutMenuState>>;

#[derive(Clone)]
struct ScoutMenuState {
    active: bool,
    start_item: tauri::menu::MenuItem<tauri::Wry>,
    end_item: tauri::menu::MenuItem<tauri::Wry>,
    tray_toggle_item: tauri::menu::MenuItem<tauri::Wry>,
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

#[tauri::command]
fn get_shortcut_settings(
    state: State<'_, ShortcutSettingsState>,
) -> Result<ShortcutSettings, String> {
    state
        .lock()
        .map(|settings| settings.clone())
        .map_err(|_| "shortcut settings lock poisoned".to_string())
}

#[tauri::command]
fn save_shortcut_settings(
    app: AppHandle,
    state: State<'_, ShortcutSettingsState>,
    settings: ShortcutSettings,
) -> Result<ShortcutSettings, String> {
    let previous_settings = state
        .lock()
        .map_err(|_| "shortcut settings lock poisoned".to_string())?
        .clone();

    apply_shortcut_settings(&app, &previous_settings, &settings)?;

    if let Err(error) = persist_shortcut_settings(&app, &settings) {
        let _ = apply_shortcut_settings(&app, &settings, &previous_settings);
        return Err(error);
    }

    let mut guard = state
        .lock()
        .map_err(|_| "shortcut settings lock poisoned".to_string())?;
    *guard = settings.clone();

    Ok(settings)
}

#[tauri::command]
fn open_preferences_window(app: AppHandle) -> Result<(), String> {
    show_preferences_window(&app)
}

#[tauri::command]
fn set_scout_activity_state(
    state: State<'_, ScoutMenuStateHandle>,
    active: bool,
) -> Result<(), String> {
    sync_scout_menu_state(state.inner(), active)
}

fn menu_bar_icon() -> Image<'static> {
    tauri::include_image!("../public/assets/menu-icon.png")
}

fn menu_bar_icon_uses_template_mode() -> bool {
    cfg!(target_os = "macos")
}

fn sync_scout_menu_state(state: &ScoutMenuStateHandle, active: bool) -> Result<(), String> {
    let (start_item, end_item, tray_toggle_item) = {
        let mut guard = state
            .lock()
            .map_err(|_| "scout menu state lock poisoned".to_string())?;

        if guard.active == active {
            return Ok(());
        }

        guard.active = active;
        (
            guard.start_item.clone(),
            guard.end_item.clone(),
            guard.tray_toggle_item.clone(),
        )
    };

    start_item
        .set_enabled(!active)
        .map_err(|error| error.to_string())?;
    end_item
        .set_enabled(active)
        .map_err(|error| error.to_string())?;
    tray_toggle_item
        .set_text(quick_tray_action_for_active_state(active).label())
        .map_err(|error| error.to_string())?;
    Ok(())
}

fn current_menu_active(state: &ScoutMenuStateHandle) -> Result<bool, String> {
    state
        .lock()
        .map(|state| state.active)
        .map_err(|_| "scout menu state lock poisoned".to_string())
}

fn build_menu_bar_item(app: &AppHandle, menu: &Menu<tauri::Wry>) -> Result<(), String> {
    let tray_icon = menu_bar_icon();
    let tray_builder = TrayIconBuilder::with_id("scout-menu-bar")
        .menu(menu)
        .tooltip("Scout")
        .show_menu_on_left_click(true)
        .icon(tray_icon)
        .icon_as_template(menu_bar_icon_uses_template_mode());
    let tray_icon = tray_builder.build(app).map_err(|error| error.to_string())?;

    app.manage(tray_icon);
    Ok(())
}

fn handle_menu_event(handle: &AppHandle, menu_state: &ScoutMenuStateHandle, id: &str) {
    if is_preferences_item(id) {
        let _ = show_preferences_window(handle);
        return;
    }

    if let Some(event_name) =
        action_event_for_menu_id(id, current_menu_active(menu_state).unwrap_or(false))
    {
        let _ = handle.emit_to("notch", event_name, ());
        return;
    }

    if is_quit_item(id) {
        handle.exit(0);
        return;
    }

    if is_reload_item(id) {
        if let Some(webview_window) = handle
            .get_webview_window("preferences")
            .or_else(|| handle.get_webview_window("notch"))
        {
            let _ = webview_window.eval("window.location.reload()");
        }
        return;
    }

    if is_toggle_devtools_item(id) {
        toggle_devtools_for_best_window(handle);
        return;
    }

    if is_bring_all_to_front_item(id) {
        let _ = show_preferences_window(handle);
    }
}

#[cfg(debug_assertions)]
fn toggle_devtools_for_best_window(handle: &AppHandle) {
    if let Some(webview_window) = handle
        .get_webview_window("preferences")
        .or_else(|| handle.get_webview_window("notch"))
    {
        if webview_window.is_devtools_open() {
            webview_window.close_devtools();
        } else {
            webview_window.open_devtools();
        }
    }
}

#[cfg(not(debug_assertions))]
fn toggle_devtools_for_best_window(_handle: &AppHandle) {}

fn configure_shortcuts_and_windows(app: &AppHandle) -> Result<(), String> {
    let settings = load_shortcut_settings(app).unwrap_or_default();
    let shortcut_state: ShortcutSettingsState = Arc::new(Mutex::new(settings.clone()));
    app.manage(shortcut_state);

    let startup_registration_error = register_saved_shortcut(app, &settings).err();

    let menu_handles = build_menu_handles(
        app,
        "Scout",
        env!("CARGO_PKG_VERSION"),
        cfg!(debug_assertions),
    )?;
    let app_menu = menu_handles.app_menu.clone();
    let tray_menu = menu_handles.tray_menu.clone();
    app.set_menu(app_menu).map_err(|error| error.to_string())?;
    build_menu_bar_item(app, &tray_menu)?;

    let menu_state: ScoutMenuStateHandle = Arc::new(Mutex::new(ScoutMenuState {
        active: false,
        start_item: menu_handles.start_item.clone(),
        end_item: menu_handles.end_item.clone(),
        tray_toggle_item: menu_handles.tray_toggle_item.clone(),
    }));
    app.manage(menu_state.clone());
    sync_scout_menu_state(&menu_state, false)?;

    let app_handle = app.clone();
    let menu_state_for_events = menu_state.clone();
    app_handle.on_menu_event(move |handle, event| match event.id().0.as_str() {
        id => handle_menu_event(handle, &menu_state_for_events, id),
    });

    if settings.needs_shortcut_setup() || startup_registration_error.is_some() {
        show_preferences_window(app)?;
    }

    Ok(())
}

pub fn run() {
    let interactivity_state = Arc::new(Mutex::new(WindowInteractivityState::default()));

    tauri::Builder::default()
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        let _ = app.emit_to("notch", toggle_request_event_name(), ());
                    }
                })
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .manage(interactivity_state)
        .setup(|app| {
            let notch_window = app
                .get_webview_window("notch")
                .ok_or_else(|| IoError::other("notch window was not created"))?;
            let app_handle = app.app_handle().clone();

            windowing::configure_notch_window(&notch_window).map_err(IoError::other)?;
            windowing::start_cursor_sync(
                notch_window,
                app.state::<Arc<Mutex<WindowInteractivityState>>>()
                    .inner()
                    .clone(),
            );

            configure_shortcuts_and_windows(&app_handle).map_err(IoError::other)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_shortcut_settings,
            open_preferences_window,
            save_shortcut_settings,
            set_scout_activity_state,
            set_notch_window_size,
            set_window_interactivity
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    #[cfg(target_os = "macos")]
    #[test]
    fn menu_bar_icon_uses_the_custom_asset_and_template_mode() {
        let icon = super::menu_bar_icon();

        assert_eq!(icon.width(), 354);
        assert_eq!(icon.height(), 362);
        assert!(super::menu_bar_icon_uses_template_mode());
    }
}
