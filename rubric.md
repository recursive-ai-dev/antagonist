# Auditor rubric

Read this before every audit. Severity is not a feeling — it is a function of
*outcome* and *likelihood*. If you cannot state the concrete bad outcome and the
input or condition that triggers it, you do not yet know the severity; downgrade
until you can, or drop the finding.

## Severity

| Level | Definition | Test to apply |
|---|---|---|
| **critical** | Exploitable security hole, data loss/corruption, or a guaranteed crash on a normal, expected code path. Ship-blocker. | "A routine use of this feature, by a normal user or a plausible attacker, causes irreversible harm right now." |
| **high** | A bug that produces wrong behaviour for realistic inputs or users; a security weakness that needs specific but attainable conditions; a dangerous operation with no safety check. Fix before the next release. | "This will bite a real user or a determined attacker, and the trigger is not exotic." |
| **medium** | Correctness or robustness failure on an edge path; a design flaw that will reliably generate future bugs or make a class of bugs hard to prevent. Schedule it. | "This is wrong or fragile, but the trigger is uncommon, or the damage is contained/recoverable." |
| **low** | Minor robustness gap, unclear or unenforced contract, missing test for a real (not theoretical) risk, small resource inefficiency with real cost. Fix when next in the area. | "Worth fixing, but nothing breaks today and no user notices." |
| **note** | Factual observation with no action implied: a strength, a piece of context, a deliberate trade-off worth recording, or an "additional minor issues here" marker. | "The reader benefits from knowing this; there is nothing to do." |

Rules:

- **No inflation.** "Could theoretically" and "in principle" are medium at most, and
  usually low. Reserve critical/high for things you can walk someone through causing.
- **No deflation of the real ones.** A `==` token comparison, an unauthenticated
  mutation route, a SQL string built by concatenation — these are high or critical even
  if "probably no one would". The trigger is attainable.
- A finding that depends on unseen runtime context (a value you cannot trace to its
  source, a deployment assumption) is capped at **medium** and marked
  `confidence: plausible`.
- Duplicate instances of the same root cause: one finding per instance in Phase 1
  (they have different locations), then one systemic theme tying them together. Do not
  merge them into a single vague finding.

## Confidence

| Value | Meaning |
|---|---|
| **confirmed** | You opened the code, the mechanism is fully visible in what you read, and the trigger→impact chain needs no assumption about unseen code or runtime. |
| **plausible** | The reasoning is sound but one link depends on context you could not fully trace (an external caller, a config value, a library's undocumented behaviour). |

Anything below `plausible` — you are guessing — is not a finding.

## Categories

Use exactly one primary category per finding (add others in the claim text if needed):

- `security` — auth, authz, injection, secrets, crypto misuse, SSRF, path traversal, deserialization, unsafe defaults
- `correctness` — the code computes or returns the wrong thing
- `concurrency` — races, deadlocks, lock-ordering, unsynchronized shared state
- `error-handling` — swallowed / mistyped / misrouted errors, wrong success on failure
- `resource-leak` — unreleased handles, memory, connections, subscriptions, timers
- `data-integrity` — partial writes, missing atomicity/rollback, cache/source divergence
- `api-contract` — caller/callee expectations mismatched or unenforced; breaking change risk
- `input-validation` — missing/insufficient checks on external input
- `performance` — algorithmic blow-ups, N+1, needless work on hot paths, with real cost
- `testing` — critical path with no meaningful test; tautological or misleading tests
- `architecture` — module boundaries, coupling, layering, duplication of mechanism
- `dependency` — vulnerable / unmaintained / oversized / redundant third-party code
- `config` — configuration and environment handling, reproducibility of builds/releases
- `maintainability` — genuine comprehension hazards that will cause bugs (not style)

## What is NOT a finding

- Formatting, naming, import order, line length, and other linter/formatter territory —
  unless the specific instance causes an actual bug (e.g. a name collision that shadows).
- "I would have structured this differently" with no concrete downside — that goes in
  **Design opinions**, labelled as opinion, never in the severity tables.
- TODOs and comments about known gaps — record the underlying gap if it is real, not the
  comment.
- Hypotheticals with no attainable trigger.

## Strengths (record these too)

Same evidence discipline: `file:line` + verbatim quote + one sentence on why it is
good. Examples worth calling out: consistent and enforced input boundaries, real test
coverage on the risky paths, clean error propagation, tight module boundaries, careful
handling of a genuinely hard problem (concurrency, precision, migrations). An audit that
finds only faults is not neutral — it is incomplete.
