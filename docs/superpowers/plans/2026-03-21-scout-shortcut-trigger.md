# Scout Shortcut Trigger Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a macOS-only global keyboard shortcut system that toggles Scout on and off, includes a mandatory first-run shortcut setup window, and exposes a menu bar entry to reopen Preferences later.

**Architecture:** Keep activation behavior centered in the existing Scout session hook while moving global shortcut ownership to Tauri. Rust will persist shortcut preferences, register the native global shortcut, manage the Preferences window and menu bar entry, and emit a single toggle event to the notch window. React will render either the notch or Preferences surface based on the active window and will use one toggle controller for start and hard-stop behavior.

**Tech Stack:** Tauri v2, Rust, React 19, TypeScript, Vite, Vitest, official Tauri global-shortcut plugin, existing Scout notch/session state

---

## File structure

### Native / Rust

- Create: `src-tauri/src/shortcut_settings.rs`
  - Own the persisted shortcut configuration model, validation helpers, and config file load/save behavior.
- Create: `src-tauri/src/shortcut_manager.rs`
  - Own native shortcut registration, unregistration, and the `scout://toggle-requested` event emission.
- Create: `src-tauri/src/preferences_window.rs`
  - Own creating, showing, and focusing the Preferences window.
- Modify: `src-tauri/src/lib.rs`
  - Wire the new modules, plugin setup, startup logic, tray/menu behavior, and Tauri commands.
- Modify: `src-tauri/Cargo.toml`
  - Add the official global-shortcut plugin dependency and any serde/path helpers needed by the config module.
- Modify: `src-tauri/capabilities/default.json`
  - Keep notch window permissions accurate if commands or windows move.
- Create: `src-tauri/capabilities/preferences.json`
  - Give the Preferences window access to the custom commands it needs.
- Modify: `src-tauri/tauri.conf.json`
  - Add the Preferences window capability if static config is the cleanest path, or leave the window dynamic and document the runtime-only approach.

### Frontend / React

- Create: `src/lib/app-surface.ts`
  - Detect whether the current webview should render the notch or Preferences UI.
- Create: `src/lib/shortcut-format.ts`
  - Format display labels for shortcuts and normalize capture output for the UI.
- Create: `src/lib/shortcut-format.test.ts`
  - Cover formatter behavior and edge cases.
- Create: `src/components/preferences-window.tsx`
  - Render the Preferences surface, first-run messaging, and save/reset/error states.
- Create: `src/components/shortcut-recorder.tsx`
  - Handle shortcut capture in the browser and show the candidate combination before save.
- Create: `src/components/preferences-window.test.tsx`
  - Cover first-run setup and save/validation UI behavior.
- Modify: `src/App.tsx`
  - Switch between notch UI and Preferences UI based on the current window.
- Modify: `src/App.css`
  - Add minimal Preferences window styling without disturbing the notch design.
- Modify: `src/hooks/use-scout.ts`
  - Add an explicit hard-stop method and subscribe to the native toggle event.
- Modify: `src/components/notch-widget.tsx`
  - Use the new toggle controller if needed, while keeping the notch visual behavior unchanged.
- Modify: `src/hooks/use-scout.test.tsx`
  - Cover idle/start and active/stop behavior when the native shortcut event arrives.
- Modify: `src/test/setup.ts`
  - Add stable mocks for Tauri event/webview APIs if the new tests need them.

## Chunk 1: Native shortcut settings foundation

### Task 1: Add failing tests for shortcut settings persistence and first-run state

**Files:**
- Create: `src-tauri/src/shortcut_settings.rs`
- Test: `src-tauri/src/shortcut_settings.rs`

- [ ] **Step 1: Write the failing Rust tests**

Add unit tests that assert:
- loading settings with no config file returns `None` or a first-run state
- saving a valid shortcut persists it and loads it back
- invalid stored data falls back safely instead of crashing
- a config with no shortcut is treated as incomplete setup

- [ ] **Step 2: Run the Rust test target to verify it fails**

Run: `cargo test --manifest-path src-tauri/Cargo.toml shortcut_settings`
Expected: FAIL because the module and tests do not exist yet

- [ ] **Step 3: Implement the minimal settings model**

Build `src-tauri/src/shortcut_settings.rs` with:
- a serializable `ShortcutSettings` struct
- a `ShortcutBinding` representation that stores the exact accelerator string
- `load_shortcut_settings` and `save_shortcut_settings` helpers using the app config directory
- a `needs_shortcut_setup()` helper

- [ ] **Step 4: Run the targeted Rust tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml shortcut_settings`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/shortcut_settings.rs src-tauri/Cargo.toml
git commit -m "feat: add scout shortcut settings persistence"
```

### Task 2: Add failing tests for shortcut formatting on the frontend

