# Changelog

## [0.2.2](https://github.com/bloxy-studios/scout/compare/scout-v0.2.1...scout-v0.2.2) (2026-03-23)


### Bug Fixes

* **audio:** eliminate activation and conversation latency ([a1ca335](https://github.com/bloxy-studios/scout/commit/a1ca335cef9d40e454206cfab1e8b5d2850225e0))
* **audio:** eliminate activation and conversation latency ([9b1cdac](https://github.com/bloxy-studios/scout/commit/9b1cdaceae6273a0845668afada9662f147d3c05))
* **audio:** restore micMuted to prevent self-listening loops ([5c18203](https://github.com/bloxy-studios/scout/commit/5c18203b4263650e0f41c5a1d068d0b9b0531ee2))
* **audio:** restore user-friendly microphone permission error ([534096c](https://github.com/bloxy-studios/scout/commit/534096c2bf95525ee9c5f5606e361eded2470f03))

## [0.2.1](https://github.com/bloxy-studios/scout/compare/scout-v0.2.0...scout-v0.2.1) (2026-03-23)


### Bug Fixes

* **ci:** fix artifact upload path resolving ([8179d0f](https://github.com/bloxy-studios/scout/commit/8179d0f77541592517f9c1ff188f4823d146a985))

## [0.2.0](https://github.com/bloxy-studios/scout/compare/scout-v0.1.0...scout-v0.2.0) (2026-03-23)


### Features

* add first-run onboarding wizard with shortcut setup and mic permission ([8659377](https://github.com/bloxy-studios/scout/commit/8659377ddc7918e3946cdf01a2f59798a0646980))
* adopt notchdrop-inspired scout shell ([8d58f2f](https://github.com/bloxy-studios/scout/commit/8d58f2f5fc99c110783c60d6f549310a4d0a98fc))
* build scout notch voice overlay ([169c913](https://github.com/bloxy-studios/scout/commit/169c913f90ae6c18c0586f45dd7cfc3bc4f1ecea))
* redesign scout notch visuals ([2d0cff2](https://github.com/bloxy-studios/scout/commit/2d0cff232849250980b7b44f904a68f63d84525f))


### Bug Fixes

* **ci:** rename release-please config file ([faa65e3](https://github.com/bloxy-studios/scout/commit/faa65e3ed5e31e422abc97500325198b59727eb7))
* prevent notch from reverting to idle during activation and remove stale timeout ([a0f3021](https://github.com/bloxy-studios/scout/commit/a0f3021a04481d07c46a5679d9daa452ea9bf5c5))
* remove white notch canvas background ([1458b8b](https://github.com/bloxy-studios/scout/commit/1458b8b17c84124a1d6fcd19a4f1cc18c9f079de))
* show notch window across all spaces and increase preferences window height ([d5fc534](https://github.com/bloxy-studios/scout/commit/d5fc53496f07d3473b6535f786ff99d17e807be2))
* tighten scout notch native canvas ([4b8b338](https://github.com/bloxy-studios/scout/commit/4b8b3383ba8a8293ecdc79196fd6f6e8eedfe5a3))

## Changelog

All notable changes to Scout will be documented in this file.

The repository changelog is generated with git-cliff from commit history.
## Unreleased

### Added


- Build scout notch voice overlay

- Redesign scout notch visuals

- Adopt notchdrop-inspired scout shell

- Add first-run onboarding wizard with shortcut setup and mic permission



### Build


- Add scout notch animation dependencies



### CI


- Install ffmpeg to fix macOS icon generation



### Chore


- Update environment variables, enhance .gitignore, and improve README documentation



### Documentation


- Add premium scout notch redesign spec and plan

- Add scout shortcut trigger design

- Add scout shortcut trigger plan

- Add scout native menu design and plan

- Update changelog

- 

docs: update changelog



### Fixed


- Tighten scout notch native canvas

- Remove white notch canvas background

- Prevent notch from reverting to idle during activation and remove stale timeout

- Show notch window across all spaces and increase preferences window height



### Other Changes


- First commit
