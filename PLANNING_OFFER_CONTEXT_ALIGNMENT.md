# Planning Pass: Commercial Offer Context Alignment

## Executive Summary

This planning pass adds the commercial context that must shape the chat-first Surface Assistant shell before implementation.

The product is not a design experiment, a generic chatbot, a RAG wrapper, or a website with an assistant attached. It is a productized service for turning scattered business knowledge into a usable browser-native assistant surface.

Core sentence:

> Your documents are not a system.

Product sentence:

> The assistant is the app.

Offer sentence:

> I turn messy docs, SOPs, FAQs, workflows, and scattered business knowledge into browser-based assistant surfaces people can open, search, ask, and act from.

Proof sentence:

> Ask the surface. Render the view. Close it. Keep working.

Go-to-market sentence:

> On X, proof should come from narrow live artifacts and micro-surfaces, not abstract explanations.

This is a planning artifact only. It does not implement the UI, create a new app, refactor existing assistants, deploy, or change production surfaces.

## Prior Planning Documents Reviewed

This report aligns with and completes the context layer for:

- `PLANNING_CHAT_FIRST_SURFACE_ASSISTANT_SHELL.md`
- `PLANNING_PREMIUM_CHAT_UI_SYSTEM.md`

The first report defines the app model: chat shell first, artifacts second. The second defines the premium UI system: dark-first, glass-native, motion-token driven, and composer-safe. This report defines why that shell exists commercially and what buyer-facing proof it must serve.

## Existing Repo Patterns Inspected

The commercial plan should reuse the repo's proven architecture:

- Surface runtime doctrine: `framework/standards/SURFACE_RUNTIME_V1_STANDARD.md`
- Native composer contract: `framework/standards/ASSISTANT_COMPOSER_CONTRACT.md`
- Mobile viewport ownership: `framework/standards/MOBILE_VIEWPORT_CONTRACT.md`
- Intake pipeline: `framework/standards/SURFACE_INTELLIGENCE_INTAKE_STANDARD.md`
- Dialogue intelligence: `framework/standards/RECURSIVE_DIALOGUE_INTELLIGENCE_STANDARD.md`
- Source/data posture: `framework/standards/SOURCE_MATERIAL_DECISION_STANDARD.md`
- Current surface bundle schema: `framework/standards/surface-bundle.schema.json`
- Generated assistant modal/template: `framework/templates/bounded-static-assistant/public/index.html`
- Generated assistant modal/composer CSS: `framework/templates/bounded-static-assistant/public/styles.css`
- Generated assistant streaming/scroll behavior: `framework/templates/bounded-static-assistant/public/script.js`
- WebMNEM modal ownership and source pattern: `assistants/webmnem-okf-memory-layer/public/script.js`
- SV2 focus mode artifact renderer pattern: `assistants/sv2-biosphere-kids/public/index.html` and `script.js`
- Shared motion layer: `motion/motion-tokens.css`, `motion/view-transition-library.css`, and `motion/shared-element-library.css`
- Validation: `tools/validate-mobile-viewport.js`, `tools/validate-motion-ux-contract.js`, `tools/validate-surface-runtime.js`, and checksum validation
- Capsules: `agent-modes/modes/SURFACE_RUNTIME_V1_MODE.json`, `MOBILE_VIEWPORT_UX_MODE.json`, and `ASSISTANT_COMPOSER_NATIVE_BOX_MODE.json`

## Commercial Offer

The offer is operational clarity from existing material.

The service takes messy business knowledge and turns it into a bounded browser-based assistant surface that people can open, ask, search, and act from.

Input materials can include:

- outdated SOPs
- PDFs
- FAQs
- spreadsheets
- process docs
- onboarding checklists
- Google Drive folders
- Notion sprawl
- Slack-thread answers
- email-chain knowledge
- pricing sheets
- client instructions
- internal manuals
- source maps
- receipts and validation notes

Output:

- a premium chat-first assistant shell
- approved/precompiled answer routes
- source status and limitations
- artifact buttons
- rendered dashboards, checklists, SOP views, source maps, FAQ rooms, or document surfaces
- validation and receipt trail

## Target Buyer Profile

Primary buyer:

- founder-operators
- agency owners
- consultants
- fractional COOs
- operations consultants
- small teams
- internal departments
- professional offices
- B2B service providers
- managers responsible for onboarding or repeated explanations

Shared buyer condition:

They are responsible for explaining the same things repeatedly and the current documentation system is not doing the job.

Signals to look for:

