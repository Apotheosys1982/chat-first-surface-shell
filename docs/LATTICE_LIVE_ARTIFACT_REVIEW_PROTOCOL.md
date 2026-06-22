# Lattice Live Artifact Review Protocol

Interactive artifacts cannot be judged by static screenshots alone. The lattice review protocol has three review modes:

1. Static Review Mode: read the page, text, screenshots, source map, and visible claims.
2. Behavior Review Mode: produce a concrete live interaction checklist for Codex to execute in the browser.
3. Evidence Review Mode: review Codex's evidence package and decide whether the live behavior matches the product claim.

The council or external reviewer is the interpretation layer. Codex is the execution layer. Reviewers must not claim live behavior is working unless Codex has run the behavior checklist and returned evidence.

## Reviewer Prompt Block

Use this block when asking MiniMax, Gemini, DeepSeek, or another reviewer to evaluate an interactive artifact:

```text
If the artifact is interactive, do not stop at static review.

First, summarize what the static surface claims.
Second, produce a Live Artifact Evaluation Checklist for Codex.
The checklist must include exact URLs, viewport sizes, clicks, typed commands, expected outcomes, console checks, screenshot requirements, and pass/fail criteria.
Third, state what evidence Codex must return before you can judge the behavior.
Do not invent results. Do not say a live behavior passed until Codex returns the evidence package.
```

## Required Review Flow

1. Static surface read
   - Identify what the artifact claims to do.
   - Identify visible risks, unclear claims, and unsupported claims.

2. Behavior test plan
   - Convert product claims into executable commands.
   - Define the exact expected result for each command.
   - Include negative paths, unsupported paths, mobile viewport checks, and console status.

3. Codex execution
   - Open the local or deployed app.
   - Run the checklist through browser automation.
   - Capture evidence instead of relying on memory.

4. Evidence package
   - URL, commit, deploy ID, viewport, browser surface, command list, pass/fail table, console status, screenshots when required, and saved receipt path.

5. Council interpretation
   - Review only the returned evidence.
   - Decide whether the product behavior matches the stated claim.
   - Separate product-quality interpretation from execution facts.

## Evidence Package Minimum

Every live artifact evaluation must return:

- `url`
- `commit`
- `deployId` when deployed
- `viewport`
- `browserSurface`
- `commandsTested`
- `expectedOutcomes`
- `actualOutcomes`
- `passFail`
- `consoleStatus`
- `horizontalOverflowStatus` for mobile surfaces
- `screenshots` when visual framing or overlap matters
- `receiptPath`
- `checksumPath` when the result is committed

## Pass Criteria

A live artifact review passes only when:

- The executable checklist covers every major product claim under review.
- Codex ran the checklist against the intended URL and commit/deploy.
- Console errors and warnings are reported.
- Mobile viewport metrics are reported for mobile-sensitive surfaces.
- Evidence is saved as a repo artifact or receipt.
- The council's interpretation is based on evidence, not static impressions.

## Failure Conditions

A review is incomplete if:

- The reviewer only reads screenshots for an interactive app.
- The reviewer says behavior passed without Codex execution evidence.
- The checklist omits negative or unsupported routes.
- The evidence package lacks URL, viewport, console status, or command outcomes.
- A receipt is missing for a committed behavior pass.
