# Planning Pass: Chat-First Surface Assistant Shell

## Executive Summary

This planning pass defines the next Surface Runtime direction: the assistant is the app.

The user does not land on a marketing page with a chat widget attached. The user lands inside a browser-native assistant shell. The assistant explains, routes, searches, qualifies, and renders artifacts on demand. Dashboards, SOPs, tables, checklists, source maps, receipts, documents, and workflow panels appear only when the conversation calls for them.

This is a planning artifact only. It does not implement a runtime shell, alter current public surfaces, deploy, or create screenshots.

## Existing Architecture Inspected

The repo already has the pieces needed for this shell. The next build should promote and recombine them, not invent a new UI model.

- `framework/standards/SURFACE_RUNTIME_V1_STANDARD.md`: defines the browser as runtime, the assistant as one component, the surface as product, and requires shared motion, viewport-owned modals, source/provenance, small-print footer, liquid-glass controls, and native message-box composer behavior.
- `framework/standards/ASSISTANT_COMPOSER_CONTRACT.md`: forbids pill-style ask submission shells for primary assistant composers and requires a rectangular or softly rounded glass `textarea` message box with an internal submit control.
- `framework/standards/MOBILE_VIEWPORT_CONTRACT.md`: defines modal viewport ownership, safe-area handling, dynamic viewport height, scroll containment, chrome recede/return, and first-open touch absorption.
- `framework/standards/SURFACE_INTELLIGENCE_INTAKE_STANDARD.md`: requires research, source discovery, question mapping, synthesized spec, and readiness before build.
- `framework/standards/RECURSIVE_DIALOGUE_INTELLIGENCE_STANDARD.md`: defines Layer -1 source, Layer 0 foundation, Layer 1 offer/workflow, Layer 2 boundary, and Layer 3 dialogue state.
- `framework/standards/SOURCE_MATERIAL_DECISION_STANDARD.md`: defines source manifests, source posture, attribution, freshness, and source-backed route expectations.
- `framework/standards/surface-bundle.schema.json`: currently supports `reference_product_surface`, `bounded_search_surface`, `high_context_offer_surface`, `smb_customer_guidance_surface`, and `dataset_guidance_surface`; it does not yet include an explicit chat-first shell type.
- `framework/templates/bounded-static-assistant/public/index.html`: contains the current generated surface shell and a canonical assistant modal with `data-assistant-modal`, `.assistant-panel`, `.assistant-body`, `.assistant-composer`, `.composer-row`, `textarea[name="question"]`, and source panel.
- `framework/templates/bounded-static-assistant/public/styles.css`: defines the viewport-owned assistant modal, `wm-assistant-chrome`, composer glass row, hidden chrome transform behavior, and safe-area-aware modal layout.
- `framework/templates/bounded-static-assistant/public/script.js`: defines streaming illusion, assistant body scroll handling, header/composer gesture collapse, textarea submit behavior, and body locking.
- `assistants/webmnem-okf-memory-layer/public/script.js`: contains a stronger modal ownership pattern with `visualViewport` handling, modal locks, boundary-aware scroll detection, direct gesture chrome state, and source-aware assistant behavior.
- `assistants/sv2-biosphere-kids/public/index.html` and `script.js`: contain a working full-bleed focus modal pattern for rendered lesson artifacts and an assistant modal using shared `wm-assistant-chrome`.
- `motion/motion-tokens.css`, `motion/view-transition-library.css`, and `motion/shared-element-library.css`: provide the required motion token layer, view-transition base, and shared-element patterns.
- `tools/validate-mobile-viewport.js`, `tools/validate-motion-ux-contract.js`, and `tools/validate-surface-runtime.js`: already enforce much of the mobile, motion, composer, surface runtime, footer, and glass-control contract.
- `agent-modes/modes/SURFACE_RUNTIME_V1_MODE.json`, `MOBILE_VIEWPORT_UX_MODE.json`, and `ASSISTANT_COMPOSER_NATIVE_BOX_MODE.json`: define capsule-level rules for avoiding one-off UI, pill composers, broken mobile chrome, and non-tokenized motion.