- repeated staff questions
- client confusion
- onboarding chaos
- outdated SOPs
- messy spreadsheets
- scattered internal docs
- owners acting as the human search engine
- "final_v7_REAL_FINAL.pdf" knowledge sprawl
- Slack answers that never become operating material
- Notion or Drive folders that technically contain answers but do not guide action

This is not primarily an education product, developer tool, AI-builder product, or generic knowledge-base product. The pain is horizontal business knowledge usability.

## Buyer Pain Summary

Buyer language to preserve:

- Your documents are not a system.
- The answer existing somewhere is not the same as the answer being usable.
- If your team keeps asking the same questions, your docs are not doing their job.
- A folder is not a knowledge system.
- A PDF is not an operating surface.
- Your business should not depend on one person remembering where everything is.
- Describe the mess. I’ll tell you if it can become a surface.

The buyer is not primarily looking for a lecture about architecture. They want to see whether their pile of material can become something usable.

## What The Product Is

The product is a chat-first browser surface that answers from approved/precompiled source material and renders the right view when needed.

It is:

- a bounded assistant surface
- a source-aware operating interface
- a proof artifact
- a docs-to-surface transformation
- a static-runtime browser product
- a reusable micro-surface factory

Runtime framing:

- AI-built upstream.
- Static-runtime downstream.
- No live model call required for bounded runtime answers.
- Answers come from approved/precompiled source material.
- Artifact rendering happens from prebuilt/static registered views.
- Unknown questions route to bounded fallback behavior.

Do not say "no AI" without context. Do not claim "cannot hallucinate" as an absolute. Better framing:

- no live-model hallucination path at normal runtime
- source quality, source freshness, and missing material remain source-map and validation issues

## What The Product Is Not

The product is not:

- AI magic
- a generic chatbot
- a RAG app
- a website
- a dashboard portal
- an automation agency offer
- a developer tool first
- a chatbot widget on a landing page
- a dashboard with a chat bubble
- an unrestricted live AI support agent

The product should not force buyers to understand how every line of HTML, CSS, JavaScript, routes, fixtures, capsules, or checksums work before they understand the value.

## X-Only Campaign Context

The go-to-market motion is X-first.

The X campaign should be pain-first and proof-heavy. It should train the market around the recognition that documents are not systems.

Post themes:

- repeated questions
- stale SOPs
- spreadsheet chaos
- messy folders
- Notion sprawl
- Google Drive archaeology
- owner bottlenecks
- onboarding confusion
- clients asking the same thing
- staff not knowing which process is current

Do not make abstract infographics the main proof asset. The stronger proof is a narrow live artifact or micro-surface that shows one transformation.

## Proof-Artifact Strategy

Recommended proof mode:

Micro artifact drops.

Examples:

- spreadsheet -> assistant-rendered dashboard
- FAQ -> bounded answer assistant
- SOP -> checklist/SOP renderer
- pricing sheet -> client explainer assistant
- onboarding doc -> new-hire assistant
- policy PDF -> source-bound Q&A interface
- messy folder -> clean assistant shell with artifact buttons

Each proof artifact should be narrow enough to understand in seconds:

1. show the mess
2. show the assistant
3. ask one useful question
4. render one useful view
5. show source/boundary posture

The shell must therefore be easy to clone, retheme, and repurpose:

- one source pack
- one assistant route pack
- one artifact registry
- one or more rendered views
- one deployable static artifact
- one receipt/validation trail

## Why Chat-First Matters Commercially

Chat-first matters because the buyer's pain is not "I need another webpage." The pain is "people cannot get the answer or action from the material we already have."

The assistant shell demonstrates the value immediately:

- ask the question
- get the bounded answer
- render the view
- keep working

That makes the artifact itself the sales argument. The buyer should infer technical competence from the working surface, not from a long explanation of the stack.

## Buyer Perception And UI Implications

The UI should make the buyer think:

> I can see how my mess becomes this.

Implications:

- The first visible state should invite asking, not scrolling.
- The empty state should describe the kind of mess the shell can clarify.
- Source/status indicators should be visible but calm.
- Artifact actions should feel like "show me the thing," not like marketing CTAs.
- The header should be compact workspace chrome, not brand-heavy navigation.
- The side tray should use business context language: source packs, views, current process, checklist, dashboard, FAQ room.
- The composer placeholder should use approved-material language, not generic AI language.
- Fallback should explain missing source material and suggest what needs to be supplied.
- Receipt/proof language should be available for trust, not forced into the first interaction.

## Recommended First Commercial Demo Scenario

Default first demo:

Messy operations knowledge surface.

