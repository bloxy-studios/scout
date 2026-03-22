# Scout Native Menu Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full native macOS-style menu bar for Scout plus a compact quick-control tray menu, wiring Scout-specific actions into the existing session lifecycle.

**Architecture:** Keep all menu definition and menu dispatch in the Tauri/Rust layer, and emit a small set of app events for Scout-specific actions. The frontend should continue to own activation and end-session behavior through `useScout`, so menu commands, tray commands, shortcut triggers, and notch interactions all share the same lifecycle.

**Tech Stack:** Tauri v2, Rust, React 19, TypeScript, Vite, Vitest, existing Scout tray/menu setup, existing Preferences window and shortcut system

---

## File structure

### Native / Rust

- Create: `src-tauri/src/menu_actions.rs`
  - Own menu IDs, menu construction helpers, and event names for Scout-specific actions.
- Modify: `src-tauri/src/lib.rs`
  - Wire the full top menu, compact tray menu, state-aware Scout actions, and menu event dispatch.
- Modify: `src-tauri/src/preferences_window.rs`
  - Add any small helper needed for `Close Window` behavior or stable window identification.

### Frontend / React

- Modify: `src/hooks/use-scout.ts`
  - Subscribe to new app-level menu events like `scout://start-requested` and `scout://end-requested`.
- Modify: `src/hooks/use-scout.test.tsx`
  - Cover menu-triggered start and end behavior.

## Chunk 1: Native menu model and event IDs

### Task 1: Add failing Rust tests for menu IDs and the compact tray menu shape

**Files:**
- Create: `src-tauri/src/menu_actions.rs`
- Test: `src-tauri/src/menu_actions.rs`

- [ ] **Step 1: Write the failing Rust tests**

Add focused tests that assert:
- the app-level menu IDs are stable
- the tray quick-action IDs are stable
- the compact tray menu chooses `Start Scout` and `End Conversation` item IDs from one shared action model

- [ ] **Step 2: Run the targeted Rust tests to verify they fail**

Run: `cargo test --manifest-path src-tauri/Cargo.toml menu_actions`
Expected: FAIL because the module and tests do not exist yet

- [ ] **Step 3: Implement the minimal menu action model**

Create `src-tauri/src/menu_actions.rs` with:
- constants for app menu IDs
- constants for Scout action event names
- helper functions for building the compact tray menu and the top menu sections
- a small helper that chooses whether the quick tray action should represent start or end

- [ ] **Step 4: Run the targeted Rust tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml menu_actions`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/menu_actions.rs
git commit -m "feat: add scout native menu action model"
```

## Chunk 2: Full native menu bar and compact tray wiring

### Task 2: Replace the minimal app menu with the full native menu set

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/menu_actions.rs`

- [ ] **Step 1: Write the failing Rust tests**

Add tests that assert:
- the top menu now includes `Scout`, `File`, `Edit`, `View`, `Window`, `Help`
- the tray menu stays intentionally smaller than the top menu
- the menu bar icon still uses the custom `menu-icon.png` asset in template mode on macOS

- [ ] **Step 2: Run the targeted Rust tests to verify they fail**

Run: `cargo test --manifest-path src-tauri/Cargo.toml menu_bar`
Expected: FAIL because the fuller menu structure is not implemented yet

- [ ] **Step 3: Implement the native menu structure**

Update `src-tauri/src/lib.rs` so it:
- builds the full top application menu
- uses standard macOS item ordering for `Scout`, `Edit`, and `Window`
- puts `Start Scout`, `End Conversation`, and `Preferences…` in `File`
- includes `Reload` and `Toggle DevTools` only in development for `View`
- adds minimal `Help` items
- keeps the tray menu limited to quick-control actions

- [ ] **Step 4: Run the targeted Rust tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml menu_bar`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/lib.rs src-tauri/src/menu_actions.rs
git commit -m "feat: add native scout menu bar and compact tray menu"
```

### Task 3: Wire menu item selection to native or frontend behavior

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/preferences_window.rs`