## Product Model

The chat-first shell is a browser-native operating surface.

The user enters through the assistant and stays in the assistant unless a rendered artifact is needed. The assistant controls context, source boundaries, routing, and next action. The artifact layer is subordinate to the conversation and returns the user to the exact same chat state after close.

Core flow:

1. User lands in the assistant shell.
2. Assistant presents a focused starting state, available source/context posture, and suggested paths.
3. User asks a question or selects a prompt.
4. Assistant answers from a bounded answer/source pack.
5. If an artifact is useful, assistant shows an inline render action.
6. User opens the artifact in a premium modal/panel.
7. User closes the artifact and returns to the same chat.
8. Conversation state preserves prior intent, source context, unresolved slots, and suggested next routes.

## Artifact Categories

The shell should support a registry of renderable artifacts. The first implementation does not need every type, but the architecture should assume these categories:

- Dashboard: metrics, operating status, project summary, or intake overview.
- SOP: process document, step-by-step workflow, operating manual, or training sequence.
- Checklist: tasks, readiness criteria, inspection steps, or implementation gates.
- Table: structured source records, comparison rows, inventory, FAQ matrix, or validation status.
- Document: memo, policy, receipt, report, spec, or source note.
- Source map: source manifest, provenance view, OKF-style file index, or dataset snapshot.
- Receipt: validation receipt, deploy note, checksum summary, or audit artifact.
- Workflow panel: guided flow, intake branch, decision tree, calculator, or action handoff preview.

Each artifact record should include:

- artifact id
- title
- type
- status
- source dependency
- route family or answer id that can invoke it
- visible summary
- render component
- unavailable/missing state
- source/provenance note

## Chat-To-Artifact Flow

Artifact rendering should never feel like a marketing CTA. It should feel like the assistant is rendering a useful view.

Required behavior:

- Assistant answers first when a short explanation is needed.
- Inline artifact action appears directly under the relevant answer.
- Artifact button uses a structured render-action row: icon, title, type/status metadata, and subtle affordance.
- Artifact opens above the chat through a viewport-owned modal or panel.
- Artifact layer has a compact header, close control, optional source note, and internal scroll.
- Closing returns focus to the invoking action or composer.
- Escape closes the artifact on desktop.
- Mobile artifacts become full-screen or near-full-screen sheets.
- Artifact load failure returns a bounded assistant explanation, not a dead button.

## Source And Data Posture

The chat-first shell still follows Layer -1 source rules. Every generated shell must document what powers the assistant and what powers each artifact.

Default source policy:

- Prefer build-time snapshots for static public surfaces.
- Do not place client-side API keys in the browser.
- Separate source-backed data from authored strategy/copy.
- Document source freshness and limitations.
- Show readable provenance before raw records.
- Route source/freshness/limitation questions ahead of fallback.

The artifact registry should distinguish:

- source-backed artifact
- authored artifact
- generated-from-source artifact
- demo/synthetic artifact
- client-provided artifact
- unavailable artifact

## Bounded Assistant Behavior

The assistant remains bounded even though it is the primary app surface.

Required capabilities:

- answer orientation questions about the surface
- answer source/provenance questions
- route to artifacts when useful
- detect vague follow-ups
- preserve conversation state
- handle user corrections
- ask short clarifying questions
- refuse unsupported or unsafe requests
- explain limitations without prototype language
- route action-ready users to configured next steps

Required non-capabilities:

- no unrestricted live AI claim
- no pretending to know private/account-specific data
- no unsupported legal, medical, financial, school-policy, or guarantee claims
- no hidden pricing/scope/timeline promises
- no artifact rendering if the artifact is not registered or source-backed

## Dialogue And Route Layers

The chat-first shell should inherit the existing layered model:

- Layer -1: source/data substrate and artifact registry.
- Layer 0: foundational vocabulary and domain orientation.
- Layer 1: workflow, use case, offer, product, or task intelligence.
- Layer 2: boundary, fallback, hostile input, and unsupported request handling.
- Layer 3: recursive dialogue state, unresolved slots, prior answer memory, and next-best route suggestions.

