# Planning Pass: Premium Chat-First Surface Assistant UI System

## Executive Summary

This report defines the premium UI system for the chat-first Surface Assistant shell.

The assistant is the app.

This should feel like a premium AI-native workspace, not a website with a chatbot attached.

No generic chatbot styling. No admin dashboard energy. No marketing-page chrome. The chat shell is the product surface.

This is a planning artifact only. It does not implement UI, refactor existing surfaces, deploy, or create screenshots.

## Existing UI And Motion Inventory

The following repo patterns are the canonical starting points for the future shell:

- Surface Runtime shell rules: `framework/standards/SURFACE_RUNTIME_V1_STANDARD.md`
- Native composer rules: `framework/standards/ASSISTANT_COMPOSER_CONTRACT.md`
- Mobile viewport rules: `framework/standards/MOBILE_VIEWPORT_CONTRACT.md`
- Motion tokens: `motion/motion-tokens.css`
- View transitions: `motion/view-transition-library.css`
- Shared-element transitions: `motion/shared-element-library.css`
- Generated assistant modal template: `framework/templates/bounded-static-assistant/public/index.html`
- Generated modal and composer CSS: `framework/templates/bounded-static-assistant/public/styles.css`
- Generated streaming and scroll behavior: `framework/templates/bounded-static-assistant/public/script.js`
- WebMNEM modal ownership and boundary-aware scroll logic: `assistants/webmnem-okf-memory-layer/public/script.js`
- SV2 full-bleed focus modal pattern: `assistants/sv2-biosphere-kids/public/index.html` and `script.js`
- Runtime validation: `tools/validate-mobile-viewport.js`, `tools/validate-motion-ux-contract.js`, and `tools/validate-surface-runtime.js`
- Capsule rules: `agent-modes/modes/SURFACE_RUNTIME_V1_MODE.json`, `MOBILE_VIEWPORT_UX_MODE.json`, and `ASSISTANT_COMPOSER_NATIVE_BOX_MODE.json`

Reusable patterns:

- `wm-motion-surface` for transition-ready surfaces.
- `wm-assistant-chrome` for header/composer chrome collapse.
- `data-assistant-modal` and `.assistant-panel` as viewport-owned modal primitives.
- `.assistant-body` as the internal scroll owner.
- `.assistant-composer`, `.composer-row`, and `textarea[name="question"]` as the composer contract.
- `visualViewport` height/offset tracking from WebMNEM for mobile keyboard/browser chrome handling.
- Boundary-aware wheel/touch prevention from WebMNEM/SV2.
- SV2 focus modal anatomy for full-screen artifact rendering.

## Target Visual Language

The chat-first shell should be dark-first with a clean light fallback.

Visual qualities:

- minimal
- glass-morphic
- frosted
- thin-lined
- low-noise
- premium
- mobile-native
- desktop-polished
- highly legible
- image-independent
- softly animated

Avoid:

- generic chat bubbles as the whole visual identity
- heavy SaaS dashboard panels
- marketing-page hero/nav/CTA structure
- pill spam
- oversized rounded wrappers around everything
- decorative blobs, orbs, or loud gradients
- harsh flat buttons when glass controls are appropriate

Recommended base:

- Background: dark graphite/near-black material with a subtle depth gradient and optional fine grain; no glaring shader.
- Surface: translucent dark glass with fine border, inner highlight, and restrained blur.
- Text: high-contrast off-white primary, muted cool gray secondary, single restrained accent.
- Radius: soft but not cartoonish; composer and panels should feel native, not capsule-like.
- Iconography: thin-line library-backed icons where possible, with consistent optical weight.

## Layout Architecture

The app opens directly into the assistant shell.

Required regions:

1. Main chat surface: full-screen message stream and conversation state.
2. Collapsible header: thin project/context chrome.
3. Collapsible composer: bottom native message box.
4. Left side tray: conversation/project/source navigation.
5. Artifact renderer layer: adaptive modal/panel above chat.

Desktop:

- Left rail collapsed by default at roughly 56-72px.
- Expanded tray roughly 280-320px.
- Chat stream centered with a comfortable max width, but not boxed like a card.
- Artifact renderer may open as a centered modal or right-side panel depending on artifact type.

Tablet:

- Tray collapsed by default.
- Header and composer remain compact.
- Artifact renderer favors large centered panel or near-full-screen sheet.

