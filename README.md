# Scout

Scout is a macOS-first voice assistant that lives in the notch area, starts fast, speaks naturally, and can search the live web when an answer needs current information.

Built with Tauri, React, Rust, ElevenLabs, and Firecrawl, Scout is designed to feel like a native desktop companion rather than a browser tab wearing a desktop costume.

## Why Scout exists

Most desktop assistants still feel disconnected from the operating system, too slow to activate, or too limited when a question depends on current information.

Scout aims to solve that by combining:

- a notch-native overlay UI
- low-friction voice interaction
- live web research through Firecrawl
- a desktop-first control model with keyboard shortcuts, menus, and a menu bar entry

The result is a voice assistant that feels closer to a real Mac utility than a demo chatbot.

## Key features

- Notch-style overlay UI that stays centered and hardware-native
- Global shortcut trigger for fast session start and stop
- Preferences window for shortcut setup
- ElevenLabs conversational voice sessions
- Firecrawl-backed live search for current answers
- Explicit end-of-conversation handling with return-to-idle behavior
- Premium animated active-state UI with Scout branding
- Native macOS menu bar and compact tray controls

## How Scout works

At a high level, Scout has three layers:

1. A Tauri/Rust shell that owns windows, native menus, tray behavior, shortcut registration, and positioning.
2. A React notch UI that renders the live assistant state.
3. A voice session layer powered by ElevenLabs, with optional Picovoice wake-word support and Firecrawl-backed live research.

Typical interaction flow:

1. The user triggers Scout from the keyboard shortcut or, later, the wake word.
2. Scout opens a live ElevenLabs voice session.
3. The notch expands into the active UI.
4. The agent answers directly or searches live information when needed.
5. Scout ends cleanly and returns to the compact idle notch.

## Architecture

### Frontend

- React 19
- TypeScript
- Vite
- Framer Motion
- GSAP for the animated Scout mark

### Desktop shell

- Tauri v2
- Rust
- Native macOS menu bar and tray integration
- Native window sizing, centering, and transparency handling

### Voice and intelligence

- `@elevenlabs/react` for conversational sessions
- Picovoice Porcupine for wake-word detection
- Firecrawl inside the ElevenLabs agent for live web search

## Current status

Scout is currently optimized for:

- macOS
- notch-style displays first
- keyboard shortcut activation as the primary trigger

Picovoice wake-word support remains part of the app, but the shortcut path is the most reliable activation path today while wake-word access and assets are still being finalized.

## Platform support

### Supported now

- macOS: primary supported platform

### Not yet production-ready

- Windows
- Linux
- signed and notarized macOS distribution

GitHub releases currently target macOS first and produce unsigned artifacts unless signing and notarization secrets are added later.

## Project structure

```text
Scout/
├── public/                     # Static assets, icons, Picovoice files
├── src/                        # React frontend
│   ├── components/             # Notch UI, preferences UI, waveform, branding
│   ├── hooks/                  # Scout session lifecycle, wake-word integration
│   ├── lib/                    # State, formatting, completion, utilities
│   └── config/                 # Frontend env parsing
├── src-tauri/                  # Rust/Tauri desktop shell
│   ├── src/                    # Native app logic
│   ├── icons/                  # Bundled app icons
│   └── tauri.conf.json         # Tauri app configuration
├── docs/                       # Design specs and implementation plans
├── ENV_SETUP.md                # Local environment setup guide
└── README.md
```

## Prerequisites

Before running Scout locally, make sure you have:

- macOS
- Bun
- Rust toolchain
- Xcode Command Line Tools
- an ElevenLabs conversational agent
- a Picovoice access key if you want wake-word support
- Firecrawl configured inside the ElevenLabs agent if you want live web answers

## Local setup

### 1. Install dependencies

```bash
~/.bun/bin/bun install
```

If `bun` is already on your `PATH`, `bun install` is enough.

### 2. Configure environment variables

Copy the example env file:

```bash
cp .env.example .env
```

