use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use tauri::{PhysicalPosition, PhysicalSize, Position, Size, WebviewWindow};

const CURSOR_SYNC_INTERVAL_MS: u64 = 120;
const NOTCH_WINDOW_WIDTH: u32 = 132;
const NOTCH_WINDOW_HEIGHT: u32 = 36;

pub fn notch_window_size() -> PhysicalSize<u32> {
    PhysicalSize::new(NOTCH_WINDOW_WIDTH, NOTCH_WINDOW_HEIGHT)
}

pub fn resize_notch_window(
    window: &WebviewWindow,
    width: u32,
    height: u32,
) -> Result<(), String> {
    let size = PhysicalSize::new(width, height);

    window
        .set_size(Size::Physical(size))
        .map_err(|error| error.to_string())?;

    position_window(window, size)
}

pub fn compute_notch_window_position(
    monitor_origin: PhysicalPosition<i32>,
    monitor_size: PhysicalSize<u32>,
    window_size: PhysicalSize<u32>,
) -> PhysicalPosition<i32> {
    let horizontal_padding = monitor_size.width.saturating_sub(window_size.width) / 2;
    let x = monitor_origin.x + horizontal_padding as i32;
    let y = monitor_origin.y;

    PhysicalPosition::new(x, y)
}

pub fn should_ignore_cursor_events(
    force_interactive: bool,
    cursor_position: PhysicalPosition<f64>,
    window_position: PhysicalPosition<i32>,
    window_size: PhysicalSize<u32>,
) -> bool {
    if force_interactive {
        return false;
    }

    let min_x = f64::from(window_position.x);
    let max_x = min_x + f64::from(window_size.width);
    let min_y = f64::from(window_position.y);
    let max_y = min_y + f64::from(window_size.height);

    let cursor_inside_window = cursor_position.x >= min_x
        && cursor_position.x <= max_x
        && cursor_position.y >= min_y
        && cursor_position.y <= max_y;

    !cursor_inside_window
}

pub fn configure_notch_window(window: &WebviewWindow) -> Result<(), String> {
    resize_window(window)?;

    #[cfg(target_os = "macos")]
    set_notch_window_level(window)?;

    sync_window_interactivity(window, false)?;

    Ok(())
}

fn resize_window(window: &WebviewWindow) -> Result<(), String> {
    resize_notch_window(
        window,
        notch_window_size().width,
        notch_window_size().height,
    )
}

pub fn sync_window_interactivity(window: &WebviewWindow, force_interactive: bool) -> Result<(), String> {
    let ignore_cursor_events = should_ignore_cursor_events(
        force_interactive,
        window.cursor_position().map_err(|error| error.to_string())?,
        window.outer_position().map_err(|error| error.to_string())?,
        window.outer_size().map_err(|error| error.to_string())?,
    );

    window
        .set_ignore_cursor_events(ignore_cursor_events)
        .map_err(|error| error.to_string())
}

pub fn start_cursor_sync(
    window: WebviewWindow,
    interactivity_state: Arc<Mutex<crate::WindowInteractivityState>>,
) {
    thread::spawn(move || loop {
        let force_interactive = match interactivity_state.lock() {
            Ok(state) => state.force_interactive,
            Err(_) => break,
        };

        if sync_window_interactivity(&window, force_interactive).is_err() {
            break;
        }

        thread::sleep(Duration::from_millis(CURSOR_SYNC_INTERVAL_MS));
    });
}

fn position_window(window: &WebviewWindow, window_size: PhysicalSize<u32>) -> Result<(), String> {
    let monitor = window
        .primary_monitor()
        .map_err(|error| error.to_string())?
        .ok_or_else(|| "primary monitor not available".to_string())?;
    let position = compute_notch_window_position(
        *monitor.position(),
        *monitor.size(),
        window_size,
    );

    window
        .set_position(Position::Physical(position))
        .map_err(|error| error.to_string())
}

#[cfg(target_os = "macos")]
fn set_notch_window_level(window: &WebviewWindow) -> Result<(), String> {
    use cocoa::appkit::NSMainMenuWindowLevel;
    use cocoa::base::id;
    use objc::runtime::Object;
    use objc::{msg_send, sel, sel_impl};

    // NSWindowCollectionBehavior flags (from AppKit):
    const CAN_JOIN_ALL_SPACES: u64 = 1 << 0;
    const STATIONARY: u64 = 1 << 4;
    const FULL_SCREEN_AUXILIARY: u64 = 1 << 8;

    let ns_window = window.ns_window().map_err(|error| error.to_string())? as id;

    unsafe {
        let _: () = msg_send![
            ns_window as *mut Object,
            setLevel: NSMainMenuWindowLevel as i64 + 1
        ];

        let behavior: u64 = CAN_JOIN_ALL_SPACES | STATIONARY | FULL_SCREEN_AUXILIARY;
        let _: () = msg_send![
            ns_window as *mut Object,
            setCollectionBehavior: behavior
        ];
    }

    Ok(())
}
