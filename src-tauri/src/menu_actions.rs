use tauri::{
    menu::{
        AboutMetadata, Menu, MenuItem, PredefinedMenuItem, SubmenuBuilder,
        WINDOW_SUBMENU_ID,
    },
    AppHandle, Runtime,
};

pub const EVENT_START_REQUESTED: &str = "scout://start-requested";
pub const EVENT_END_REQUESTED: &str = "scout://end-requested";

pub const MENU_ID_APP_PREFERENCES: &str = "menu.app.preferences";
pub const MENU_ID_FILE_START: &str = "menu.file.start";
pub const MENU_ID_FILE_END: &str = "menu.file.end";
pub const MENU_ID_FILE_PREFERENCES: &str = "menu.file.preferences";
pub const MENU_ID_VIEW_PREFERENCES: &str = "menu.view.preferences";
pub const MENU_ID_VIEW_RELOAD: &str = "menu.view.reload";
pub const MENU_ID_VIEW_DEVTOOLS: &str = "menu.view.devtools";
pub const MENU_ID_WINDOW_PREFERENCES: &str = "menu.window.preferences";
pub const MENU_ID_WINDOW_BRING_ALL_TO_FRONT: &str = "menu.window.bring_all_to_front";
pub const MENU_ID_HELP_SCOUT_HELP: &str = "menu.help.scout_help";
pub const MENU_ID_HELP_SHORTCUTS: &str = "menu.help.keyboard_shortcuts";
pub const MENU_ID_TRAY_TOGGLE: &str = "menu.tray.toggle";
pub const MENU_ID_TRAY_PREFERENCES: &str = "menu.tray.preferences";
pub const MENU_ID_TRAY_QUIT: &str = "menu.tray.quit";

#[derive(Clone)]
pub struct MenuHandles<R: Runtime> {
    pub app_menu: Menu<R>,
    pub tray_menu: Menu<R>,
    pub start_item: MenuItem<R>,
    pub end_item: MenuItem<R>,
    pub tray_toggle_item: MenuItem<R>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum QuickTrayAction {
    Start,
    End,
}

impl QuickTrayAction {
    pub fn label(self) -> &'static str {
        match self {
            Self::Start => "Start Scout",
            Self::End => "End Conversation",
        }
    }

    pub fn event_name(self) -> &'static str {
        match self {
            Self::Start => EVENT_START_REQUESTED,
            Self::End => EVENT_END_REQUESTED,
        }
    }
}

pub fn quick_tray_action_for_active_state(is_active: bool) -> QuickTrayAction {
    if is_active {
        QuickTrayAction::End
    } else {
        QuickTrayAction::Start
    }
}

