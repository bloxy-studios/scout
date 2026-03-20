# Scout

Scout is a macOS-first Tauri v2 desktop overlay that lives at the top-center of the screen, waits for a wake word, and starts an ElevenLabs voice session that can use Firecrawl for live web answers.

## Stack

- Tauri v2 for the transparent desktop shell
- React 19 + Vite for the notch UI
- `@elevenlabs/react` for conversation sessions
- `@picovoice/porcupine-web` + `@picovoice/web-voice-processor` for wake-word detection

## Environment

Copy `.env.example` to `.env` and provide real values for:

- `VITE_ELEVENLABS_AGENT_ID`
- `VITE_ELEVENLABS_SERVER_LOCATION`
- `VITE_PICOVOICE_ACCESS_KEY`
- `VITE_PICOVOICE_KEYWORD_PUBLIC_PATH`

Scout expects the Picovoice model assets under `public/picovoice/`.

- Add `porcupine_params.pv` at `public/picovoice/porcupine_params.pv`
- Add your custom `Hey Scout` keyword at the path referenced by `VITE_PICOVOICE_KEYWORD_PUBLIC_PATH`

## ElevenLabs Setup

Create an ElevenLabs conversational agent and configure:

- A blocking client tool named `startSearchIndicator`
- A Firecrawl server tool for live web search
- A prompt that searches before answering factual or time-sensitive questions

Use the agent ID from that setup in `VITE_ELEVENLABS_AGENT_ID`.

## Development

```bash
~/.bun/bin/bun install
~/.bun/bin/bun run test
~/.bun/bin/bun run build
~/.bun/bin/bun run tauri dev
```

If `bun` is already on your `PATH`, you can omit the full binary path.

Picovoice works best when the dev server sends `Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy`; the Vite config now provides those headers automatically.

## Notes

- The hidden local fallback trigger is `Alt+Space` in development.
- Wake-word detection runs in the web layer, while Tauri owns window placement and cursor interactivity.
- On non-notched displays, Scout still renders as a centered notch-style overlay.
