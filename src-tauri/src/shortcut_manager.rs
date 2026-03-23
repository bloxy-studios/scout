use tauri::AppHandle;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

use crate::shortcut_settings::ShortcutSettings;

pub const TOGGLE_REQUEST_EVENT: &str = "scout://toggle-requested";
const INVALID_SHORTCUT_MESSAGE: &str =
    "Use up to three keys total, including at least one modifier.";
const RESERVED_SHORTCUT_MESSAGE: &str =
    "That shortcut is reserved by macOS. Try another combination.";
const UNAVAILABLE_SHORTCUT_MESSAGE: &str =
    "That shortcut is not available on this Mac. Try another combination.";

pub fn toggle_request_event_name() -> &'static str {
    TOGGLE_REQUEST_EVENT
}

#[cfg(test)]
pub fn accelerator_is_registerable(accelerator: &str) -> bool {
    Shortcut::try_from(accelerator).is_ok()
}

pub fn register_saved_shortcut(
    app: &AppHandle,
    settings: &ShortcutSettings,
) -> Result<(), String> {
    let manager = app.global_shortcut();
    let _ = manager.unregister_all();

    let Some(shortcut) = shortcut_for_registration(settings)? else {
        return Ok(());
    };

    manager
        .register(shortcut)
        .map_err(|_| UNAVAILABLE_SHORTCUT_MESSAGE.to_string())
}

pub fn apply_shortcut_settings(
    app: &AppHandle,
    current: &ShortcutSettings,
    next: &ShortcutSettings,
) -> Result<(), String> {
    let manager = app.global_shortcut();
    let current_shortcut = registered_shortcut(current);
    let next_shortcut = shortcut_for_registration(next)?;

    if current_shortcut == next_shortcut {
        if let Some(shortcut) = next_shortcut {
            if !manager.is_registered(shortcut) {
                manager
                    .register(shortcut)
                    .map_err(|_| UNAVAILABLE_SHORTCUT_MESSAGE.to_string())?;
            }
        }
        return Ok(());
    }

    if let Some(shortcut) = next_shortcut {
        manager
            .register(shortcut)
            .map_err(|_| UNAVAILABLE_SHORTCUT_MESSAGE.to_string())?;
    }

    if let Some(shortcut) = current_shortcut {
        if manager.is_registered(shortcut) {
            manager
                .unregister(shortcut)
                .map_err(|error| error.to_string())?;
        }
    }

    Ok(())
}

fn shortcut_for_registration(settings: &ShortcutSettings) -> Result<Option<Shortcut>, String> {
    if !settings.enabled || settings.needs_shortcut_setup() {
        return Ok(None);
    }

    let Some(accelerator) = settings.accelerator.as_deref() else {
        return Ok(None);
    };

    validate_shortcut_string(accelerator).map(Some)
}

fn registered_shortcut(settings: &ShortcutSettings) -> Option<Shortcut> {
    if !settings.enabled || settings.needs_shortcut_setup() {
        return None;
    }

    settings
        .accelerator
        .as_deref()
        .and_then(|accelerator| Shortcut::try_from(accelerator).ok())
}

fn validate_shortcut_string(accelerator: &str) -> Result<Shortcut, String> {
    let normalized = normalize_shortcut(accelerator);
    let token_count = normalized.split('+').filter(|token| !token.is_empty()).count();

    if token_count < 2 || token_count > 3 {
        return Err(INVALID_SHORTCUT_MESSAGE.to_string());
    }

    if is_reserved_shortcut(&normalized) {
        return Err(RESERVED_SHORTCUT_MESSAGE.to_string());
    }

    Shortcut::try_from(accelerator).map_err(|_| INVALID_SHORTCUT_MESSAGE.to_string())
}

fn is_reserved_shortcut(normalized: &str) -> bool {
    matches!(
        normalized,
        "commandorcontrol+space"
            | "commandorcontrol+tab"
            | "commandorcontrol+q"
            | "commandorcontrol+w"
            | "commandorcontrol+alt+escape"
            | "commandorcontrol+shift+3"
            | "commandorcontrol+shift+4"
            | "commandorcontrol+shift+5"
    )
}

fn normalize_shortcut(accelerator: &str) -> String {
    accelerator
        .split('+')
        .map(str::trim)
        .filter(|token| !token.is_empty())
        .map(normalize_token)
        .collect::<Vec<_>>()
        .join("+")
}

fn normalize_token(token: &str) -> String {
    match token.to_ascii_lowercase().as_str() {
        "cmd" | "command" | "commandorcontrol" | "super" => "commandorcontrol".to_string(),
        "ctrl" | "control" => "control".to_string(),
        "alt" | "option" => "alt".to_string(),
        "shift" => "shift".to_string(),
        "esc" | "escape" => "escape".to_string(),
        other => other.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn toggle_event_name_is_stable() {
        assert_eq!(toggle_request_event_name(), "scout://toggle-requested");
    }

    #[test]
    fn valid_shortcut_string_is_registerable() {
        assert!(accelerator_is_registerable("alt+space"));
    }

    #[test]
    fn blank_shortcut_string_is_not_registerable() {
        assert!(!accelerator_is_registerable(" "));
    }

    #[test]
    fn reserved_shortcuts_are_rejected() {
        assert_eq!(
            validate_shortcut_string("CommandOrControl+Space"),
            Err(RESERVED_SHORTCUT_MESSAGE.to_string())
        );
    }

    #[test]
    fn shortcuts_with_more_than_three_keys_are_rejected() {
        assert_eq!(
            validate_shortcut_string("CommandOrControl+Alt+Shift+K"),
            Err(INVALID_SHORTCUT_MESSAGE.to_string())
        );
    }
}
