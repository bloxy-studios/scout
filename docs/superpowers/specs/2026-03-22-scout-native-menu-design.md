# Scout Native Menu Design

## Summary

Scout should feel like a real macOS desktop app, not only a notch widget with a tray item.
The hackathon version should add a full native macOS menu bar with standard app menus, keep the tray menu intentionally compact, and wire Scout-specific commands into the existing session lifecycle without creating a second control system.

## Approved decisions

- Top menu scope: native fuller menu set
- Top menus: `Scout`, `File`, `Edit`, `View`, `Window`, `Help`
- `Scout` menu: standard macOS essentials only
- `File` menu: hybrid session actions plus `Preferences…`
- `Edit` menu: standard native Mac edit menu
- `View` menu: practical items only, with dev-only actions in development
- `Window` menu: standard macOS window actions plus `Scout Preferences`
- `Help` menu: minimal Mac-style help items
- Tray/menu bar menu: quick control only
- Menu bar icon source: `public/assets/menu-icon.png`
- macOS tray icon behavior: use template mode for native menu bar appearance

## Goals

- Make Scout behave like a proper macOS app from the system menu bar
- Add standard top-level macOS menus users expect in a desktop app
- Keep Scout-specific actions discoverable without overloading the tray menu
- Reuse the existing Scout activation and shutdown lifecycle for all menu actions
- Preserve the current notch, preferences, shortcut, and tray behavior while making the app shell feel more complete

## Non-goals

- No custom dashboard-style menu system
- No large in-app command palette exposed through the macOS menu
- No multi-page Help center or documentation browser for v1
- No deep View or Debug menu with experimental internal controls in production
- No cross-platform menu parity work beyond what falls out naturally from Tauri

## Menu structure

### Scout

The app menu should feel conventionally Mac.
It should contain:

- `About Scout`
- separator
- `Preferences…`
- separator
- `Services`
- separator
- `Hide Scout`
- `Hide Others`
- `Show All`
- separator
- `Quit Scout`

This menu should not carry the main session controls.
Keeping it standard makes Scout feel native instead of over-customized.

### File

`File` is where Scout-specific session actions should live.
It should contain:

- `Start Scout`
- `End Conversation`
- separator
- `Preferences…`
- separator
- `Close Window`

Behavior rules:

- `Start Scout` is enabled only while Scout is idle
- `End Conversation` is enabled only while Scout is active
- `Close Window` should close the Preferences window when that window is frontmost; the notch window itself remains a system-like overlay and should not disappear in a confusing way

### Edit

`Edit` should be a standard macOS edit menu so text fields in Preferences behave like a native desktop app.
It should include the normal Mac actions:

- `Undo`
- `Redo`
- separator
- `Cut`
- `Copy`
- `Paste`
- `Select All`

If Tauri exposes speech-related native edit items cleanly, they can be included later, but they are not required for the hackathon version.

### View

`View` should stay practical and light.
It should contain:

- `Preferences…`
- separator
- `Reload` in development only
- `Toggle DevTools` in development only

No permanent production-only custom View items are needed in v1.

### Window

`Window` should use familiar macOS structure.
It should contain:

- `Minimize`
- `Zoom`
- separator
- `Scout Preferences`
- separator
- `Bring All to Front`

This helps Scout feel like a real app even though the primary UI is a notch overlay.

### Help

`Help` should stay minimal.
It should contain:

- `Scout Help`
- `Keyboard Shortcuts`
- `About Scout`

For the hackathon build, these can route to simple stable behaviors such as a small native dialog, the Preferences window, or an external link rather than a large custom help system.

## Tray/menu bar menu

The tray menu should not mirror the full app menu.
It should stay quick and operational:

- `Start Scout` when idle, or `End Conversation` when active
- `Preferences…`
- separator
- `Quit Scout`

The tray menu is a quick-control surface, not the app’s full menu system.

## Action behavior

All Scout-specific menu actions should plug into the same lifecycle already used by the keyboard shortcut and notch UI.

### Start Scout

`Start Scout` should emit the same activation request that the global shortcut already uses.
It must not create a second activation code path.

### End Conversation

`End Conversation` should use the same hard-stop/end-session path already used by the shortcut toggle when Scout is active.
It must fully return Scout to the true idle notch.

### Preferences

All `Preferences…` and `Scout Preferences` menu items should reuse the existing Preferences window logic.
If the window already exists, Scout should focus it instead of opening a duplicate.

### About Scout

`About Scout` should use the cleanest native macOS/Tauri option available.
If a native about panel is not exposed cleanly, a simple fallback window or dialog is acceptable for the hackathon as long as it feels stable and not improvised.

### Help and Keyboard Shortcuts

For v1, these should prefer simple behaviors:

- a lightweight help dialog or external help link
- a shortcut help surface that can reuse Preferences or a concise help dialog

The important thing is that the menu items work and feel intentional; a large custom help system is not required.

## Native feel requirements

- Use standard macOS menu naming and ordering
- Use native enable/disable states for actions like `Start Scout` and `End Conversation`
- Keep development-only menu items out of production
- Preserve template behavior for the menu bar icon on macOS
- Avoid loading the tray menu with the full app hierarchy

## Architecture

### Native menu definition

The Rust/Tauri layer should own menu construction.
It should build:

- the full top application menu
- the compact tray menu
- environment-aware development-only items

This keeps the app shell native and avoids reimplementing macOS menu behavior in React.

### Native action dispatch

Rust should own menu IDs and route them to either:

- direct native behavior such as quit or focus preferences
- app events such as `scout://start-requested` and `scout://end-requested`

That keeps all Scout-specific state changes flowing through the existing frontend lifecycle.

### Frontend bridge

The frontend should subscribe to new app-level events only where necessary.
The likely event set is:

- `scout://start-requested`
- `scout://end-requested`

These should reuse the existing `activateScout()` and end-session logic in `useScout`.

### State-aware menu updates

The tray menu should reflect whether Scout is idle or active.
The top menu may either:

- dynamically enable and disable `Start Scout` / `End Conversation`, or
- conservatively leave both visible and use disabled states based on current app state

The preferred behavior is native enable/disable states when feasible in Tauri without overcomplicating the hackathon build.

## Files likely to change

### Native / Rust

- `src-tauri/src/lib.rs`
- potentially a new menu-focused Rust module under `src-tauri/src/`
- `src-tauri/Cargo.toml` only if additional native menu/about support is needed

### Frontend / React

- `src/hooks/use-scout.ts`
- potentially a small frontend event helper under `src/lib/`

## Testing strategy

### Rust

- menu item IDs are stable
- tray menu chooses the correct quick-control actions
- menu bar icon continues to use the provided asset and template mode

### Frontend

- `Start Scout` event triggers the existing activation path
- `End Conversation` event triggers the existing hard-stop path
- no duplicate sessions or conflicting activation behavior is introduced by menu actions

### Integration

- Preferences still opens from menu and tray
- top menu and tray remain consistent with Scout’s idle/active lifecycle
- development-only View items stay hidden in production

## Risks

- Dynamic enable/disable behavior can be trickier than static menu construction, so it should be scoped carefully
- Help/About implementations can grow into unnecessary surface area if not kept intentionally lightweight
- Scout-specific actions must not bypass the existing session lifecycle or they risk reintroducing earlier notch-state bugs
- The tray menu must remain small enough that it still feels like a quick-control surface

## References

- Approved brainstorming decisions from March 22, 2026
- Existing Scout tray/menu implementation in `src-tauri/src/lib.rs`
- Existing Preferences window behavior in `src-tauri/src/preferences_window.rs`
