# PomoTodo Implementation Plan (Checklist)

**Source specification:** `/home/ryu/projects/comparison-pomodoro-todo/experiment-2-independent-plans/prompt.txt`  
**Draft date:** 2025-10-27

## Phase 0 — Project Scaffolding & Governance
- [x] Confirm three-file structure (`index.html`, `style.css`, `app.js`) and Vanilla JS only (no build tools, frameworks, or external libraries). ✅️
- [x] Establish global constants module in `app.js` for timing defaults, validation limits, and storage keys. ✅️
- [x] Define namespace or IIFE wrapper to avoid global leaks and set up strict mode usage. ✅️
- [x] Draft coding conventions (naming, function sizing, DOM query patterns) to align with single-responsibility and avoid >100-line functions. ✅️
- [x] Prepare manual testing matrix mirroring evaluation criteria (functional, UX, performance, accessibility). ✅️

## Phase 1 — Data Models & Persistence Layer
- [x] Model `Task`, `Timer`, and `Settings` objects based on specification (fields, defaults, optional attributes). ✅️
  - [x] Implement factory/util functions to create new task IDs and timestamps. ✅️
  - [x] Implement normalization functions to enforce limits (title length, pomodoro bounds, duration ranges). ✅️
- [x] Implement LocalStorage service with JSON serialization, guards for quota and availability, and error surfacing (E005/E006 messages). ✅️
- [x] Create bootstrapping routine to load persisted state, migrate legacy keys (if any), and fall back to empty defaults when parsing fails. ✅️
- [x] Track "today" context and reset `pomodoro_today` counters when date changes (per spec: past 30-day history). ✅️
- [x] Establish pub/sub or event dispatcher to notify UI of state updates (tasks, timer, settings). ✅️

## Phase 2 — Core UI Layout & Styling Framework
- [x] Build semantic HTML skeleton reflecting responsive layouts (desktop split view, tablet ratio adjustments, mobile stacked view/tabs). ✅️
- [x] Implement CSS variables (light/dark mode palette) and typography tokens as provided. ✅️
- [x] Create base components: header summary bar, todo column, timer column, statistics cards, modal/notification containers. ✅️
- [x] Wire responsive breakpoints (≥1024px, 768–1023px, <768px) ensuring timer prominence on mobile. ✅️
- [x] Add base animations (fadeIn, fadeOut, pulse) and transition utilities for re-use across components. ✅️

## Phase 3 — Todo List Functionality
- [x] **Task Creation** ✅️
  - [x] Implement input form with validation (non-empty, ≤100 chars) and numeric optional estimate (1–20) including inline error messaging (E001/E002). ✅️
  - [x] Support Enter key submission, auto-focus, and field reset post-add. ✅️
  - [x] Apply insertion animation and prepend new tasks to list. ✅️
- [x] **Task Rendering & Interactions** ✅️
  - [x] Render task cards with checkbox, title, estimate/actual badge (`🍅 actual/estimate`), controls for edit/delete. ✅️
  - [x] Distinguish selected vs completed states via styles, accessibility attributes, and ARIA labels. ✅️
- [x] **Editing** ✅️
  - [x] Enable double-click to enter inline edit mode with form controls, confirm on Enter, cancel on Esc, block other actions while editing (E008). ✅️
  - [x] Validate edits identical to creation; prevent empty result (E001). ✅️
- [x] **Deletion** ✅️
  - [x] Provide delete button with fade-out animation and guard when timer is running on that task (E004). ✅️
- [x] **Completion Toggle** ✅️
  - [x] Handle checkbox toggles updating completion status, moving completed tasks (optionally) to bottom, adjusting styling, capturing `completedAt` timestamp. ✅️
- [x] **Filtering** ✅️
  - [x] Implement All/Active/Completed filters with highlight state, animated transitions, and persistence of selection (Settings.filterState). ✅️
- [x] **Search (Low priority, optional)** ✅️
  - [x] Provide real-time substring filter input; integrate with existing filter logic when enabled. ✅️
- [x] Ensure all task mutations trigger storage sync and UI refresh via centralized controller. ✅️

## Phase 4 — Timer Engine & Controls
- [x] **State Machine Design** ✅️
  - [x] Implement timer modes (`work`, `shortBreak`, `longBreak`, `idle`) with transitions per long-break interval rules. ✅️
  - [x] Track `startedAt`, `remainingTime`, and paused offsets using system time drift correction. ✅️
- [x] **Core Mechanics** ✅️
  - [x] Use `setInterval` worker firing every 1s, recalculating remaining time via `Date.now()` delta to maintain ±1s accuracy. ✅️
  - [x] Implement start guard requiring selected task (E003) and storing snapshot to persistence. ✅️
  - [x] Implement pause/resume toggles preserving exact remaining seconds. ✅️
  - [x] Implement reset with confirmation dialog (E007) returning to default durations without losing task selection. ✅️
  - [x] Implement skip transition logic to next appropriate mode (work ↔ breaks). ✅️