- [ ] **Step 1: Write the failing Rust behavior tests**

Add focused tests or pure helper coverage for:
- `Preferences…` routes to the Preferences window
- `Quit Scout` routes to app exit
- Scout-specific menu items route to event emission instead of direct duplicate control logic

- [ ] **Step 2: Run the targeted Rust tests to verify they fail**

Run: `cargo test --manifest-path src-tauri/Cargo.toml menu_event`
Expected: FAIL because the new event routing helpers are not implemented

- [ ] **Step 3: Implement the minimal dispatch layer**

Update `src-tauri/src/lib.rs` so menu events:
- open Preferences through the existing preferences window helpers
- quit through the native Tauri exit path
- emit `scout://start-requested`
- emit `scout://end-requested`
- keep tray and top-menu actions reusing the same dispatch path

- [ ] **Step 4: Run the targeted Rust tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml menu_event`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/lib.rs src-tauri/src/preferences_window.rs
git commit -m "feat: wire scout native menu actions"
```

## Chunk 3: Frontend event bridge

### Task 4: Add failing hook tests for menu-driven start and end events

**Files:**
- Modify: `src/hooks/use-scout.test.tsx`
- Modify: `src/hooks/use-scout.ts`

- [ ] **Step 1: Write the failing frontend tests**

Add tests that assert:
- `scout://start-requested` activates Scout when idle
- `scout://end-requested` ends the session when Scout is active
- duplicate menu events do not create overlapping sessions

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `~/.bun/bin/bun x vitest run src/hooks/use-scout.test.tsx`
Expected: FAIL because the hook only listens for the existing toggle event

- [ ] **Step 3: Implement the minimal frontend bridge**

Update `src/hooks/use-scout.ts` so it:
- subscribes to `scout://start-requested`
- subscribes to `scout://end-requested`
- routes those events to the existing activation and hard-stop lifecycle
- does not create a second session control system

- [ ] **Step 4: Run the targeted test**

Run: `~/.bun/bin/bun x vitest run src/hooks/use-scout.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-scout.ts src/hooks/use-scout.test.tsx
git commit -m "feat: connect scout menu events to session lifecycle"
```

## Chunk 4: Help/About and production-safe polish

### Task 5: Add minimal Help/About behavior without overbuilding

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/menu_actions.rs`

- [ ] **Step 1: Write the failing Rust tests or helper checks**

Add coverage that asserts:
- `About Scout` has a stable menu ID
- `Scout Help` and `Keyboard Shortcuts` have stable menu IDs
- development-only `View` items are not part of the production helper output

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `cargo test --manifest-path src-tauri/Cargo.toml help_menu`
Expected: FAIL because the help/about dispatch helpers do not exist yet

- [ ] **Step 3: Implement the minimal help/about behavior**

Use the simplest stable behavior that fits the hackathon scope:
- a native about action if available through Tauri
- otherwise a simple existing-window or external-link fallback
- shortcut help can route to Preferences or a concise help surface

- [ ] **Step 4: Run the targeted Rust tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml help_menu`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/lib.rs src-tauri/src/menu_actions.rs
git commit -m "feat: add scout help and about menu actions"
```

## Chunk 5: Verification

### Task 6: Run full project verification

**Files:**
- Verify only

- [ ] **Step 1: Run frontend tests**

Run: `~/.bun/bin/bun run test`
Expected: PASS

- [ ] **Step 2: Run frontend build**

Run: `~/.bun/bin/bun run build`
Expected: PASS with only the existing large-chunk warning

- [ ] **Step 3: Run Rust tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: PASS with only the existing macOS `cocoa` / `objc` warnings

- [ ] **Step 4: Run Rust type/build verification**

Run: `cargo check --manifest-path src-tauri/Cargo.toml`
Expected: PASS

- [ ] **Step 5: Run a Tauri boot smoke test**

Run: `~/.bun/bin/bun run tauri dev`
Expected: Scout boots, menus appear, tray menu appears, Preferences still opens

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add native scout menu bar and tray controls"
```