Then fill in the required values.

The complete setup guide lives in [ENV_SETUP.md](/Users/codewithabdul/Developer/Scout/ENV_SETUP.md).

### 3. Add Picovoice assets

Scout expects the Picovoice files under `public/picovoice/`:

- `porcupine_params.pv`
- your custom wake-word `.ppn` file

### 4. Configure the ElevenLabs agent

Your ElevenLabs agent should include:

- a client tool named `startSearchIndicator`
- Firecrawl tools or server integration for live web search
- the `end_call` system tool
- a system prompt that searches before answering current or time-sensitive questions

## Environment variables

Scout currently uses these local env vars:

- `VITE_ELEVENLABS_AGENT_ID`
- `VITE_ELEVENLABS_SERVER_LOCATION`
- `VITE_PICOVOICE_ACCESS_KEY`
- `VITE_PICOVOICE_KEYWORD_PUBLIC_PATH`

See [ENV_SETUP.md](/Users/codewithabdul/Developer/Scout/ENV_SETUP.md) for exact examples and setup steps.

## ElevenLabs notes

Scout uses ElevenLabs as the live conversational layer.

Important current behavior:

- `end_call` is the primary semantic close path
- the app keeps a client-side fallback to return to idle if a session becomes stale
- the mic is muted while Scout is speaking to reduce self-listening loops

## Firecrawl notes

Firecrawl is not configured in the local `.env`.
It is expected to be available through the ElevenLabs agent configuration.

Use Firecrawl for:

- live web search
- current facts
- time-sensitive product or company information
- recommendations based on current data

## Development

### Start the frontend only

```bash
~/.bun/bin/bun run dev
```

### Start the full desktop app

```bash
~/.bun/bin/bun run tauri dev
```

### Run tests

```bash
~/.bun/bin/bun run test
cargo test --manifest-path src-tauri/Cargo.toml
```

### Build the frontend

```bash
~/.bun/bin/bun run build
```

### Check the Rust/Tauri side

```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

## Release workflow

Scout ships with:

- GitHub Actions CI for pull requests and pushes
- a macOS-first release workflow triggered by version tags like `v0.1.0`
- automatic GitHub Release asset uploads
- generated release notes
- a repo-level changelog pipeline powered by `git-cliff`

Current release expectation:

- macOS artifacts are built and attached to GitHub Releases
- artifacts are unsigned unless signing/notarization secrets are configured later

Detailed release automation notes live in [RELEASING.md](/Users/codewithabdul/Developer/Scout/RELEASING.md).

## Changelog strategy

Scout uses:

- `git-cliff` for repository changelog generation
- GitHub generated release notes for GitHub Releases

This avoids depending on perfect PR labeling and fits the current stage of the project better than heavier release-management systems.

The repo changelog is tracked in [CHANGELOG.md](/Users/codewithabdul/Developer/Scout/CHANGELOG.md).

## Known limitations

- macOS is the only platform considered release-ready right now
- wake-word support depends on correct Picovoice assets and access
- signing and notarization are not configured yet
- release artifacts may trigger normal Gatekeeper warnings until signing is added
- the frontend build currently emits a large-chunk warning during production builds

## Contributing

Scout is still moving quickly, so contributions should stay pragmatic and focused.

If you contribute:

- keep changes aligned with the macOS-first direction
- reuse the existing Scout session lifecycle instead of adding parallel control flows
- run the full test/build checks before opening a PR

Recommended verification:

```bash
~/.bun/bin/bun run test
~/.bun/bin/bun run build
cargo test --manifest-path src-tauri/Cargo.toml
cargo check --manifest-path src-tauri/Cargo.toml
```

## Developer notes

- The notch UI is intentionally separate from the Preferences window surface
- Rust owns menus, tray behavior, shortcuts, and native window behavior
- React owns the notch and preferences UI state
- Scout’s session lifecycle is centralized in `useScout`
- Menu actions, tray actions, shortcuts, and future wake-word activation should all reuse the same session lifecycle
