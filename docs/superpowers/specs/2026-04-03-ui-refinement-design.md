# UI Refinement Design — Refined Consistency

**Date:** 2026-04-03
**Project:** ANTAGONIST — Emergence
**Status:** Draft

## Overview

Professionalize the game UI by applying disciplined design consistency across all four problem areas: spacing/alignment, visual polish, layout structure, and theme consistency. The approach keeps the existing hive/organic theme but enforces strict design rules so everything feels intentional and finished.

## 1. Spacing & Layout Grid

### 1.1 8px Grid System

All padding, margin, and gap values snap to the existing CSS variable scale in `design-tokens.css`:

| Token | Value | Use |
|-------|-------|-----|
| `--space-xs` | 4px | Micro spacing (icon gaps, text tight) |
| `--space-sm` | 8px | Tight grouping, section gaps |
| `--space-md` | 16px | Base unit, panel padding |
| `--space-lg` | 24px | Section padding, major separation |
| `--space-xl` | 32px | Between major content areas |

### 1.2 Fixed Component Heights

| Component | Height | Notes |
|-----------|--------|-------|
| Header | 56px | Fixed, never shrinks |
| Footer | 40px | Fixed, never shrinks |
| Command Input | 48px | Input bar only (excludes actions menu) |
| Action Buttons | 36px / 40px | sm / md via existing token |

### 1.3 Layout Structure (unchanged)

```
┌─────────────────────────────────┐
│  Header (56px, fixed)           │
├─────────────────────────────────┤
│                                 │
│  Terminal Output (flex-1)       │
│                                 │
├─────────────────────────────────┤
│  Command Input (48px)           │
│  Actions Menu (collapsible)     │
├─────────────────────────────────┤
│  Footer (40px, fixed)           │
└─────────────────────────────────┘
```

The mycelial canvas background, glitch overlay, and noise overlay remain at their current z-index layers.

### 1.4 Gap Consistency

- Between major sections (terminal → input → footer): `--space-lg` (24px)
- Between elements within a section (header items, footer stats): `--space-md` (16px)
- Between tight items (icon + label, stat groups): `--space-sm` (8px)

## 2. Visual Polish & Theme Consistency

### 2.1 Color Token Consolidation

**Problem:** `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-dim` are defined in both `game.css` and `design-tokens.css`. Some components use inline hex values instead of CSS variables.

**Fix:**
- `game.css` `:root` is the **single source of truth** for all color values
- `design-tokens.css` keeps spacing, typography, motion, elevation, z-index, focus, glow, and dimension tokens only — **remove all color definitions**
- All JSX must reference CSS variables, never raw hex values (except in CSS files themselves)

### 2.2 Inline Style Elimination

Every `style={{ background: 'var(...)', border: '...' }}` in JSX gets replaced with Tailwind utility classes:

```tsx
// Before
<div style={{ background: 'var(--soil-dark)' }}>

// After
<div className="bg-[var(--soil-dark)]">
```

For compound styles (background + border + shadow together), define a CSS class in `game.css` and apply via `className`.

### 2.3 Border Unification

All borders use consistent width tokens:
- Subtle borders (panels, cards): `var(--border-width-thin)` = 1px with `var(--border-subtle)`
- Emphasis borders (input focus, active states): `var(--border-width-normal)` = 1px with `var(--clay-orange)`
- Thick borders (modal edges): `var(--border-width-thick)` = 2px with `var(--border-medium)`

Corner radius: `var(--radius-md)` (8px) for all interactive elements, `var(--radius-lg)` (12px) for panels.

### 2.4 Dead Code Removal

| File | Reason |
|------|--------|
| `src/components/GameLayout.tsx` | Exports `Header`, `StatusBar`, `MenuPanel` — never rendered in `App.tsx` |
| Duplicate `cn()` in `TerminalOutput.tsx` (lines 8-10) | Already defined in `@/utils/cn.ts` |

### 2.5 Textured Overlays via Puter.js

Generate 3 transparent 256×256 PNG textures at build time:

| Texture | Description | CSS Usage |
|---------|-------------|-----------|
| `panel-grain.png` | Subtle film grain noise | Panel backgrounds at 3% opacity |
| `spore-dust.png` | Scattered bioluminescent dots | Terminal area at 5% opacity |
| `mycelial-noise.png` | Organic conic gradient pattern | Header/footer at 4% opacity |

**Implementation:**
- Build script using Puter.js canvas API
- Output to `public/textures/`
- CSS: `background-image: url('/textures/panel-grain.png')`
- Opacity controlled in CSS, not in the image alpha channel
- Run via `npm run textures` as a pre-build hook

## 3. Component Refinements

### 3.1 Header (`HiveHeader`)