Input materials:

- one messy spreadsheet-style dataset
- one outdated SOP
- one FAQ
- one onboarding checklist
- one source-status map

Assistant can answer:

- Where is the current process?
- Which source is active?
- What does a new hire need to do first?
- Show me the dashboard.
- Show me the checklist.
- Show me the source map.
- What questions are out of scope?

Artifacts to render:

- dashboard view
- SOP/checklist view
- source map view
- FAQ/answer-room view

Why this wins:

- It is horizontal and recognizable.
- It avoids regulated-domain friction.
- It shows multiple artifact types.
- It makes the value obvious without selling "AI."
- It maps directly to X proof posts.
- It can be cloned into narrower micro demos.

## UI Content Implications

Header:

- Use compact project/source context.
- Avoid marketing nav.
- Example: `Ops Surface` / `Approved source pack`.

Composer placeholder:

- "Ask from approved material."
- "Ask about the current process."
- "Ask what this source pack can answer."

Side tray labels:

- Source pack
- Dashboard
- Current SOP
- Onboarding checklist
- FAQ room
- Source map
- Receipts

Artifact button language:

- Show dashboard
- Open checklist
- View source map
- Show current SOP
- Open FAQ room
- Render view
- Back to assistant

Fallback language:

- "I do not have enough approved source material to answer that yet."
- "This answer is bounded to the approved source pack."
- "That would need a source file, owner note, or policy document before the surface should answer it."

Trust language:

- "Approved material"
- "Source pack"
- "Current source"
- "Source status"
- "Bounded answer"
- "Validation receipt"
- "Static runtime"

Avoid:

- Ask AI anything
- Chat with your docs
- AI magic
- Autonomous agent
- RAG-powered
- Upload everything
- Hallucination-proof
- Bot

## Project Structure Implications

The future build should include:

- surface intake artifacts
- source manifest
- artifact registry
- answer pack
- route fixtures
- dialogue fixtures
- source fixtures
- artifact render fixtures
- validation receipt
- checksum

Recommended future directories:

```text
assistants/<slug>/
  assistant-spec.json
  answer-pack.json
  source-manifest.json
  artifact-registry.json
  research/
  fixtures/
  public/
```

The artifact registry should become a first-class runtime object rather than scattered modal markup.

## Validation Implications

Future validation should prove:

- assistant shell is the first viewport
- artifact registry exists
- artifact actions resolve to registered artifacts
- missing artifacts fail gracefully
- source-backed answers cite source posture
- authored assumptions are labeled
- fallback does not imply hidden knowledge
- composer follows native box contract
- motion uses shared token layer
- mobile modal/tray/artifact layers own the viewport
- receipts exist for proof demos
- public copy avoids internal architecture unless asked

Recommended future command:

```bash
node tools/validate-chat-first-commercial-demo.js --slug <slug>
```

This should complement:

```bash
npm run validate:intake
npm run validate:mobile
npm run validate:motion-ux
npm run validate:surface-runtime
npm run validate:checksum
```

## Receipt Implications

Receipts should be buyer-proof as well as engineering proof.

Each micro demo receipt should include:

- source materials used
- source materials excluded
- authored vs source-backed claims
- artifacts registered
- questions tested
- fallback/boundary tests
- mobile/motion checks
- known limitations
- deploy URL
- checksum

The receipt should not be the public sales pitch, but it should exist for inspection when a skeptical buyer asks, "What is this actually answering from?"

## Open Questions Before Implementation

- Should the first demo be branded as a generic operations surface or as a named "Messy Ops Surface" proof artifact?
- Should the first source pack be synthetic demo material or derived from a real anonymized operations doc set?
- Should the artifact registry be added to the formal surface bundle schema in the first implementation pass?
- Should the first build add `chat_first_surface_shell` as a new surface type, or use `reference_product_surface` with a semantic subtype for one pass?
- Should X proof posts link directly to live micro-surfaces or to a hub listing multiple micro artifacts?

## Do Not Do Yet

- Do not implement the UI.
- Do not create the new app.
- Do not refactor the existing assistant.
- Do not deploy.
- Do not overwrite existing canonical artifacts.
- Do not create generic chatbot styling.
- Do not invent a new architecture before inspecting existing patterns.
- Do not turn this into a landing page.

## Completion Standard

This planning pass is complete when the commercial offer context is explicit enough that a future implementation cannot accidentally build a pretty chat shell with no buyer thesis.

The next build should produce a shell that proves this commercial idea in one sentence:

> Ask the surface. Render the view. Close it. Keep working.

