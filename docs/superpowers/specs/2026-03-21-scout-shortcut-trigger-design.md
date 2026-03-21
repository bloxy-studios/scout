# Scout Shortcut Trigger Design

## Summary

Scout needs a reliable activation path that does not depend on Picovoice access.
The hackathon version should ship with a macOS-only global keyboard shortcut that toggles the full Scout agent session on and off, plus a dedicated Preferences window where the user configures that shortcut.

## Approved decisions

- Platform scope for v1: macOS only
- Trigger scope for v1: one configurable global shortcut
- Primary action: toggle the full Scout session
- Active-state shortcut behavior: hard stop and return to idle
- First-run behavior: mandatory shortcut setup before normal use
- Settings surface: dedicated Preferences window
- Settings entry point after setup: menu bar item
- Wake word coexistence: keyboard shortcut and Picovoice can both be enabled later
- Picovoice support remains in the product, but keyboard shortcut becomes the primary usable trigger for the hackathon build

## Goals

- Let users trigger Scout immediately without Picovoice access
- Make activation work globally across macOS, not only when Scout is focused
- Keep the mental model simple: one shortcut turns Scout on, and the same shortcut turns Scout off
- Add a setup and settings experience that feels like a real desktop app rather than a developer fallback
- Preserve the current notch behavior and session lifecycle instead of creating a second conversation system

## Non-goals

- No multi-shortcut command system in v1
- No hold-to-talk or push-to-talk mode in v1
- No cross-device settings sync
- No Windows or Linux shortcut support in the hackathon version
- No removal of Picovoice support; this is an alternate trigger path, not a replacement

## Product flow

### First launch

If Scout launches and no shortcut has been configured yet, it should open a dedicated Preferences window instead of silently waiting for wake word support.
The setup flow should require the user to choose a valid shortcut before they can rely on Scout for activation.

### Normal usage

After a shortcut is configured, the user can trigger Scout from anywhere on macOS.

- If Scout is idle, pressing the shortcut starts the normal Scout session flow
- If Scout is active in any state, pressing the shortcut ends the current session immediately and returns the notch to idle

This makes the shortcut a session power switch, which fits Scout better than a dictation-style push-to-talk model.

### Later with Picovoice

When Picovoice access becomes available, wake word and shortcut should coexist.
Users should be able to activate Scout either by wake word or by the global shortcut.
The keyboard shortcut remains the explicit manual trigger even after wake word support is restored.

## User experience

### Preferences window

The Preferences window should be focused and minimal.
For v1 it only needs one primary settings area: `Activation Shortcut`.

It should show:

- current shortcut state
- a shortcut capture field
- short helper text explaining that the shortcut works globally on macOS
- inline validation errors
- save and reset actions

On first launch, this same window doubles as setup.
The copy should make it clear that Scout needs a shortcut before it can be triggered manually.

### Menu bar entry

Scout should expose a menu bar item that allows the user to reopen Preferences after the initial setup.
This keeps the notch UI clean and avoids overloading the notch with settings chrome.

### Shortcut capture rules

The capture rules should be simple and strict:

- require at least one modifier key
- allow up to three keys total
- reject combinations reserved by macOS
- reject combinations that cannot be registered globally
- show clear inline feedback when a combination is invalid

Because v1 has only one shortcut action, we do not need internal shortcut conflict management between multiple Scout actions yet.

## Architecture

### Native shortcut manager

Tauri should own global shortcut registration.
The native layer is responsible for:

- loading the saved shortcut configuration at startup
- registering and unregistering the global shortcut on macOS
- validating whether a chosen shortcut can be registered
- emitting a single frontend event when the shortcut fires

The event should represent intent, not behavior.
For example, the native layer should emit a toggle request, and the frontend should decide whether that means activate or stop based on the current Scout session state.

### Persisted local preferences

Shortcut configuration should be stored locally on the current device only.
For the hackathon build, local persistence is sufficient and preferred over a more ambitious sync system.

The stored preference should include:

- whether shortcut activation is enabled
- the chosen shortcut combination
- whether first-run setup is complete

### Frontend trigger controller

The frontend should keep a single activation controller.
The new shortcut event should route into the existing Scout session system rather than creating a parallel shortcut-specific flow.

The controller behavior should be:

- if Scout is idle: call the existing activation entry point
- if Scout is active: call a new explicit hard-stop path that immediately ends the session and resets the notch to idle

This keeps wake word, menu actions, and keyboard shortcut behavior unified.

### Multi-window app shape

Scout currently renders a single notch window.
The shortcut feature requires a second window for Preferences.

The app should support:

- a notch window for the primary overlay UI
- a Preferences window for setup and shortcut editing

The frontend entry should render the correct UI surface based on window identity or startup context, so the settings window can reuse the existing React/Vite app without introducing a second frontend stack.

## Interaction model

### Toggle on

When the user presses the global shortcut while Scout is idle:

1. Scout activates
2. the notch enters the normal active session flow
3. the existing conversation lifecycle continues unchanged

### Toggle off

When the user presses the global shortcut while Scout is active:

1. Scout immediately ends the current session
2. the session cleanup path runs
3. the notch returns to the exact idle UI

This is intentionally a hard stop for v1 because it is predictable, easy to demo, and avoids ambiguous mid-session behavior.

## Validation and failure handling

### Invalid shortcut choice

If the user records an invalid or reserved shortcut, the Preferences UI should reject it inline and ask for another combination.

### Registration failure

If a shortcut looks syntactically valid but native registration fails, the UI should explain that the shortcut is unavailable on this Mac and keep the previous working value unchanged.

### Missing configuration

If no shortcut is configured, Scout should open first-run setup instead of silently failing.

### Runtime stop behavior

If the shortcut is pressed while Scout is active, Scout must fully end the session and return to the same idle notch used before activation.
It must not leave the app in a partially active state.

## Files likely to change

### Frontend

- `src/App.tsx`
- `src/main.tsx`
- `src/App.css`
- `src/hooks/use-scout.ts`
- `src/components/notch-widget.tsx`
- new settings components under `src/components/`
- new settings or shortcut helpers under `src/lib/`

### Tauri / Rust

- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`
- `src-tauri/src/lib.rs`
- `src-tauri/capabilities/default.json`
- new shortcut and preferences modules under `src-tauri/src/`

## Testing strategy

The feature should be tested at three levels.

### Native layer

- shortcut validation behavior
- shortcut persistence load/save behavior
- startup logic when no shortcut is configured

### Frontend state and rendering

- idle -> active on shortcut toggle event
- active -> idle on shortcut toggle event
- first-run setup visibility when no shortcut is configured
- settings UI reflects saved shortcut state

### Integration behavior

- saving a shortcut triggers native registration refresh
- menu bar preferences entry opens the settings window
- hard-stop behavior returns the notch to the exact idle state

## Risks

- Global shortcut registration can fail for reserved or unavailable macOS combinations, so validation needs to be user-friendly
- Adding a second Tauri window changes the app shape and needs careful routing so the notch UI stays lightweight
- Hard-stop session handling must reuse the existing cleanup path to avoid reintroducing the recent stuck-active-notch bugs
- First-run setup must not block the notch window in a way that feels broken or confusing

## References

- User requirement: alternate trigger path for the hackathon while Picovoice access is pending
- Product inspiration: Wispr Flow keybind settings and menu bar entry model
