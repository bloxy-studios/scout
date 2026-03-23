use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::Manager;

const SHORTCUT_SETTINGS_FILE: &str = "shortcut-settings.json";

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ShortcutSettings {
    pub enabled: bool,
    pub accelerator: Option<String>,
    pub has_completed_setup: bool,
}

impl ShortcutSettings {
    pub fn needs_shortcut_setup(&self) -> bool {
        !self.has_completed_setup
            || self
                .accelerator
                .as_ref()
                .map(|accelerator| accelerator.trim().is_empty())
                .unwrap_or(true)
    }
}

pub fn settings_file_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let path = app
        .path()
        .app_config_dir()
        .map_err(|error| error.to_string())?;

    Ok(path.join(SHORTCUT_SETTINGS_FILE))
}

pub fn load_shortcut_settings(app: &tauri::AppHandle) -> Result<ShortcutSettings, String> {
    let path = settings_file_path(app)?;
    Ok(load_shortcut_settings_from_path(path))
}

pub fn save_shortcut_settings(
    app: &tauri::AppHandle,
    settings: &ShortcutSettings,
) -> Result<(), String> {
    let path = settings_file_path(app)?;
    save_shortcut_settings_to_path(path, settings)
}

pub fn load_shortcut_settings_from_path(path: impl AsRef<Path>) -> ShortcutSettings {
    match fs::read_to_string(path) {
        Ok(contents) => serde_json::from_str::<ShortcutSettings>(&contents)
            .map(|settings| settings.sanitized())
            .unwrap_or_default(),
        Err(_) => ShortcutSettings::default(),
    }
}

pub fn save_shortcut_settings_to_path(
    path: impl AsRef<Path>,
    settings: &ShortcutSettings,
) -> Result<(), String> {
    let path = path.as_ref();

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    let json = serde_json::to_string_pretty(&settings.sanitized())
        .map_err(|error| error.to_string())?;
    fs::write(path, json).map_err(|error| error.to_string())
}

impl ShortcutSettings {
    fn sanitized(&self) -> Self {
        let accelerator = self.accelerator.as_ref().and_then(|accelerator| {
            let accelerator = accelerator.trim();

            if accelerator.is_empty() {
                None
            } else {
                Some(accelerator.to_string())
            }
        });

        Self {
            enabled: self.enabled,
            accelerator,
            has_completed_setup: self.has_completed_setup,
        }
    }
}

#[cfg(test)]
mod tests {
    use std::time::{SystemTime, UNIX_EPOCH};

    use super::*;

    fn temp_file_path(name: &str) -> PathBuf {
        let mut path = std::env::temp_dir();
        let stamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time is before unix epoch")
            .as_nanos();
        path.push(format!("scout-{name}-{stamp}.json"));
        path
    }

    #[test]
    fn missing_file_is_treated_as_first_run() {
        let path = temp_file_path("missing");
        let settings = load_shortcut_settings_from_path(&path);

        assert!(settings.needs_shortcut_setup());
        assert!(settings.accelerator.is_none());
    }

    #[test]
    fn saving_and_loading_preserves_the_shortcut_binding() {
        let path = temp_file_path("roundtrip");
        let settings = ShortcutSettings {
            enabled: true,
            accelerator: Some("Alt+Space".to_string()),
            has_completed_setup: true,
        };

        save_shortcut_settings_to_path(&path, &settings)
            .expect("shortcut settings should save");
        let loaded = load_shortcut_settings_from_path(&path);

        assert_eq!(loaded, settings);
        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn invalid_json_falls_back_to_default_setup_state() {
        let path = temp_file_path("invalid");
        fs::write(&path, "{ not valid json").expect("invalid payload should write");

        let settings = load_shortcut_settings_from_path(&path);

        assert!(settings.needs_shortcut_setup());
        assert!(settings.accelerator.is_none());
        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn blank_binding_is_not_considered_configured() {
        let settings = ShortcutSettings {
            enabled: true,
            accelerator: Some("   ".to_string()),
            has_completed_setup: true,
        };

        assert!(settings.needs_shortcut_setup());
    }
}