- Fixed 56px height
- Stats (AWR, SEN, Day) displayed as dashboard metrics: small uppercase label above large bold value
- Action buttons (mute, settings, menu): uniform 32×32px squares with `var(--radius-sm)` radius and `var(--border-subtle)` border
- Vertical divider (`1px` wide, `20px` tall) between title and stats group
- Audio initialization/error states remain inline in the right action group

### 3.2 Footer (`HiveFooter`)

- Fixed 40px height
- Left: subject label + location with icon
- Right: stats as label-over-value blocks (EXPLORED, AWAKENED, INVENTORY)
- 16px gap between stat blocks
- Single subtle top border

### 3.3 Command Input

- Fixed 48px height for the input bar
- Chevron prompt in `var(--clay-orange)`
- Execute button uses existing `Button` component at `size="md"`
- Actions menu toggle integrated below input (no separate row) — small text link or icon
- Action sections get consistent `.actions-section` card styling with `var(--radius-md)` and `var(--border-subtle)`

### 3.4 Terminal Output

- Padding: `var(--space-md)` (16px) on all sides
- Line spacing: `var(--space-xs)` (4px) between lines
- Remove duplicate `cn()` function, import from `@/utils/cn`

### 3.5 Modal (Settings, Menu, Mastery)

- All modals use the existing `Modal` component from `ui/index.tsx`
- Consistent `var(--radius-lg)` (12px) corners
- Header: 16px padding, bottom border
- Body: 24px padding
- Close button: 32×32px in header

### 3.6 Game State Display

- No structural changes — collapsible panels already work
- Internal spacing tightened to `var(--space-sm)`
- Progress bar height: 6px (small), 10px (medium)
- Font sizes: section headers 12px uppercase, content 13px

## 4. CSS Architecture

### 4.1 File Responsibilities

| File | Purpose |
|------|---------|
| `game.css` | All color definitions (`:root`), base element styles, component classes, animations, responsive breakpoints |
| `design-tokens.css` | Semantic tokens only: spacing, typography scale, motion/duration, easing, elevation shadows, border radius, z-index, focus indicators, glow effects, component dimensions |
| `hive-ui.css` | Organic animations only: mycelial canvas effects, membrane breathing, glitch animations, consciousness node styles, awareness-based UI evolution |

### 4.2 Glitch Text Performance

The `.text-glitch` animation runs `infinite` with `clip-path` changes at 5 keyframes. This is expensive. Change to:
- Only apply the glitch animation when `gameState.glitchLevel > 0` (conditional class)
- Reduce keyframe count from 5 to 3
- Increase duration from `0.3s` to `0.5s` for less jarring effect

### 4.3 Broad Selector Cleanup

Remove this selector from `game.css`:
```css
p, span, div, label, button, a {
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}
```

Replace with targeted text shadow on specific text classes (`.text-narrative`, `.text-system`, etc.) only. The broad selector hurts readability on small text and adds unnecessary paint cost.

### 4.4 Accessibility Preserved

All existing accessibility features remain unchanged:
- ARIA roles and labels on interactive elements
- Focus trap in modals
- Screen reader announcements
- High contrast mode overrides
- Reduced motion media query
- Font size scaling

## 5. File Change Summary

### Files to Modify
- `src/styles/game.css` — Remove duplicate colors, remove broad text-shadow selector, fix glitch animation, tighten text type classes
- `src/styles/design-tokens.css` — Remove all color definitions
- `src/styles/hive-ui.css` — Simplify gradients, keep only essential animations
- `src/App.tsx` — Replace inline styles with Tailwind classes
- `src/components/ui/index.tsx` — Replace inline styles with Tailwind + CSS vars
- `src/components/hive/HiveMindLayout.tsx` — Fix header/footer spacing, uniform heights
- `src/components/CommandInput.tsx` — Unified heights, cleaner actions menu
- `src/components/TerminalOutput.tsx` — Remove duplicate `cn()`, fix padding

### Files to Delete
- `src/components/GameLayout.tsx` — Dead code

### Files to Create
- `public/textures/panel-grain.png` — Puter.js generated
- `public/textures/spore-dust.png` — Puter.js generated
- `public/textures/mycelial-noise.png` — Puter.js generated
- `scripts/generate-textures.js` — Puter.js build script

### Package Changes
- Add `puter` (or `puter.js`) to `devDependencies` for texture generation

## 6. Testing

- `npm run build` — Must produce zero compile errors
- `npm run dev` — Visual verification of all UI states (start screen, gameplay, settings modal, menu panel, encounter preparation, glitch states, high contrast mode)
- Responsive check at 375px (mobile), 768px (tablet), 1440px (desktop)
- Audio init error state visible and retry works
- Reduced motion mode disables all animations
- Keyboard navigation through all interactive elements
