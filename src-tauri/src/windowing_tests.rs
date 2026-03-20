use tauri::{PhysicalPosition, PhysicalSize};

use crate::windowing::{compute_notch_window_position, should_ignore_cursor_events};

#[test]
fn compute_notch_window_position_centers_the_window_on_the_monitor() {
    let position = compute_notch_window_position(
        PhysicalPosition::new(40, 0),
        PhysicalSize::new(1512, 982),
        PhysicalSize::new(400, 80),
    );

    assert_eq!(position, PhysicalPosition::new(596, 0));
}

#[test]
fn should_ignore_cursor_events_outside_the_window_when_not_forced_interactive() {
    let should_ignore = should_ignore_cursor_events(
        false,
        PhysicalPosition::new(25.0, 25.0),
        PhysicalPosition::new(100, 0),
        PhysicalSize::new(400, 80),
    );

    assert!(should_ignore);
}

#[test]
fn should_not_ignore_cursor_events_inside_the_window_or_when_forced() {
    let inside_window = should_ignore_cursor_events(
        false,
        PhysicalPosition::new(250.0, 40.0),
        PhysicalPosition::new(100, 0),
        PhysicalSize::new(400, 80),
    );
    let forced_interactive = should_ignore_cursor_events(
        true,
        PhysicalPosition::new(25.0, 25.0),
        PhysicalPosition::new(100, 0),
        PhysicalSize::new(400, 80),
    );

    assert!(!inside_window);
    assert!(!forced_interactive);
}