- [x] **UI Display** ✅️
  - [x] Render large timer text (MM:SS), mode indicator, progress bar animation (circular or linear), and active task title. ✅️
  - [x] Reflect mode colors (red/green) and animate pulse while running. ✅️
- [x] **Completion Handling** ✅️
  - [x] On work session completion, increment selected task `actualPomodoros`, update daily totals, append timestamp to history, and emit notifications (audio + optional browser Notification API). ✅️
  - [x] Auto-transition to break modes with appropriate messaging and call-to-action for next session. ✅️
- [x] **Persistence & Recovery** ✅️
  - [x] Persist timer snapshot after each tick and restore from LocalStorage on reload or focus change. ✅️
  - [x] Handle day rollover: archive previous day counts into history and reset `pomodoroCount`. ✅️
- [x] **Audio & Notifications** ✅️
  - [x] Preload audio clips (beep/bell/chime/silent) and implement settings-driven playback respecting user mute preference. ✅️
  - [x] Implement permission request flow for Notification API (graceful fallback if denied). ✅️

## Phase 5 — Todo & Timer Integration
- [x] Lock task selection changes while timer is active (display E004/E008-style guidance). ✅️
- [x] Highlight selected task across list and timer header; sync selection to persistence for restoration. ✅️
- [x] Update per-task and aggregate statistics immediately on session completion (color-coded based on estimate attainment). ✅️
- [x] Display "Today" summary (total pomodoros, completed tasks, total work time, streak) in header/statistics cards and keep in sync. ✅️
- [x] Add progress indicators on task cards (bar/percentage) reflecting `actual/estimated` ratios with threshold-based colors. ✅️

## Phase 6 — Settings & Advanced Features
- [ ] Build settings panel/modal allowing adjustments for durations, long break interval, notification sound, focus mode toggle, and filter default.
- [ ] Validate settings inputs (ranges per spec), persist via `Settings` model, and propagate changes to timer engine.
- [ ] Implement focus mode restrictions: disable add/edit/delete, dim non-selected tasks, and provide tooltip messaging.
- [ ] Implement weekly statistics view (CSS-based bar chart) using last 7 days from history without external libraries.
- [ ] Implement reorder controls (drag-and-drop using HTML5 API or alternative buttons) with guard against filtered views.
- [ ] Implement optional features: bulk delete completed tasks (confirmation dialog) and data export/import (JSON download/upload with merge logic).

## Phase 7 — Accessibility, Security & UX Polish
- [ ] Ensure semantic HTML structure with ARIA roles, labels, and `aria-live` regions for dynamic updates (timer, errors).
- [ ] Provide keyboard shortcuts: Tab order, Enter submission, Space toggles, Esc to dismiss modals/edits.
- [ ] Implement focus outlines and ensure contrast ratios meet WCAG AA for both light/dark schemes.
- [ ] Sanitize all user inputs before rendering (textContent usage, avoid innerHTML except safe templates).
- [ ] Provide descriptive error messages mapped to codes (E001–E008) and ensure they are screen-reader friendly.
- [ ] Optimize animations to respect `prefers-reduced-motion` media query.

## Phase 8 — Quality Assurance & Performance Validation
- [ ] Execute manual regression pass covering evaluation checklist (functional, timer transitions, persistence).
- [ ] Stress-test with 100 tasks: verify responsiveness (<200ms) and memory footprint (<5MB).
- [ ] Validate timer accuracy over 25-minute session (±1s) and pause/resume behavior.
- [ ] Verify LocalStorage error handling by simulating quota exhaustion (try/catch path) and disabled storage scenarios.
- [ ] Test across target browsers (Chrome, Firefox, Safari, Edge) and responsive breakpoints.
- [ ] Document test results in logs directory (if required) and capture known limitations.

## Phase 9 — Launch Readiness & Handover
- [ ] Review code against coding conventions and ensure no function exceeds recommended length or nesting depth.
- [ ] Remove dead code, unused listeners, and console statements; ensure vibe logger integrations (if applicable) remain untouched.
- [ ] Prepare brief usage notes for QA (commands, features toggles) without modifying README per constraints.
- [ ] Archive final LocalStorage schema snapshot and migration notes for future iterations.

---

### Progress Tracker Summary

- [ ] Phase 0 — Scaffolding & Governance
- [ ] Phase 1 — Data Models & Persistence
- [ ] Phase 2 — UI Layout & Styling
- [ ] Phase 3 — Todo Core
- [ ] Phase 4 — Timer Engine
- [ ] Phase 5 — Integration
- [ ] Phase 6 — Settings & Advanced Features
- [ ] Phase 7 — Accessibility & Security
- [ ] Phase 8 — QA & Performance
- [ ] Phase 9 — Launch Readiness
