# Scout Premium Notch Redesign Design

## Summary

Scout's notch should feel like a premium macOS surface first and an AI assistant second.
The redesign keeps the hardware-native black notch silhouette, removes colorful assistant styling, and uses motion sparingly to signal voice activity.

## Approved decisions

- Overall direction: hardware-native
- Idle identity: always branded
- Active layout: leading logo with waveform on the right
- Integration approach: hybrid
- Idle state mark: static Scout logo from `src/assets/scout-logo.svg`
- Listening and speaking mark: animated `ScoutLogo` component from `src/components/ScoutLogo.tsx`
- Waveform style: monochrome rounded bars based on the provided reference image
- Visual language: premium, professional, minimal, and nearly colorless

## Goals

- Make the notch feel closer to the physical Mac notch
- Preserve clear state feedback for idle, listening, processing, searching, speaking, and error
- Introduce Scout branding without turning the interface into a glowing AI widget
- Keep the active states expressive enough to feel alive while staying visually restrained

## Non-goals

- No major changes to the conversation state machine in `useScout`
- No rework of the Tauri windowing model
- No multicolor gradients, neon accents, or decorative glow-driven identity

## Visual design

### Shell

The notch shell remains the dominant shape.
It should be matte black or near-black, with a very low-contrast border and soft shadow only for separation from the desktop.
The shell should read as dense hardware, not a floating chat pill.

### Idle

The idle notch stays compact and centered.
It shows only the static Scout logo, scaled down and visually quiet.
No waveform, no extra label, and no animated Wisp behavior in idle.

### Listening and speaking

These are the only states that use the animated Scout mark.
The notch expands horizontally into a leading-cluster layout:

- animated `ScoutLogo` on the left
- monochrome rounded waveform on the right

The waveform should resemble premium audio hardware rather than a generic equalizer.
The bars should have rounded ends, balanced spacing, and a calmer low-volume profile with stronger but still smooth peaks at higher audio levels.

### Processing and searching

These states stay quieter than voice states.
They should use a smaller expanded footprint than listening/speaking and pair the static Scout mark with short status text.
They should not use the full animated Wisp treatment.

### Error

The error state should preserve the same premium shell and layout discipline.
It can use a subtle error tint, but the overall interface should stay restrained and minimal.

## Motion

- Shell expansion and collapse should be smooth and controlled
- The animated Scout mark should blink, float, and drift only in listening and speaking
- Waveform motion should feel fluid, clean, and tied to live audio level
- No flashy bounce, glow pulses, or exaggerated transitions

## Implementation boundaries

### Frontend

The redesign is primarily a frontend composition and styling change.
The existing state machine in `src/hooks/use-scout.ts` remains the source of truth for notch states and audio level.

Expected frontend touchpoints:

- `src/components/notch-widget.tsx`
- `src/components/ScoutLogo.tsx`
- `src/components/idle-dot.tsx` or a replacement static badge component
- `src/components/waveform.tsx`
- `src/App.css`

### Assets

- static idle logo: `src/assets/scout-logo.svg`
- active animated mark: `src/components/ScoutLogo.tsx`

## Testing strategy

The redesign should add component-level coverage for state-specific rendering.
We do not need to unit test GSAP internals, but we should test which visual cluster renders in each state:

- idle shows static logo only
- listening shows animated Scout mark plus waveform
- speaking shows animated Scout mark plus waveform
- processing and searching do not render the animated mark

## Risks

- The imported `ScoutLogo` component currently still exports `WispLogo` and uses colorful gradient fills that may need adaptation
- GSAP and `@gsap/react` are not currently installed in the repo
- The current CSS is more assistant-pill than hardware-notch and will need broad but focused restyling

## References

- `NotchDrop` visual model: notch as physical shell first, content second
- User-provided waveform reference: rounded monochrome bars with premium audio-equipment feel
