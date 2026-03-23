use tauri::{PhysicalPosition, PhysicalSize};

use crate::windowing::{
    compute_notch_window_position, notch_window_size, should_ignore_cursor_events,
};

#[test]
fn notch_window_size_matches_the_tight_premium_shell() {
    assert_eq!(notch_window_size(), PhysicalSize::new(132, 36));
}

#[test]
fn compute_notch_window_position_centers_the_window_on_the_monitor() {
    let position = compute_notch_window_position(
        PhysicalPosition::new(40, 0),
        PhysicalSize::new(1512, 982),
        notch_window_size(),
    );

    assert_eq!(position, PhysicalPosition::new(730, 0));
}

#[test]
fn compute_notch_window_position_centers_the_active_window_on_the_monitor() {
    let position = compute_notch_window_position(
        PhysicalPosition::new(40, 0),
        PhysicalSize::new(1512, 982),
        PhysicalSize::new(430, 72),
    );

    assert_eq!(position, PhysicalPosition::new(581, 0));
}

#[test]
fn should_ignore_cursor_events_outside_the_window_when_not_forced_interactive() {
    let should_ignore = should_ignore_cursor_events(
        false,
        PhysicalPosition::new(25.0, 25.0),
        PhysicalPosition::new(100, 0),
        notch_window_size(),
    );

    assert!(should_ignore);
}

#[test]
fn should_not_ignore_cursor_events_inside_the_window_or_when_forced() {
    let inside_window = should_ignore_cursor_events(
        false,
        PhysicalPosition::new(150.0, 20.0),
        PhysicalPosition::new(100, 0),
        notch_window_size(),
    );
    let forced_interactive = should_ignore_cursor_events(
        true,
        PhysicalPosition::new(25.0, 25.0),
        PhysicalPosition::new(100, 0),
        notch_window_size(),
    );

    assert!(!inside_window);
    assert!(!forced_interactive);
}
