# Technical Specification: Scout

### The Voice Agent That Lives In Your Notch

**Document Status:** Draft  
**Version:** 1.0  
**Author:** Bloxy Studios  
**Date:** 2025-03-19

-----

## Executive Summary

**Problem:** Finding real-time information requires breaking focus — opening a browser, typing a search, reading a page. There’s no ambient, always-available intelligence layer on the desktop.

**Solution:** Scout is a macOS notch-native voice agent that wakes on “Hey Scout”, fires Firecrawl Search to get live structured web data, and speaks back a natural-language answer via ElevenLabs Agents — all without you touching the keyboard.

**Impact:** A genuinely new category of desktop UX — ambient AI as a system-layer widget, not an app you open.

-----

## 1. The Core Loop

```
Idle (tiny glow in notch)
  ↓  user says "Hey Scout"
Listening (notch expands, waveform animates)
  ↓  user asks question
Processing (ElevenLabs Agent receives transcript)
  ↓  agent calls Firecrawl Search tool mid-conversation
Searching (notch shows "searching…" indicator)
  ↓  Firecrawl returns structured content
Speaking (waveform pulses with audio amplitude)
  ↓  answer delivered
Idle (notch collapses after 5s)
```

-----

## 2. Architecture

```
┌─────────────────────────────────────────────┐
│            macOS Notch (top of screen)       │
│  ┌────────────────────────────────────────┐  │
│  │  Tauri v2 Transparent Window           │  │
│  │  (always-on-top, click-through edges)  │  │
│  │                                        │  │
│  │  React UI ──── ElevenLabs React SDK    │  │
│  │  (notch states)   (useConversation)    │  │
│  └──────────────────────┬─────────────────┘  │
└─────────────────────────│────────────────────┘
                          │ WebRTC
                          ▼
              ┌───────────────────────┐
              │  ElevenLabs Agent     │
              │  (voice ↔ reasoning)  │
              └──────────┬────────────┘
                         │ Server Tool call
                         ▼
              ┌───────────────────────┐
              │  Firecrawl /search    │
              │  (live web content)   │
              └───────────────────────┘
```

### Component Breakdown

**Tauri v2 Shell (Rust)**

- Transparent, frameless, `alwaysOnTop` window positioned at notch coords (top-center of primary display)
- Window level set above status bar via `NSMainMenuWindowLevel + 1` using raw Cocoa bindings
- Click-through on transparent regions using cursor-position-based `setIgnoreCursorEvents` toggling
- Rust side-thread continuously analyzes mic input for amplitude threshold (“Hey Scout” trigger)
- Emits `wake-word-detected` Tauri event to frontend when triggered

**React Frontend**

- Renders 4 notch states as animated components (see Section 4)
- `useConversation` hook from `@elevenlabs/react` manages the full WebRTC session lifecycle
- Listens for Tauri events to start/stop sessions, update UI state
- Framer Motion for smooth notch expand/collapse animations

**ElevenLabs Agent**

- Configured via ElevenLabs dashboard with a custom system prompt
- Firecrawl registered as a **Server Tool** — the agent calls it automatically when it needs live data
- Voice: warm, calm, fast-paced delivery (male or female, to be finalized)
- No conversation history stored (stateless per wake session)

**Firecrawl Search Tool**

- Endpoint: `POST https://api.firecrawl.dev/v1/search`
- Registered in ElevenLabs as a Server Tool with schema below
- Returns structured markdown content, not raw HTML
- Agent can fire 1–3 searches per query for synthesis

-----

## 3. ElevenLabs Agent Configuration

### System Prompt

```
You are Scout, a sharp and friendly voice assistant that lives in the macOS notch. 
You answer questions about anything — tech news, startups, stocks, research, current events — 
by searching the live web and synthesizing what you find into a concise spoken answer.

Rules:
- Always search before answering anything factual or time-sensitive
- Keep answers under 4 sentences unless the user asks for more detail
- Sound natural and conversational, not robotic
- Don't say "I found X results" — just answer directly
- If the topic is stocks/crypto, include the current price or % change if found
- If the topic is a startup or company, lead with what's most recent/interesting
- Never make up information — if search returns nothing useful, say so honestly
- End with "Anything else?" only if the answer was complex; otherwise just stop
```