**Files:**
- Create: `src/lib/shortcut-format.ts`
- Create: `src/lib/shortcut-format.test.ts`

- [ ] **Step 1: Write the failing frontend tests**

Add tests that assert:
- macOS modifiers format consistently for display
- empty or invalid bindings display a friendly placeholder
- the UI formatter preserves the stored accelerator string separately from the pretty label

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `~/.bun/bin/bun x vitest run src/lib/shortcut-format.test.ts`
Expected: FAIL because the formatter module does not exist

- [ ] **Step 3: Implement the minimal formatter**

Create `src/lib/shortcut-format.ts` with:
- a display formatter for accelerators like `Option+Shift+Space`
- helper constants for unsupported/empty states

- [ ] **Step 4: Run the targeted test**

Run: `~/.bun/bin/bun x vitest run src/lib/shortcut-format.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/shortcut-format.ts src/lib/shortcut-format.test.ts
git commit -m "test: add shortcut formatter coverage"
```

## Chunk 2: Native registration, toggle event, and Preferences window shell

### Task 3: Add failing Rust tests for global shortcut registration and toggle event emission

**Files:**
- Create: `src-tauri/src/shortcut_manager.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/Cargo.toml`

- [ ] **Step 1: Write the failing Rust tests**

Add focused tests around pure helper logic for:
- whether a new shortcut should replace an old one
- whether startup should register a saved shortcut
- whether a shortcut event maps to the `scout://toggle-requested` intent

- [ ] **Step 2: Add the official plugin dependency**

Run: `cd src-tauri && cargo add tauri-plugin-global-shortcut --target 'cfg(any(target_os = "macos", windows, target_os = "linux"))'`

- [ ] **Step 3: Run the Rust tests to verify they fail**

Run: `cargo test --manifest-path src-tauri/Cargo.toml shortcut_manager`
Expected: FAIL because the module is only partially wired and registration logic is not implemented

- [ ] **Step 4: Implement the minimal native shortcut manager**

Build `src-tauri/src/shortcut_manager.rs` so it:
- initializes the official plugin in `lib.rs`
- registers the saved shortcut on startup
- unregisters and re-registers when settings change
- emits `scout://toggle-requested` to the notch window on shortcut press

- [ ] **Step 5: Run the targeted Rust tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml shortcut_manager`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/src/lib.rs src-tauri/src/shortcut_manager.rs
git commit -m "feat: add native scout global shortcut manager"
```

### Task 4: Add Preferences window creation and menu bar entry

**Files:**
- Create: `src-tauri/src/preferences_window.rs`
- Modify: `src-tauri/src/lib.rs`
- Create: `src-tauri/capabilities/preferences.json`
- Modify: `src-tauri/capabilities/default.json`

- [ ] **Step 1: Write the failing behavior test plan**

Document targeted tests for:
- showing Preferences on first launch when no shortcut exists
- reopening Preferences from the menu bar entry
- focusing the existing Preferences window instead of spawning duplicates

- [ ] **Step 2: Implement the minimal native window and menu behavior**

Update `src-tauri/src/lib.rs` and the new window module so startup:
- checks whether shortcut setup is complete
- opens Preferences automatically when needed
- exposes a menu bar item such as `Preferences…`
- reuses the same `preferences` window label if it already exists

- [ ] **Step 3: Add the necessary capability file**

Create `src-tauri/capabilities/preferences.json` so the Preferences window can call the custom Tauri commands it needs.

- [ ] **Step 4: Run native verification**

