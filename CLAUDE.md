# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Scout is a cross-platform desktop application built with **Tauri v2**, **React 19**, and **TypeScript**. The frontend is bundled with Vite and communicates with a Rust backend through Tauri's IPC mechanism.

## Common Commands

```bash
# Development
bun run dev          # Start Vite dev server (frontend only)
bun run tauri dev    # Start full Tauri app with hot reload

# Build
bun run build        # TypeScript compile + Vite build (frontend only)
bun run tauri build  # Full production build (creates native installers)

# Preview
bun run preview      # Preview production build
```

## Architecture

```
Scout/
├── src/                    # React frontend (TypeScript)
│   ├── main.tsx           # React entry point
│   ├── App.tsx            # Root component
│   └── App.css            # Styles
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── main.rs        # Binary entry point (calls scout_lib::run())
│   │   └── lib.rs         # Tauri app definition + commands
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration (windows, bundle, etc.)
└── vite.config.ts         # Vite config tailored for Tauri
```

### Frontend-to-Backend Communication

React components call Rust functions using Tauri's `invoke` API:

```typescript
import { invoke } from "@tauri-apps/api/core";
const result = await invoke("command_name", { arg1: "value" });
```

Rust commands are defined in `src-tauri/src/lib.rs` with `#[tauri::command]`:

```rust
#[tauri::command]
fn command_name(arg1: &str) -> Result<String, String> { ... }
```

Commands must be registered in `tauri::generate_handler![...]` in `lib.rs`.

### Tauri Configuration

Key settings in `tauri.conf.json`:
- `identifier`: `com.bloxystudios.scout` (reverse-domain app ID)
- `build.beforeDevCommand`: `bun run dev` (runs before `tauri dev`)
- `build.beforeBuildCommand`: `bun run build` (runs before `tauri build`)
- `app.windows`: Default window dimensions (800x600)

### Vite Configuration

The Vite server is configured specifically for Tauri:
- Port 1420 (fixed, `strictPort: true`)
- HMR on port 1421 when using external host
- Ignores `src-tauri/**` from watch to prevent Rust-compile loops

## Development Notes

- This project uses **bun** as the package manager (configured in `tauri.conf.json`)
- The Rust library is named `scout_lib` (with `_lib` suffix) to avoid Windows naming conflicts
- TypeScript is strict: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` are enabled