pub fn build_menu_handles<R: Runtime>(
    app: &AppHandle<R>,
    product_name: &str,
    version: &str,
    is_dev: bool,
) -> Result<MenuHandles<R>, String> {
    let about_metadata = AboutMetadata {
        name: Some(product_name.to_string()),
        version: Some(version.to_string()),
        ..Default::default()
    };

    let app_preferences = MenuItem::with_id(
        app,
        MENU_ID_APP_PREFERENCES,
        "Preferences…",
        true,
        Some("CmdOrCtrl+,"),
    )
    .map_err(|error| error.to_string())?;
    let start_item = MenuItem::with_id(
        app,
        MENU_ID_FILE_START,
        "Start Scout",
        true,
        None::<&str>,
    )
    .map_err(|error| error.to_string())?;
    let end_item = MenuItem::with_id(
        app,
        MENU_ID_FILE_END,
        "End Conversation",
        false,
        None::<&str>,
    )
    .map_err(|error| error.to_string())?;
    let file_preferences = MenuItem::with_id(
        app,
        MENU_ID_FILE_PREFERENCES,
        "Preferences…",
        true,
        None::<&str>,
    )
    .map_err(|error| error.to_string())?;
    let view_preferences = MenuItem::with_id(
        app,
        MENU_ID_VIEW_PREFERENCES,
        "Preferences…",
        true,
        None::<&str>,
    )
    .map_err(|error| error.to_string())?;
    let window_preferences = MenuItem::with_id(
        app,
        MENU_ID_WINDOW_PREFERENCES,
        "Scout Preferences",
        true,
        None::<&str>,
    )
    .map_err(|error| error.to_string())?;
    let bring_all_to_front = MenuItem::with_id(
        app,
        MENU_ID_WINDOW_BRING_ALL_TO_FRONT,
        "Bring All to Front",
        true,
        None::<&str>,
    )
    .map_err(|error| error.to_string())?;
    let help_item = MenuItem::with_id(
        app,
        MENU_ID_HELP_SCOUT_HELP,
        "Scout Help",
        true,
        None::<&str>,
    )
    .map_err(|error| error.to_string())?;
    let shortcuts_item = MenuItem::with_id(
        app,
        MENU_ID_HELP_SHORTCUTS,
        "Keyboard Shortcuts",
        true,
        None::<&str>,
    )
    .map_err(|error| error.to_string())?;
    let tray_toggle_item = MenuItem::with_id(
        app,
        MENU_ID_TRAY_TOGGLE,
        quick_tray_action_for_active_state(false).label(),
        true,
        None::<&str>,
    )
    .map_err(|error| error.to_string())?;
    let tray_preferences = MenuItem::with_id(
        app,
        MENU_ID_TRAY_PREFERENCES,
        "Preferences…",
        true,
        None::<&str>,
    )
    .map_err(|error| error.to_string())?;
    let tray_quit = MenuItem::with_id(
        app,
        MENU_ID_TRAY_QUIT,
        "Quit Scout",
        true,
        None::<&str>,
    )
    .map_err(|error| error.to_string())?;

    let app_submenu = SubmenuBuilder::new(app, product_name)
        .about(Some(about_metadata.clone()))
        .separator()
        .item(&app_preferences)
        .separator()
        .services()
        .separator()
        .hide()
        .hide_others()
        .show_all()
        .separator()
        .quit()
        .build()
        .map_err(|error| error.to_string())?;

    let file_submenu = SubmenuBuilder::new(app, "File")
        .item(&start_item)
        .item(&end_item)
        .separator()
        .item(&file_preferences)
        .separator()
        .close_window()
        .build()
        .map_err(|error| error.to_string())?;

    let edit_submenu = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .build()
        .map_err(|error| error.to_string())?;

    let mut view_builder = SubmenuBuilder::new(app, "View").item(&view_preferences);
    if is_dev {
        let reload = MenuItem::with_id(
            app,
            MENU_ID_VIEW_RELOAD,
            "Reload",
            true,
            Some("CmdOrCtrl+R"),
        )
        .map_err(|error| error.to_string())?;
        let devtools = MenuItem::with_id(
            app,
            MENU_ID_VIEW_DEVTOOLS,
            "Toggle DevTools",
            true,
            Some("Alt+CmdOrCtrl+I"),
        )
        .map_err(|error| error.to_string())?;
        view_builder = view_builder.separator().item(&reload).item(&devtools);
    }
    let view_submenu = view_builder.build().map_err(|error| error.to_string())?;

    let window_submenu = SubmenuBuilder::with_id(app, WINDOW_SUBMENU_ID, "Window")
        .minimize()
        .maximize()
        .separator()
        .item(&window_preferences)
        .separator()
        .item(&bring_all_to_front)
        .build()
        .map_err(|error| error.to_string())?;

    let help_submenu = SubmenuBuilder::new(app, "Help")
        .item(&help_item)
        .item(&shortcuts_item)
        .separator()
        .about_with_text("About Scout", Some(about_metadata.clone()))
        .build()
        .map_err(|error| error.to_string())?;

    let app_menu = Menu::with_items(
        app,
        &[
            &app_submenu,
            &file_submenu,
            &edit_submenu,
            &view_submenu,
            &window_submenu,
            &help_submenu,
        ],
    )
    .map_err(|error| error.to_string())?;

    let tray_menu = Menu::with_items(
        app,
        &[
            &tray_toggle_item,
            &tray_preferences,
            &PredefinedMenuItem::separator(app).map_err(|error| error.to_string())?,
            &tray_quit,
        ],
    )
    .map_err(|error| error.to_string())?;

    Ok(MenuHandles {
        app_menu,
        tray_menu,
        start_item,
        end_item,
        tray_toggle_item,
    })
}

pub fn action_event_for_menu_id(id: &str, is_active: bool) -> Option<&'static str> {
    match id {
        MENU_ID_FILE_START => Some(EVENT_START_REQUESTED),
        MENU_ID_FILE_END => Some(EVENT_END_REQUESTED),
        MENU_ID_TRAY_TOGGLE => Some(quick_tray_action_for_active_state(is_active).event_name()),
        _ => None,
    }
}

pub fn is_preferences_item(id: &str) -> bool {
    matches!(
        id,
        MENU_ID_APP_PREFERENCES
            | MENU_ID_FILE_PREFERENCES
            | MENU_ID_VIEW_PREFERENCES
            | MENU_ID_WINDOW_PREFERENCES
            | MENU_ID_TRAY_PREFERENCES
            | MENU_ID_HELP_SHORTCUTS
            | MENU_ID_HELP_SCOUT_HELP
    )
}

pub fn is_quit_item(id: &str) -> bool {
    id == MENU_ID_TRAY_QUIT || id == "quit"
}

pub fn is_reload_item(id: &str) -> bool {
    id == MENU_ID_VIEW_RELOAD
}

pub fn is_toggle_devtools_item(id: &str) -> bool {
    id == MENU_ID_VIEW_DEVTOOLS
}

pub fn is_bring_all_to_front_item(id: &str) -> bool {
    id == MENU_ID_WINDOW_BRING_ALL_TO_FRONT
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn menu_action_ids_are_stable() {
        assert_eq!(MENU_ID_FILE_START, "menu.file.start");
        assert_eq!(MENU_ID_FILE_END, "menu.file.end");
        assert_eq!(MENU_ID_TRAY_TOGGLE, "menu.tray.toggle");
        assert_eq!(EVENT_START_REQUESTED, "scout://start-requested");
        assert_eq!(EVENT_END_REQUESTED, "scout://end-requested");
    }

    #[test]
    fn quick_tray_action_matches_active_state() {
        assert_eq!(
            quick_tray_action_for_active_state(false),
            QuickTrayAction::Start
        );
        assert_eq!(
            quick_tray_action_for_active_state(true),
            QuickTrayAction::End
        );
        assert_eq!(QuickTrayAction::Start.label(), "Start Scout");
        assert_eq!(QuickTrayAction::End.label(), "End Conversation");
    }
}