### Firecrawl Server Tool Schema (registered in ElevenLabs dashboard)

```json
{
  "name": "web_search",
  "description": "Search the live web for current information about any topic. Use this for news, stock prices, company info, research, or any factual question.",
  "url": "https://api.firecrawl.dev/v1/search",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer {{FIRECRAWL_API_KEY}}",
    "Content-Type": "application/json"
  },
  "body": {
    "query": "{{query}}",
    "limit": 5,
    "scrapeOptions": {
      "formats": ["markdown"],
      "onlyMainContent": true
    }
  },
  "parameters": {
    "query": {
      "type": "string",
      "description": "The search query to run. Be specific. Include dates or 'today' for time-sensitive queries."
    }
  }
}
```

-----

## 4. Notch UI States

### State Machine

```
IDLE → LISTENING → PROCESSING → SEARCHING → SPEAKING → IDLE
          ↑                                              |
          └──────────────── (5s timeout) ───────────────┘
```

### Visual Design

|State       |Notch Width|Height|Content                              |Animation           |
|------------|-----------|------|-------------------------------------|--------------------|
|`IDLE`      |120px      |36px  |Tiny indigo pulse dot                |Slow breathe        |
|`LISTENING` |340px      |56px  |Waveform bars (mic input reactive)   |Spring expand       |
|`PROCESSING`|260px      |48px  |“Thinking…” subtle shimmer           |Pulse               |
|`SEARCHING` |280px      |48px  |“Searching the web…” + spinner       |Fade in             |
|`SPEAKING`  |340px      |56px  |Waveform bars (audio output reactive)|Pulse with amplitude|

### Color Palette

- Background: `rgba(0, 0, 0, 0.85)` with `backdrop-filter: blur(20px)`
- Waveform / accent: Indigo `#6366F1` → Violet `#8B5CF6` gradient
- Text: White `#FFFFFF` at 90% opacity
- Spinner/shimmer: `#818CF8`

### Typography

- Font: `Geist` (same as Wisp branding)
- Size: 13px, weight 500
- Letter spacing: 0.01em

-----

## 5. Tauri Window Configuration

### `tauri.conf.json` (notch window)

```json
{
  "app": {
    "windows": [{
      "label": "notch",
      "title": "Scout",
      "width": 400,
      "height": 80,
      "x": "center",
      "y": 0,
      "decorations": false,
      "transparent": true,
      "alwaysOnTop": true,
      "resizable": false,
      "skipTaskbar": true,
      "visible": true,
      "focus": false,
      "shadow": false
    }]
  }
}
```

### Rust: Setting Window Level Above Menu Bar

```rust
// src-tauri/src/lib.rs
#[cfg(target_os = "macos")]
fn set_notch_window_level(window: &tauri::WebviewWindow) {
    use cocoa::appkit::NSMainMenuWindowLevel;
    use cocoa::base::id;
    use objc::runtime::Object;

    let ns_window = window.ns_window().unwrap() as id;
    unsafe {
        let _: () = objc::msg_send![
            ns_window as *mut Object,
            setLevel: NSMainMenuWindowLevel as i64 + 1
        ];
    }
}
```

### Rust: Wake Word Detection via Amplitude Threshold

```rust
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use tauri::Emitter;

#[tauri::command]
async fn start_wake_word_listener(app: tauri::AppHandle) -> Result<(), String> {
    let host = cpal::default_host();
    let device = host.default_input_device()
        .ok_or("No input device")?;
    let config = device.default_input_config()
        .map_err(|e| e.to_string())?;

    let app_clone = app.clone();
    let mut cooldown = std::time::Instant::now();

    let stream = device.build_input_stream(
        &config.into(),
        move |data: &[f32], _| {
            let rms = (data.iter().map(|s| s * s).sum::<f32>() / data.len() as f32).sqrt();
            // Threshold crossing = "Hey Scout" approximation for demo
            // Production: integrate Porcupine SDK here
            if rms > 0.08 && cooldown.elapsed().as_secs() > 3 {
                cooldown = std::time::Instant::now();
                app_clone.emit("wake-word-detected", ()).unwrap();
            }
        },
        |err| eprintln!("Audio error: {}", err),
        None
    ).map_err(|e| e.to_string())?;

    stream.play().map_err(|e| e.to_string())?;
    // Keep stream alive
    std::mem::forget(stream);
    Ok(())
}
```