Mobile:

- Tray becomes overlay drawer.
- Header compresses aggressively.
- Composer respects keyboard and safe-area bottom.
- Artifact renderer becomes full-screen or near-full-screen sheet.
- Message stream remains the primary viewport tenant.

## Header Plan

The header is not a marketing nav. It is workspace chrome.

Expanded state:

- tray toggle
- project/surface title
- compact source/status indicator
- optional artifact/source quick access
- compact actions menu only if needed

Compressed state:

- reduced height
- title may collapse to short label or icon/title pair
- source/status can become a small dot or short token
- no large copy block

Behavior:

- Header uses `wm-assistant-chrome`.
- Collapse uses transform/opacity/filter through `--wm-motion-*` tokens.
- It must release working viewport space or float over a stable scroll body without blocking content.
- Upward/downward gesture rules should follow `MOBILE_VIEWPORT_CONTRACT.md`.
- Reduced motion uses instant/no-motion fallback.

## Composer Plan

The composer is critical. It must feel like part of the assistant workspace, not a form bolted onto the bottom.

Required structure:

- `form.assistant-composer`
- `.composer-row`
- `textarea[name="question"]`
- internal bottom-right submit control
- safe-area-aware bottom placement

Visual:

- rectangular or softly rounded frosted message box
- no `border-radius: 999px`
- no pill search bar
- low-contrast border and inner highlight
- subtle submit icon/control visible without a heavy pill around it

States:

- resting: compact, quiet, ready
- focused: expands slightly, stronger border/focus ring, keyboard-safe
- typing: bounded auto-grow
- disabled/loading: clear but calm
- collapsed while reading: recedes with `wm-assistant-chrome`, returns on upward gesture or focus

Keyboard:

- Enter submits.
- Shift+Enter inserts newline.
- iOS input font remains 16px or larger.
- Manual user scroll cancels streaming auto-pin.

## Side Tray Plan

The tray should feel useful but restrained.

Desktop:

- collapsed rail by default
- expanded on click/keyboard
- active conversation/source context visible
- thin dividers
- small labels
- frosted background

Tablet:

- collapsed by default
- overlay expansion if viewport becomes tight

Mobile:

- overlay drawer from the same side as the trigger
- icon-only X close
- Escape closes on hardware keyboard
- focus is trapped while open and returns to trigger
- does not smother viewport with dense dashboard controls

Content:

- conversations
- projects
- source packs
- recent artifacts
- settings/source status only if needed

## Message Design Plan

Assistant messages:

- calm text-first layout
- optional subtle frosted panel for source-bound or structured answers
- short paragraphs
- quiet metadata line when source-backed

User messages:

- right-aligned, compact, not oversized
- soft glass or open text with subtle boundary

System/status notes:

- small, low-noise, line-separated
- used for source state, loading, boundary, or handoff status

Fallback/refusal:

- direct and bounded
- no apologetic wall of text
- suggest closest useful route or artifact

Follow-ups:

- chips may be used for short prompt suggestions, but not as the dominant design language.
- If many options exist, use rows, rails, compact lists, or disclosure groups instead of pill wrapping everything.

## Artifact Action Styling

Artifact actions should say, visually: render this view.

Recommended component:

- horizontal glass row or compact card
- small icon
- action title
- metadata line: artifact type, source, status, or freshness
- chevron/open affordance
- loading and unavailable states

Examples:

- Open source map
- Render dashboard
- View SOP
- Show checklist
- Open table
- Inspect receipt

Do not style artifact actions like marketing CTAs. They are app commands.

## Artifact Modal / Panel Plan

Use an adaptive renderer:

- Desktop dashboard/table: right-side panel or large centered modal.
- Desktop document/SOP/checklist: centered reading modal.
- Mobile: full-screen or near-full-screen sheet.
- Source/provenance: readable summary first, raw record collapsed.

Required anatomy:

- title
- type/status metadata
- close button
- optional source note
- scrollable content area
- return-to-chat behavior
- focus management
- Escape close
- reduced-motion fallback

The SV2 focus modal pattern is the closest existing model for full-bleed artifact focus. The WebMNEM source/detail panels are useful references for source/provenance.

## Motion System Plan

All visible motion must use the shared motion layer:

- `motion/motion-tokens.css`
- `motion/view-transition-library.css`
- `motion/shared-element-library.css`
- `--wm-motion-*` duration, easing, slide, and focus tokens

Motion rules:

- header collapse: 160-220ms transform/opacity/filter
- composer focus/expand: 160-220ms transform/border/background
- side tray: 220-320ms transform/opacity/backdrop
- artifact modal: 220-320ms promote/reveal transition
- message appearance: subtle opacity/translate only
- artifact hover/tap: subtle scale or border/background shift
- streaming: readable illusion without yanking scroll

No layout-property animation for scroll chrome. No ad hoc durations. No abrupt show/hide when motion is expected.

## Responsive Behavior

Desktop:

- persistent shell
- restrained rail
- wide readable chat stream
- artifact panel can coexist with chat if space allows

Tablet:

- tray collapses
- artifact panel becomes modal
- composer remains native box

Mobile portrait:

- header and composer are compact and collapsible
- tray is overlay drawer
- artifact is full-screen/near-full-screen
- safe-area top/bottom required
- body locked behind active overlay
- first-open unscrollable state absorbs touch/wheel pressure

Mobile landscape:

- header becomes minimal
- composer height bounded
- artifact sheet prioritizes vertical content

## Accessibility Plan

Required:

- semantic app landmarks
- keyboard navigation
- visible focus states
- Escape closes tray/artifact modal
- aria labels for tray, header, composer, submit, artifact actions
- `role="dialog"` and `aria-modal="true"` for artifact layer
- focus trap in modal/tray
- focus return after close
- reduced-motion support
- color contrast checks for dark and light themes
- screen-reader-safe status messages
- minimum 44px touch targets
- no keyboard traps

## Validation Plan

Future build should add or extend validation for:

- shell initial view exists and is chat-first
- no landing page is required before the assistant shell
- header, tray, message stream, composer, and artifact layer exist
- primary composer uses textarea message-box pattern
- no pill primary composer
- header/composer collapse uses `wm-assistant-chrome`
- motion imports include token, view-transition, and shared-element libraries
- tray opens from the trigger side
- artifact buttons map to registered artifacts
- artifact modal opens/closes and returns focus
- mobile safe-area and viewport ownership pass
- first-open assistant state does not leak body scroll
- reduced-motion path exists
- no console errors in the basic path

Recommended future command:

```bash
node tools/validate-chat-first-ui-system.js --slug <slug>
```

It should supplement, not replace:

```bash
npm run validate:mobile
npm run validate:motion-ux
npm run validate:surface-runtime
npm run validate:code
```

## Design-Quality Acceptance Criteria

- The first viewport is the assistant shell, not a landing page.
- The interface looks intentional without needing images.
- The chat shell feels like the product, not an embedded widget.
- The side tray is useful but restrained.
- The composer feels native to the surface.
- The header collapses or compresses without disrupting context.
- Artifact buttons feel like render actions, not marketing CTAs.
- The artifact modal feels integrated with the chat shell.
- Mobile layout remains first-class.
- Motion feels calm and expensive, not flashy.
- The UI avoids generic chatbot, admin dashboard, and landing page patterns.

## Implementation Phases

1. UI inventory and shell skeleton.
2. Premium visual system and layout tokens.
3. Header, composer, and tray behavior.
4. Message stream and artifact action patterns.
5. Artifact modal renderer.
6. Responsive and accessibility hardening.
7. Validation and receipt generation.

## Risks And Open Questions

- Current surface bundle schema is page-oriented; chat-first shell likely needs a new explicit type.
- Artifact registry shape should be finalized before implementation.
- The first demo should stay narrow enough to prove the system without becoming a full workspace product.
- The UI should be dark-first, but every component needs a clean light fallback.
- Image generation and visual screenshots should happen during the actual build/design pass, not this documentation-only pass, because the work order explicitly excludes screenshots here.

## Recommended Next Build Work Order Outline

Build the first chat-first Surface Assistant Shell prototype using the internal wiki/source-map demo. Use a dark-first premium glass UI, a native rectangular composer, a restrained side tray, and an adaptive artifact renderer. Implement four artifact types in v1: source map, SOP, checklist, and dashboard. Add validation for chat-first shell structure, artifact registry, modal focus return, composer contract, motion-token use, and mobile viewport ownership.

