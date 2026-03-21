# Scout Premium Notch Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Scout's notch so it feels hardware-native and premium, with a static idle logo, an animated Scout mark in voice states, and a monochrome rounded waveform.

**Architecture:** Keep the existing Scout state machine and Tauri window behavior intact while rebuilding the notch's visual composition in React. Use the existing notch state values to switch between a static badge cluster and an active voice cluster, and restyle the shell in CSS for a matte, minimal finish.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, GSAP, `@gsap/react`, existing Scout/Tauri frontend

---

## Chunk 1: Dependencies and render coverage

### Task 1: Install animation dependencies

**Files:**
- Modify: `package.json`
- Modify: `bun.lock`

- [ ] **Step 1: Add a failing import usage target**

Decide the implementation will import `gsap` and `@gsap/react` from `src/components/ScoutLogo.tsx`.

- [ ] **Step 2: Verify the dependency gap**

Run: `rg -n '"gsap"|"@gsap/react"' package.json bun.lock -S`
Expected: no matches

- [ ] **Step 3: Install the minimal dependencies**

Run: `~/.bun/bin/bun add gsap @gsap/react`

- [ ] **Step 4: Verify the dependencies are present**

Run: `rg -n '"gsap"|"@gsap/react"' package.json bun.lock -S`
Expected: package entries for both dependencies

- [ ] **Step 5: Commit**

```bash
git add package.json bun.lock
git commit -m "build: add scout notch animation dependencies"
```

### Task 2: Add failing component tests for notch state visuals

**Files:**
- Create: `src/components/notch-widget.test.tsx`
- Modify: `src/components/notch-widget.tsx`
- Modify: `src/test/setup.ts`

- [ ] **Step 1: Write the failing test**

Create tests that assert:
- idle renders the static Scout badge and not the active waveform cluster
- listening renders the animated Scout logo and waveform
- speaking renders the animated Scout logo and waveform
- processing/searching do not render the animated Scout logo

- [ ] **Step 2: Run test to verify it fails**

Run: `~/.bun/bin/bun run test src/components/notch-widget.test.tsx`
Expected: FAIL because the current notch still renders the idle dot and old waveform structure

- [ ] **Step 3: Commit the failing test**

```bash
git add src/components/notch-widget.test.tsx src/test/setup.ts
git commit -m "test: cover notch visual state rendering"
```

## Chunk 2: Scout mark integration

### Task 3: Make the animated Scout component production-ready

**Files:**
- Modify: `src/components/ScoutLogo.tsx`

- [ ] **Step 1: Run the failing visual-state test**

Run: `~/.bun/bin/bun run test src/components/notch-widget.test.tsx`
Expected: FAIL

- [ ] **Step 2: Implement the minimal ScoutLogo cleanup**

Update the component to:
- export `ScoutLogo`
- keep GSAP selectors safely scoped to the component
- expose stable accessibility/test hooks if needed
- neutralize or parameterize the colorful styling so the active mark can match the monochrome notch system

- [ ] **Step 3: Run the targeted test again**

Run: `~/.bun/bin/bun run test src/components/notch-widget.test.tsx`
Expected: still FAIL until the notch widget uses the new component

- [ ] **Step 4: Commit**

```bash
git add src/components/ScoutLogo.tsx
git commit -m "refactor: prepare animated scout logo for notch states"
```

### Task 4: Add a static idle badge component

**Files:**
- Create: `src/components/scout-badge.tsx`
- Modify: `src/assets/scout-logo.svg` (read only if import treatment requires it)

- [ ] **Step 1: Run the failing visual-state test**

Run: `~/.bun/bin/bun run test src/components/notch-widget.test.tsx`
Expected: FAIL

- [ ] **Step 2: Implement the minimal static badge**

Create a focused component that renders the static Scout logo for idle and quiet states with consistent sizing and a stable test id.

- [ ] **Step 3: Run the targeted test again**

Run: `~/.bun/bin/bun run test src/components/notch-widget.test.tsx`
Expected: still FAIL until wired into the notch widget

- [ ] **Step 4: Commit**

```bash
git add src/components/scout-badge.tsx
git commit -m "feat: add static scout badge component"
```

## Chunk 3: Voice waveform redesign

### Task 5: Replace the waveform with the premium rounded-bar design

**Files:**
- Modify: `src/components/waveform.tsx`
- Modify: `src/App.css`

- [ ] **Step 1: Add a failing waveform test**

Create or extend a test that asserts the waveform renders the expected bar count and active voice cluster structure without depending on animation internals.

- [ ] **Step 2: Run test to verify it fails**

Run: `~/.bun/bin/bun run test src/components/notch-widget.test.tsx`
Expected: FAIL because the current waveform shape and active cluster do not match the new structure

- [ ] **Step 3: Implement the minimal waveform redesign**

Update `src/components/waveform.tsx` to:
- use rounded monochrome bars
- support calm low-level motion and stronger centered peaks
- work as a horizontal companion to the animated Scout mark

- [ ] **Step 4: Run the targeted test**

Run: `~/.bun/bin/bun run test src/components/notch-widget.test.tsx`
Expected: PASS for waveform structure assertions

- [ ] **Step 5: Commit**

```bash
git add src/components/waveform.tsx src/App.css src/components/notch-widget.test.tsx
git commit -m "feat: redesign scout voice waveform"
```

## Chunk 4: Notch composition and shell styling

### Task 6: Recompose the notch by state

**Files:**
- Modify: `src/components/notch-widget.tsx`
- Modify: `src/components/status-text.tsx`
- Modify: `src/App.css`

- [ ] **Step 1: Run the failing notch visual-state test**

Run: `~/.bun/bin/bun run test src/components/notch-widget.test.tsx`
Expected: FAIL

- [ ] **Step 2: Implement the minimal notch composition**

Update `src/components/notch-widget.tsx` so:
- idle uses the static Scout badge
- listening uses animated Scout logo plus waveform
- speaking uses animated Scout logo plus waveform
- processing/searching use quieter static mark plus text
- error keeps the premium layout while showing a concise error message

- [ ] **Step 3: Restyle the shell for the premium hardware look**

Update `src/App.css` to:
- remove colorful glow-heavy styling
- use matte black surfaces and low-contrast borders
- tighten spacing and shell geometry
- keep transitions smooth and restrained

- [ ] **Step 4: Run the component test**

Run: `~/.bun/bin/bun run test src/components/notch-widget.test.tsx`
Expected: PASS

- [ ] **Step 5: Run the full frontend test suite**

Run: `~/.bun/bin/bun run test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/notch-widget.tsx src/components/status-text.tsx src/App.css src/components/notch-widget.test.tsx
git commit -m "feat: apply premium scout notch redesign"
```

## Chunk 5: Verification

### Task 7: Run full verification

**Files:**
- No code changes expected

- [ ] **Step 1: Run tests**

Run: `~/.bun/bin/bun run test`
Expected: PASS

- [ ] **Step 2: Run build**

Run: `~/.bun/bin/bun run build`
Expected: PASS

- [ ] **Step 3: Smoke-check the Tauri shell if needed**

Run: `~/.bun/bin/bun run tauri dev`
Expected: notch launches with the premium shell, static idle logo, animated Scout mark in listening/speaking, and the redesigned waveform

- [ ] **Step 4: Commit verification-only follow-ups if needed**

```bash
git add <any adjusted files>
git commit -m "chore: polish premium scout notch redesign"
```
