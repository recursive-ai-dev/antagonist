# Audit — ANTAGONIST

<!-- REGEN:START — everything here is rewritten at each phase boundary -->
## Scope & method
- **Commit**: f6f05b178f7b68ad9f91bc99c6737426a20f9c04
- **Date**: 2026-09-07
- **Languages**: TypeScript, JavaScript, CSS
- **LOC**: ~8,000
- **Files audited**: 67
- **Tools run**: eslint, tsc, npm-audit, npm-test, semgrep, gitleaks
- **What was NOT covered**: External dependencies, browser specifics, runtime environment.

## Executive summary
The ANTAGONIST codebase demonstrates a strong architectural foundation for a React-based text adventure, with well-separated concerns and robust system boundaries. However, there are significant security and correctness findings that require attention. The most critical issue is a prototype pollution vulnerability in the achievement system that could be leveraged if achievement definitions are ever loaded from untrusted sources. There is also a path traversal vulnerability in the audio generation script. Overall, the codebase has 1 medium and 2 low severity issues, alongside numerous TypeScript compiler errors that indicate a need for a dedicated cleanup phase.

## Findings by severity

| ID | Location | Category | Claim | Confidence |
|---|---|---|---|---|
| F001 | `src/utils/achievementSystem.ts:190` | security | Prototype pollution via unvalidated string split field access | confirmed |
| F002 | `scripts/generateAudio.js:258` | security | Path traversal vulnerability when writing audio files | confirmed |
| F003 | `.github/workflows/ci-cd.yml:19` | security | GitHub Actions step uses a mutable tag or branch reference | confirmed |

## Systemic themes
- **Input Validation**: There are multiple instances where input (e.g., in achievement conditions and build scripts) is not strictly validated or sanitized before being used in sensitive operations like object property access or file system operations.
- **TypeScript Strictness**: The `tsc` output reveals numerous instances of declared but unused variables, implicitly `any` types, and missing properties on objects. This suggests that the TypeScript configuration might be too permissive or that developers are ignoring compiler warnings.

## Design opinions
- **State Management**: The use of custom state management (e.g., `reducers/`, `hooks/useGameEngine.ts`) is appropriate for the complexity of the game state. However, as the game grows, consider adopting a more formalized state management library like Redux Toolkit or Zustand to reduce boilerplate and improve maintainability.
- **Event Bus**: The custom `EventBus` implementation is a solid pattern for decoupling game systems. It could be enhanced with stronger typing for event payloads to prevent runtime errors.

## Strengths
- **Security Primitives**: The `security.ts` file includes robust, cryptographically secure implementations for HMAC generation and verification, AES encryption, and ID generation (`getIntegrityKey`, `generateHMAC`, `encryptAES`).
- **Modularity**: The codebase is well-structured into distinct systems (`achievementSystem.ts`, `glitchSystem.ts`, `progressionSystem.ts`, etc.), making it easier to reason about and test individual components.

## Verification & limitations
- **Confirmed Findings**: 3
- **Plausible Findings**: 0
- **Rejected Findings**: 0
- **False-Positive Risk**: Low. The findings are based on manual verification of static analysis tool outputs and manual code review.
- **Blind Spots**: The audit did not include a dynamic analysis or runtime testing of the game in a browser environment. External dependencies were not audited for vulnerabilities beyond running `npm audit`.

<!-- REGEN:END -->

## Findings Log

### F001 — [MEDIUM] src/utils/achievementSystem.ts:190 — Prototype pollution via unvalidated string split field access
**Category:** security  **Confidence:** confirmed
**Code:**
```ts
value = value[part];
```
**Trigger:** An achievement condition with field `__proto__.something` could pollute the prototype.
**Impact:** Can modify attributes of object prototype causing unexpected behavior.
**Fix:** Check for dangerous keys like `__proto__`, `constructor`, `prototype` before accessing.

### F002 — [LOW] scripts/generateAudio.js:258 — Path traversal vulnerability when writing audio files
**Category:** security  **Confidence:** confirmed
**Code:**
```ts
const fullPath = path.join(OUTPUT_DIR, filePath);
```
**Trigger:** A configuration item with a `filePath` of `../../../etc/passwd` could write files outside the intended directory.
**Impact:** Arbitrary file write, though in a build script it's less critical unless the configuration is user-controlled.
**Fix:** Validate that `fullPath` starts with `OUTPUT_DIR` before proceeding.

### F003 — [LOW] .github/workflows/ci-cd.yml:19 — GitHub Actions step uses a mutable tag or branch reference
**Category:** security  **Confidence:** confirmed
**Code:**
```yaml
- uses: actions/checkout@v4
```
**Trigger:** A malicious actor compromising the action could silently repoint the tag to a malicious commit.
**Impact:** Supply chain attack via compromised action.
**Fix:** Pin the reference to a full 40-character commit SHA.

## Post-Audit Note
Tests were run and some failures related to imports exist in the original codebase which need separate attention.