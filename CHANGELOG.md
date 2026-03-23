# Changelog

All notable changes to Scout will be documented in this file.

The repository changelog is intended to follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) in spirit and is generated/updated with `git-cliff`.

## Unreleased

### Added

- Native macOS menu bar and compact tray controls
- Preferences window for shortcut configuration
- macOS-first global shortcut activation flow
- Premium notch redesign with Scout branding
- Release-ready GitHub Actions CI and release automation

### Changed

- Improved notch lifecycle stability during activation and session cleanup
- Improved Preferences window UX and shortcut recording
- Updated app and tray icon handling from source assets

### Fixed

- Startup idle-state flicker during first activation
- Notch return-to-idle cleanup after session end
- Self-listening loop risk while Scout is speaking