Run: `cargo check --manifest-path src-tauri/Cargo.toml`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/preferences_window.rs src-tauri/src/lib.rs src-tauri/capabilities/default.json src-tauri/capabilities/preferences.json
git commit -m "feat: add scout preferences window and menu entry"
```

## Chunk 3: Frontend surface split and settings UI

### Task 5: Split the app into notch and Preferences surfaces

**Files:**
- Create: `src/lib/app-surface.ts`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Write the failing surface-selection test**

Add a test that asserts:
- the notch window still renders `NotchWidget`
- the `preferences` window renders the Preferences surface instead

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `~/.bun/bin/bun x vitest run src/components/preferences-window.test.tsx`
Expected: FAIL because surface detection and the Preferences surface do not exist yet

- [ ] **Step 3: Implement the minimal surface selector**

Create `src/lib/app-surface.ts` and update `src/App.tsx` so rendering depends on the current window label or startup context rather than assuming the notch is the only surface.

- [ ] **Step 4: Run the targeted test**

Run: `~/.bun/bin/bun x vitest run src/components/preferences-window.test.tsx`
Expected: still FAIL until the Preferences UI is built

- [ ] **Step 5: Commit**

```bash
git add src/lib/app-surface.ts src/App.tsx src/main.tsx
git commit -m "refactor: support scout notch and preferences surfaces"
```

### Task 6: Build the Preferences window and shortcut recorder UI

**Files:**
- Create: `src/components/preferences-window.tsx`
- Create: `src/components/shortcut-recorder.tsx`
- Create: `src/components/preferences-window.test.tsx`
- Modify: `src/App.css`
- Modify: `src/test/setup.ts`

- [ ] **Step 1: Write the failing UI tests**

Cover:
- first-run setup messaging when no shortcut exists
- recording a shortcut candidate
- showing a validation error from native save failure
- displaying the saved shortcut label

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `~/.bun/bin/bun x vitest run src/components/preferences-window.test.tsx`
Expected: FAIL because the components do not exist yet

- [ ] **Step 3: Implement the minimal Preferences UI**

Build:
- a focused setup/preferences card
- a shortcut capture field
- save/reset actions
- concise inline error copy

Keep styling minimal and native-feeling so it does not conflict with the notch aesthetic.

- [ ] **Step 4: Run the targeted test**

Run: `~/.bun/bin/bun x vitest run src/components/preferences-window.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/preferences-window.tsx src/components/shortcut-recorder.tsx src/components/preferences-window.test.tsx src/App.css src/test/setup.ts
git commit -m "feat: add scout shortcut preferences UI"
```

## Chunk 4: Session toggle integration

### Task 7: Add explicit hard-stop behavior to the Scout session hook

**Files:**
- Modify: `src/hooks/use-scout.ts`
- Modify: `src/hooks/use-scout.test.tsx`
- Modify: `src/lib/conversation-completion.ts` (only if required to keep cleanup centralized)

- [ ] **Step 1: Write the failing hook tests**

Add tests that assert:
- a native toggle event activates Scout when idle
- a native toggle event hard-stops Scout when active
- hard-stop returns the reducer state to exact idle and clears session refs

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `~/.bun/bin/bun x vitest run src/hooks/use-scout.test.tsx`
Expected: FAIL because the hook does not yet listen for native toggle events or expose a dedicated hard-stop method

- [ ] **Step 3: Implement the minimal toggle controller**

Update `src/hooks/use-scout.ts` to:
- listen for `scout://toggle-requested`
- expose a hard-stop path for active sessions
- reuse the existing session finalizer so the notch returns to the exact idle state

- [ ] **Step 4: Run the targeted test**

Run: `~/.bun/bin/bun x vitest run src/hooks/use-scout.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-scout.ts src/hooks/use-scout.test.tsx src/lib/conversation-completion.ts
git commit -m "feat: wire scout shortcut toggle into session control"
```

### Task 8: Keep the notch UI stable while adding shortcut control

**Files:**
- Modify: `src/components/notch-widget.tsx`
- Modify: `src/components/notch-widget.test.tsx`

- [ ] **Step 1: Add or extend failing notch tests**

Assert that:
- the notch still renders the correct idle state after a hard-stop
- shortcut-triggered activation does not change notch sizing rules
- the Preferences work does not leak any settings UI into the notch surface

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `~/.bun/bin/bun x vitest run src/components/notch-widget.test.tsx`
Expected: FAIL until the updated hook and widget integration agree on the new toggle behavior

- [ ] **Step 3: Make the minimal notch integration updates**

Keep `NotchWidget` focused on rendering, but update it as needed to consume the refined hook API without changing the approved notch design.

- [ ] **Step 4: Run the targeted test**

Run: `~/.bun/bin/bun x vitest run src/components/notch-widget.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/notch-widget.tsx src/components/notch-widget.test.tsx
git commit -m "test: lock notch behavior during shortcut integration"
```

## Chunk 5: End-to-end verification and polish

### Task 9: Run full verification and first-run smoke checks

**Files:**
- No code changes expected unless polish is required

- [ ] **Step 1: Run the full frontend test suite**

Run: `~/.bun/bin/bun run test`
Expected: PASS

- [ ] **Step 2: Run the frontend build**

Run: `~/.bun/bin/bun run build`
Expected: PASS

- [ ] **Step 3: Run the Rust test suite**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: PASS

- [ ] **Step 4: Run Rust compile verification**

Run: `cargo check --manifest-path src-tauri/Cargo.toml`
Expected: PASS

- [ ] **Step 5: Do a manual Tauri smoke test**

Run: `~/.bun/bin/bun run tauri dev`
Expected:
- first launch without a saved shortcut opens Preferences
- saving a shortcut enables global toggle behavior
- pressing the shortcut from another app activates Scout
- pressing the shortcut again hard-stops Scout and returns the notch to exact idle
- the menu bar item reopens Preferences

- [ ] **Step 6: Commit follow-up polish if needed**

```bash
git add <any adjusted files>
git commit -m "chore: polish scout shortcut trigger flow"
```
