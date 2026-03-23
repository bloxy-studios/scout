# Scout: Hackathon Demo Video Script

**Format:** 9:16 (Vertical) for TikTok/Reels/Shorts, or 1:1/4:5 for X/LinkedIn.
**Target Length:** ~35 seconds.
**Goal:** Win "Most Viral" (+200 pts) and impress judges by showcasing live Firecrawl search + ElevenLabs voice inside a native macOS notch UI.
**Audio:** Your voice (mic), Scout's voice (system audio), subtle Lo-Fi/Synthwave beat.
**Visuals:** High-res screen recording of a clean Mac desktop. Dynamic zooming on the notch area.

---

## 🎬 Scene-by-Scene Script

### 0:00 - 0:03 | THE HOOK (The "Aha!" Moment)
*   **Visual:** Tight zoom on the empty macOS notch. A mouse cursor is visible but still. Suddenly, we hear a crisp keyboard click (`Option + Space`). The notch smoothly springs open into the pulsing "listening" waveform.
*   **On-Screen Text (Large, center, bold):** I built an AI that lives in my Mac's notch.
*   **You (Voiceover/Speaking naturally):** "I got tired of opening Chrome, so I built Scout."

### 0:03 - 0:12 | THE FIRECRAWL FLEX (Live News)
*   **Visual:** Zoomed in slightly on the notch. We see the waveform reacting to your voice.
*   **You:** "Scout, what's the top story on Hacker News right now?"
*   **Visual:** The notch switches to the "Searching the web…" state with the spinner.
    *   *Editing Note:* Show the "Searching..." state for exactly 1 second, then cut straight to the moment Scout starts speaking. Don't make the viewer wait for the API call in real-time.
*   **On-Screen Text (Pops up during search):** ⚡️ Live scraping via Firecrawl
*   **Visual:** Fast cut. The notch switches to the "speaking" waveform, pulsing with the audio amplitude.
*   **Scout (ElevenLabs Voice):** "The top story right now is about a new breakthrough in quantum error correction from Google, sitting at 450 points."

### 0:12 - 0:22 | THE REAL-TIME FLEX (Finance/Data)
*   **Visual:** We see the notch go back to listening (pulse animation).
*   **You:** "What's the current price of NVIDIA stock?"
*   **Visual:** Notch goes to "Searching..." then quickly cuts to "Speaking".
*   **On-Screen Text:** 📉 Real-time data
*   **Scout:** "Nvidia is currently trading at $142.50, up two percent today."
*   **Visual (Optional Polish):** Pop up a small, sleek graphic or emoji of a chart 📈 next to the notch to make it visually punchy.

### 0:22 - 0:28 | THE DEEP DIVE (Docs/Summarization)
*   **Visual:** Notch listening again.
*   **You:** "Summarize the latest Next.js 15 release notes."
*   **Visual:** Notch searching, then speaking.
*   **On-Screen Text:** 📚 Reading entire docs instantly
*   **Scout:** "Next.js 15 introduces the new React Compiler, turbopack by default, and major caching improvements. Anything else?"

### 0:28 - 0:35 | THE OUTRO & CTA
*   **Visual:** You hit a shortcut key (or double-click the notch, if supported) and the notch collapses smoothly back into the tiny idle dot. Zoom out to show the full, clean desktop.
*   **You:** "No, that's it. Bye."
*   **On-Screen Text (Centered, bold, stays on screen until end):**
    Built with @ElevenLabs & @Firecrawl
    Vote for Scout! 👇
    #ElevenHacks

---

## 🛠️ Production & Editing Checklist

1.  **Prep the Environment:**
    *   Hide your desktop icons. Use a dark, clean wallpaper so the white/indigo notch UI pops.
    *   Make sure your `VITE_ELEVENLABS_AGENT_ID` is pointing to an agent with Firecrawl configured as a tool.
    *   **Crucial:** Test the three specific queries beforehand to ensure Firecrawl returns clean results quickly and the ElevenLabs agent formats them well.
2.  **Screen Recording:**
    *   Use QuickTime or OBS. Record the whole screen at high resolution (4K if possible) so you can punch in (zoom) without losing quality.
    *   Record your mic audio and the system audio (Scout's voice) on separate tracks if possible, or just make sure the mix sounds clean.
3.  **Editing (CapCut / Premiere):**
    *   **The Golden Rule:** Cut out the silence.
    *   **Zooming:** Start slightly zoomed out, punch in (zoom quickly) when the notch expands. Pan the camera slightly to follow the action if needed.
    *   **Captions:** Use dynamic captions (Alex Hormozi style) in the center or bottom of the screen. Keep them punchy. Highlight key words like "Hacker News", "NVIDIA", and "Firecrawl" in a different color (maybe the indigo brand color `#6366F1`).
    *   **Sound Design:** Add a subtle "whoosh" sound effect when the notch expands/collapses to emphasize the UX. Keep background music low and driving (synthwave or lo-fi).

## 🏆 Social Media Strategy (For "Most Viral" +200 pts)

*   **Cross-Post Everywhere:** Export a 9:16 version for TikTok, Instagram Reels, and YouTube Shorts. Export a 1:1 or 4:5 version for LinkedIn and X.
*   **The Caption:** "Siri is useless, so I built an AI that lives in my Mac's notch. It uses @Firecrawl to search the live web and @ElevenLabs to talk back. Built for #ElevenHacks. What should I ask it next?"