-----

## 6. React Frontend

### `useScout.ts` — Core Hook

```typescript
import { useConversation } from '@elevenlabs/react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';

export type NotchState = 'idle' | 'listening' | 'processing' | 'searching' | 'speaking';

export function useScout() {
  const [notchState, setNotchState] = useState<NotchState>('idle');
  const [audioLevel, setAudioLevel] = useState(0);

  const conversation = useConversation({
    onConnect: () => setNotchState('listening'),
    onDisconnect: () => {
      setTimeout(() => setNotchState('idle'), 5000);
    },
    onMessage: ({ message, source }) => {
      if (source === 'user') setNotchState('processing');
      if (source === 'ai') setNotchState('speaking');
    },
    onError: (error) => {
      console.error('Scout error:', error);
      setNotchState('idle');
    },
    clientTools: {
      // Called when agent starts a Firecrawl search
      onSearchStart: () => {
        setNotchState('searching');
        return 'acknowledged';
      }
    }
  });

  useEffect(() => {
    // Start mic listener in Rust
    invoke('start_wake_word_listener');

    // Listen for wake word event from Rust
    const unlisten = listen('wake-word-detected', async () => {
      if (notchState === 'idle') {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        await conversation.startSession({
          agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID,
          connectionType: 'webrtc',
        });
      }
    });

    return () => { unlisten.then(fn => fn()); };
  }, [notchState]);

  return { notchState, audioLevel, conversation };
}
```

### `NotchWidget.tsx` — UI Component

```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useScout } from './useScout';

const NOTCH_WIDTHS: Record<string, number> = {
  idle: 120, listening: 340, processing: 260,
  searching: 280, speaking: 340,
};

export function NotchWidget() {
  const { notchState, audioLevel } = useScout();

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        className="rounded-b-2xl overflow-hidden"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}
        animate={{
          width: NOTCH_WIDTHS[notchState],
          height: notchState === 'idle' ? 36 : 56,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <AnimatePresence mode="wait">
          {notchState === 'idle' && <IdleDot key="idle" />}
          {notchState === 'listening' && <Waveform key="listen" level={audioLevel} />}
          {notchState === 'processing' && <StatusText key="proc" text="Thinking…" />}
          {notchState === 'searching' && <StatusText key="search" text="Searching the web…" spinner />}
          {notchState === 'speaking' && <Waveform key="speak" level={audioLevel} />}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
```

-----

## 7. Project Structure

```
scout/
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs          # Commands + wake word listener
│   │   └── main.rs         # Entry point
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── capabilities/
│       └── default.json    # Permissions
├── src/
│   ├── components/
│   │   ├── NotchWidget.tsx
│   │   ├── Waveform.tsx
│   │   ├── IdleDot.tsx
│   │   └── StatusText.tsx
│   ├── hooks/
│   │   └── useScout.ts
│   ├── App.tsx
│   └── main.tsx
├── .env                    # VITE_ELEVENLABS_AGENT_ID, FIRECRAWL_API_KEY
├── package.json
└── vite.config.ts
```

-----

## 8. Dependencies

### Frontend

```json
{
  "@elevenlabs/react": "^0.14.2",
  "@tauri-apps/api": "^2.0.0",
  "framer-motion": "^12.0.0",
  "react": "^19.0.0",
  "typescript": "^5.7.0"
}
```

### Rust (Cargo.toml)

```toml
[dependencies]
tauri = { version = "2", features = [] }
serde = { version = "1", features = ["derive"] }
cpal = "0.15"      # Audio input for wake detection

[target.'cfg(target_os = "macos")'.dependencies]
cocoa = "0.26"     # NSWindow level access
objc = "0.2"       # Objective-C runtime
```

