# Releasing Scout

This document describes the current release model for Scout.

## Current release model

Scout is currently released as a macOS-first desktop app.

The repository includes:

- CI checks for pushes and pull requests
- a tag-based GitHub Release workflow
- automatic release asset uploads
- generated GitHub release notes
- a repo changelog workflow powered by `git-cliff`

## Creating a release

### Recommended path

1. Ensure the main branch is green.
2. Create and push a version tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

3. GitHub Actions will:
   - build the macOS release artifacts
   - upload them to a GitHub Release
   - generate GitHub release notes
   - attach a `SHA256SUMS.txt` file

### Manual dispatch

The release workflow also supports manual dispatch for an existing tag.

Use this when:

- you need to rebuild a release
- you want to retry a failed release job

## Current artifact expectations

The workflow is built around Tauri’s real bundle outputs through the official Tauri build action.
It intentionally avoids hardcoding fragile local bundle paths in the release upload step.

## Signing and notarization

Scout release automation currently assumes unsigned macOS builds unless signing is configured later.

That means:

- the build should succeed without Apple signing secrets
- users may see standard Gatekeeper warnings
- notarization is not yet part of the release workflow

When signing is added later, the release workflow can be extended without replacing the entire release architecture.

## Changelog

Scout uses `git-cliff` for the repo changelog.

- `CHANGELOG.md` is the human-readable project changelog
- the changelog workflow can keep it updated from commit history
- GitHub generated release notes remain the primary per-release summary inside GitHub Releases

## Verification before tagging

Run:

```bash
~/.bun/bin/bun run test
~/.bun/bin/bun run build
cargo test --manifest-path src-tauri/Cargo.toml
cargo check --manifest-path src-tauri/Cargo.toml
```

If the full desktop smoke test is needed:

```bash
~/.bun/bin/bun run tauri dev
```

## Notes

- Scout is macOS-first right now
- release automation is intentionally pragmatic, not overbuilt
- CI and release workflows should reflect the real app state, not aspirational platform support