In a chat-first shell, Layer 3 matters more because there is no landing page doing orientation before the assistant. The assistant must infer whether the user wants explanation, source, artifact, next step, or clarification.

## Surface Bundle Implications

The current `surface-bundle.schema.json` has no explicit `chat_first_surface_shell` type. The first build can use `reference_product_surface` with a documented semantic subtype, but the factory should eventually add a real chat-first type.

Recommended future schema additions:

- `surface_type`: add `chat_first_surface_shell`
- `shell`: header, tray, composer, message stream, artifact layer settings
- `artifact_registry`: list of renderable artifacts
- `conversation_contexts`: starting contexts, project/source packs, and assistant roles
- `chat_first_entry`: boolean asserting no landing page is required
- `artifact_routes`: route-to-artifact mappings
- `artifact_validation_fixtures`: open/close/source/missing-state checks

Until the schema is extended, the synthesized surface spec should document any intentionally empty `hero`, `cards`, or `detail_modals` fields as compatibility shims, not as product UI requirements.

## Candidate First Demo

The recommended first demo remains an internal knowledge/wiki surface because it naturally uses artifacts:

- dashboard: knowledge base overview
- SOP: process page
- checklist: readiness or onboarding checklist
- table: source inventory
- source map: OKF/source index
- receipt: validation or deployment receipt
- workflow panel: intake or action handoff

This demo can prove the architecture without needing a regulated, credential-heavy, or customer-service-specific niche first.

## Validation Requirements

Future validation should check:

- assistant shell is the initial view
- no generic landing-page route is required before the assistant shell
- source manifest exists
- artifact registry exists
- every artifact action maps to a real artifact id
- missing artifact state is handled
- artifact modal opens and closes
- focus returns after artifact close
- assistant route fixtures cover artifact invocation
- source-backed claims reference source posture
- composer follows the native message-box contract
- motion uses shared `motion/` assets and `--wm-motion-*` tokens
- mobile viewport ownership works with tray, artifact modal, and composer
- no public copy exposes factory/capsule/route mechanics unless directly asked

Recommended future validator:

```bash
node tools/validate-chat-first-shell.js --slug <slug>
```

It should run alongside:

```bash
npm run validate:mobile
npm run validate:motion-ux
npm run validate:surface-runtime
npm run validate:intake
```

## Implementation Phases

1. Intake: research, source decision, question map, synthesized spec, readiness.
2. Shell scaffold: chat-first app root, tray, header, message stream, composer.
3. Artifact registry: data model, sample artifacts, render action mapping.
4. Assistant behavior: answer pack, route families, dialogue fixtures, artifact invocation.
5. Artifact renderer: adaptive modal/panel with focus return and source notes.
6. Mobile and motion hardening: viewport ownership, chrome collapse, keyboard handling.
7. Validation: shell validator, artifact validator, mobile/motion/runtime checks.
8. Receipt and deploy gate.

## Risks And Guardrails

- Risk: shell becomes a generic chatbot. Guardrail: artifact rendering and source posture must be first-class.
- Risk: shell becomes a dashboard. Guardrail: chat remains the primary app surface and artifacts appear on demand.
- Risk: artifacts become disconnected pages. Guardrail: every artifact opens from a routed assistant action and returns to chat state.
- Risk: weak source material makes answers feel invented. Guardrail: source decision and authored/source-backed labels are mandatory.
- Risk: mobile chrome fights the scroll. Guardrail: reuse WebMNEM/SV2 modal ownership and current motion validation.
- Risk: composer regresses into a pill. Guardrail: enforce `ASSISTANT_COMPOSER_CONTRACT.md`.

## Recommended Next Build Work Order Outline

Build a new `chat-first-surface-shell` prototype from the existing Surface Runtime architecture. Use an internal wiki/source-map demo. Start with intake artifacts, then implement a dark-first assistant shell with one source map artifact, one SOP artifact, one checklist artifact, and one dashboard artifact. Validate with mobile, motion, composer, surface runtime, and new artifact-shell checks before deploy.

