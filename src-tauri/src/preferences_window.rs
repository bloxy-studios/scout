use tauri::{AppHandle, Manager, PhysicalSize, Size, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
#[cfg(target_os = "macos")]
use tauri::{LogicalPosition, TitleBarStyle};

pub const PREFERENCES_WINDOW_LABEL: &str = "preferences";
pub const PREFERENCES_WINDOW_TITLE: &str = "Scout Preferences";
pub const PREFERENCES_WINDOW_WIDTH: u32 = 560;
pub const PREFERENCES_WINDOW_HEIGHT: u32 = 430;

pub fn preferences_window_label() -> &'static str {
    PREFERENCES_WINDOW_LABEL
}

pub fn preferences_window_title() -> &'static str {
    PREFERENCES_WINDOW_TITLE
}

pub fn ensure_preferences_window(app: &AppHandle) -> Result<WebviewWindow, String> {
    if let Some(window) = app.get_webview_window(preferences_window_label()) {
        window.show().map_err(|error| error.to_string())?;
        window.set_focus().map_err(|error| error.to_string())?;
        return Ok(window);
    }

    let builder = WebviewWindowBuilder::new(
        app,
        preferences_window_label(),
        WebviewUrl::App("index.html".into()),
    )
    .title(preferences_window_title())
    .center()
    .resizable(false);

    #[cfg(target_os = "macos")]
    let builder = builder
        .title_bar_style(TitleBarStyle::Overlay)
        .hidden_title(true)
        .traffic_light_position(LogicalPosition::new(16.0, 18.0));

    let window = builder
        .build()
    .map_err(|error| error.to_string())?;

    window
        .set_size(Size::Physical(PhysicalSize::new(
            PREFERENCES_WINDOW_WIDTH,
            PREFERENCES_WINDOW_HEIGHT,
        )))
        .map_err(|error| error.to_string())?;
    Ok(window)
}

pub fn show_preferences_window(app: &AppHandle) -> Result<(), String> {
    let window = ensure_preferences_window(app)?;
    window.show().map_err(|error| error.to_string())?;
    window.set_focus().map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn preferences_window_identity_is_stable() {
        assert_eq!(preferences_window_label(), "preferences");
        assert_eq!(preferences_window_title(), "Scout Preferences");
        assert_eq!(PREFERENCES_WINDOW_WIDTH, 560);
        assert_eq!(PREFERENCES_WINDOW_HEIGHT, 430);
    }
}
