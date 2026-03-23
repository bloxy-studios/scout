# Scout `.env` Setup

This file shows exactly what goes in your local `.env` file and where each value comes from.

## 1. Copy the example file

From the project root, create your local env file:

```bash
cp .env.example .env
```

Then open `.env` and replace the placeholder values.

## 2. What your `.env` should look like

```env
VITE_ELEVENLABS_AGENT_ID=agent_your_real_agent_id
VITE_ELEVENLABS_SERVER_LOCATION=us
VITE_PICOVOICE_ACCESS_KEY=pv_your_real_access_key
VITE_PICOVOICE_KEYWORD_PUBLIC_PATH=/picovoice/hey-scout.ppn
```

## 3. How to get each value

### `VITE_ELEVENLABS_AGENT_ID`

This is the ID of your ElevenLabs conversational agent.

How to get it:

1. Sign in to the ElevenLabs dashboard.
2. Create a new conversational agent, or open the one you already made for Scout.
3. Copy the agent ID from the agent setup UI.

What it usually looks like:

```text
agent_123abc...
```

Use that value in `.env`:

```env
VITE_ELEVENLABS_AGENT_ID=agent_123abc...
```

### `VITE_ELEVENLABS_SERVER_LOCATION`

This tells the ElevenLabs SDK which region or residency location to use.

For most setups, keep this as:

```env
VITE_ELEVENLABS_SERVER_LOCATION=us
```

Valid values in this app are:

- `us`
- `global`
- `eu-residency`
- `in-residency`

If you are not sure, use `us`.

### `VITE_PICOVOICE_ACCESS_KEY`

This is your Picovoice access key for Porcupine wake-word detection.

How to get it:

1. Sign in to the Picovoice Console.
2. Go to the home page of the console.
3. Copy your `AccessKey`.

What it usually looks like:

```text
pv_xxxxxxxxxxxxxxxxx
```

Use that value in `.env`:

```env
VITE_PICOVOICE_ACCESS_KEY=pv_xxxxxxxxxxxxxxxxx
```

### `VITE_PICOVOICE_KEYWORD_PUBLIC_PATH`

This is the public path to your custom Porcupine keyword file (`.ppn`).

How to get it:

1. In the Picovoice Console, create a custom keyword for Scout.
2. Download the Web/WASM version of the keyword file.
3. Put the downloaded `.ppn` file into:

```text
public/picovoice/
```

Example:

```text
public/picovoice/hey-scout.ppn
```

Then set this in `.env`:

```env
VITE_PICOVOICE_KEYWORD_PUBLIC_PATH=/picovoice/hey-scout.ppn
```

Important:

- This value is a public browser path, not a filesystem path.
- Use `/picovoice/filename.ppn`, not `public/picovoice/filename.ppn`.

## 4. One more required file for Picovoice

Scout also expects the Porcupine model file at:

```text
public/picovoice/porcupine_params.pv
```

Place the Picovoice model file there before running the app.

## 5. What is not stored in `.env`

Firecrawl is not configured through `.env` in this app.

Set Firecrawl up inside your ElevenLabs agent as a server tool. The app only needs the agent ID locally.

Also enable the ElevenLabs `end_call` system tool for Scout. Use it as the primary semantic way to end conversations when the user clearly says they are done. The desktop app keeps a client-side fallback for stuck or stale sessions, but `end_call` should be the main closing path.

Good `end_call` triggers include:
- goodbye variants like `bye`, `goodbye`, `see you`
- completion phrases like `that's all`, `that's what I needed`, `I'm done`
- polite wrap-ups like `no thanks`, `I'm good`, `all set`

## 6. Quick checklist

- `.env` exists in the project root
- `VITE_ELEVENLABS_AGENT_ID` is your real ElevenLabs agent ID
- `VITE_ELEVENLABS_SERVER_LOCATION` is set to `us` unless you need another residency option
- `VITE_PICOVOICE_ACCESS_KEY` is your real Picovoice access key
- `public/picovoice/hey-scout.ppn` exists
- `public/picovoice/porcupine_params.pv` exists

## 7. Demo / hackathon build

For a packaged demo build (e.g. for hackathon judges), Scout's config values are baked into the app at build time. **The packaged `.app` does not read `.env` at runtime** — Vite replaces all `VITE_*` references with their literal values during the frontend build step.

### What this means

- All four `VITE_*` values are **client-side SDK keys and identifiers**, not server-side secrets.
- `VITE_ELEVENLABS_AGENT_ID` is a public agent identifier designed for client-side use.
- `VITE_PICOVOICE_ACCESS_KEY` is a client-side SDK key with built-in rate limits.
- Baking these into a demo build is the intended usage pattern for both SDKs.
- No backend proxy or native secret store is needed for a hackathon demo.

### How to build a demo

1. Make sure `.env` has your real values (not the placeholders from `.env.example`).
2. Make sure `public/picovoice/hey-scout.ppn` and `public/picovoice/porcupine_params.pv` exist.
3. Build the app:

```bash
~/.bun/bin/bun run tauri build
```

4. The packaged `.app` in `src-tauri/target/release/bundle/macos/` is self-contained and ready to demo.

### Tradeoffs

- The agent ID and Picovoice key are embedded in the JS bundle. This is fine for a demo or limited distribution.
- If you later ship Scout publicly, consider moving the Picovoice access key behind a lightweight backend that issues short-lived tokens, or using ElevenLabs signed URLs. For a hackathon, this is unnecessary.
- Do not ship long-lived server-side API secrets (like an OpenAI key or Firecrawl server key) in the client bundle. Scout currently does not do this — Firecrawl runs as a server tool inside ElevenLabs, not in the client.

## 8. Run the app

After filling in `.env` and placing the Picovoice files:

```bash
~/.bun/bin/bun run tauri dev
```

If the app fails at startup, double-check the `.env` values first.

## 9. Official docs

- ElevenLabs React SDK: https://elevenlabs.io/docs/eleven-agents/libraries/react
- ElevenLabs client tools: https://elevenlabs.io/docs/eleven-agents/customization/tools/client-tools
- ElevenLabs agent quickstart: https://elevenlabs.io/docs/eleven-agents/quickstart/
- Picovoice Porcupine overview: https://picovoice.ai/docs/porcupine/
- Picovoice Porcupine Web quickstart: https://picovoice.ai/docs/quick-start/porcupine-web/