### Capabilities (`capabilities/default.json`)

```json
{
  "identifier": "default",
  "windows": ["notch"],
  "permissions": [
    "core:default",
    "core:window:allow-set-ignore-cursor-events",
    "core:window:allow-start-dragging"
  ]
}
```

-----

## 9. Environment Variables

```bash
# .env
VITE_ELEVENLABS_AGENT_ID=your_agent_id_here

# Set in ElevenLabs dashboard as secret env var (not in frontend):
FIRECRAWL_API_KEY=fc-your_key_here
```

-----

## 10. Build & Run

```bash
# Install dependencies
npm install

# Dev mode (notch window will appear)
npm run tauri dev

# Production build (creates .dmg)
npm run tauri build
```

-----

## 11. Demo Video Script (Viral Format)

**Hook (0–3s):** Screen shows busy desktop. Text overlay: *“What if Siri actually knew things?”*

**Beat 1 (3–8s):** User says “Hey Scout” — notch expands with waveform glow

**Beat 2 (8–14s):** User asks: *“What’s happening with OpenAI today?”* — notch shows “Searching the web…”

**Beat 3 (14–22s):** Scout speaks back a crisp 3-sentence answer with today’s news. Notch collapses.

**Beat 4 (22–28s):** User asks: *“NVIDIA stock price right now?”* — instant search + answer

**Beat 5 (28–35s):** User asks: *“Summarize the latest on Llama 4”* — multi-search synthesis, spoken back

**Outro (35–40s):** Text overlay: *“Built with ElevenLabs Agents + Firecrawl. It lives in your notch.”* GitHub link.

**Caption hook:** *“I built an AI that lives in the macOS notch and searches the internet in real-time 🔦”*

-----

## 12. Build Phases

### Phase 1 — Notch Shell (Day 1)

- [ ] Tauri v2 project scaffolded
- [ ] Transparent window pinned to notch position
- [ ] Window level above menu bar (Cocoa bindings)
- [ ] Click-through on transparent regions working
- [ ] 4 UI states rendering with Framer Motion animations

### Phase 2 — Voice Integration (Day 2)

- [ ] ElevenLabs Agent created in dashboard
- [ ] System prompt configured
- [ ] Firecrawl registered as Server Tool in ElevenLabs
- [ ] `useConversation` hook wired to notch state machine
- [ ] WebRTC session starts/stops correctly

### Phase 3 — Wake Word (Day 2–3)

- [ ] `cpal` audio input stream in Rust
- [ ] Amplitude threshold detection working
- [ ] `wake-word-detected` Tauri event firing correctly
- [ ] Cooldown preventing double-triggers
- [ ] Full end-to-end loop tested: speak → answer → idle

### Phase 4 — Polish + Demo (Day 3–4)

- [ ] Waveform reactive to real mic/speaker amplitude
- [ ] Smooth spring animations on all transitions
- [ ] Edge cases handled (no mic, no network, API errors)
- [ ] Demo video recorded and edited
- [ ] README + submission written

-----

## 13. Risks & Mitigations

|Risk                              |Mitigation                                                           |
|----------------------------------|---------------------------------------------------------------------|
|Notch position varies by display  |Query `NSScreen` bounds at runtime, center window at `y=0`           |
|Mic permission blocked            |Show one-time onboarding prompt before first use                     |
|Wake word false positives         |3s cooldown + amplitude decay filter                                 |
|Firecrawl latency                 |Show “Searching…” state immediately; agent speaks while content loads|
|ElevenLabs WebRTC on Tauri webview|Test with `connectionType: 'websocket'` fallback                     |

-----

## 14. Success Criteria

- [ ] Notch expands/collapses smoothly in < 300ms
- [ ] Wake detection triggers within 1s of speech
- [ ] Firecrawl search completes in < 3s
- [ ] Full question-to-answer loop in < 6s
- [ ] Demo video hits: compelling hook, clean UI, real-time search visible
