# Architecture Documentation Checklist

Use this as a coverage checklist, not a file-by-file inventory. Tick an item only
when the deliverable you are working on explains it with evidence from this
repository or a running instance: the onboarding guide, the architecture diagram,
the component inventory, or the completed README. If an item does not apply,
record why.

## 1. System shape

- [ ] The actual startup topology is described: how many runnable processes are
      started by the documented commands and what each one serves.
- [ ] The actual local URLs and ports are verified at runtime, not taken from the
      README or from the starter templates.
- [ ] The major workspace packages/apps are named, and the purpose of each is
      explained in product or technical terms.
- [ ] The dependency direction between modules is documented, including any
      boundaries that are only conventions rather than enforced constraints.
- [ ] The frontend-to-API communication path is explained, including the role of
      the development proxy and any environment-driven configuration.
- [ ] The API composition root is identified: where repositories, domain
      services, clocks, and ID generation are assembled.
- [ ] The boundary between transport objects, domain objects, and UI objects is
      clear. The guide notes where mapping or duplication occurs.

## 2. Identity and authorization

- [ ] The acting-user mechanism is traced from the browser selection through the
      HTTP request to server-side resolution.
- [ ] The precise transport metadata used to identify the actor and the behavior
      for missing or unknown identities are documented.
- [ ] The distinction between a demo identity and real authentication is explicit.
- [ ] Every authorization rule is located and named: read access, project
      management, task contribution, archive, and restore.
- [ ] The guide states where authorization is enforced and whether a caller
      can bypass UI restrictions.
- [ ] Server-provided capabilities/allowed actions are explained, including how
      and when they are recomputed.
- [ ] Role changes or state changes that affect capabilities are traced through
      the next request.

## 3. Domain model and behavior

- [ ] Project fields, task fields, user fields, and activity fields are described
      with relationships and cardinality.
- [ ] Project lifecycle states and the allowed transitions are documented,
      including guards that depend on task state.
- [ ] Archive state is distinguished from lifecycle status, including how it is
      represented and how it affects list visibility and read-only behavior.
- [ ] Restore behavior is described, including the resulting lifecycle status.
- [ ] Task statuses and allowed transitions are documented, including reopening
      and cancellation behavior.
- [ ] Rules for task creation, assignment, estimates, and project membership are
      documented.
- [ ] The progress calculation is explained precisely: weighting, cancellation,
      rounding, empty states, and which values are derived.
- [ ] Activity event kinds, payloads, actor attribution, ordering, and rendering
      context are documented.
- [ ] The order and precedence of validation and policy checks are described
      where they affect the error a caller receives.
- [ ] Domain timestamps/IDs are explained, including whether they are injectable
      and where non-determinism enters tests or runtime.

## 4. Persistence and data integrity

- [ ] The repository interfaces (ports) and adapters are identified, with the
      direction of dependency.
- [ ] The actual storage mechanism and its lifetime are documented.
- [ ] Seed data, seed timing, and reset behavior are explained.
- [ ] The guide states whether repository reads return shared references,
      live objects, or copies, and why that matters for callers.
- [ ] Mutation and persistence behavior is traced for at least one project and
      one task change.
- [ ] Ordering guarantees for lists, tasks, and activity are stated precisely.
- [ ] Data-integrity assumptions in the seed/sample data are listed.
- [ ] Durability, concurrency, transactions, and multi-process behavior are
      explicitly identified as supported or unsupported.
- [ ] Any IDs or timestamps generated at runtime are described.

## 5. HTTP contract and error behavior

- [ ] Every route the frontend uses is listed with method, path, purpose, and
      actor requirement.
- [ ] Query parameters and request bodies are documented with required/optional
      fields and validation limits.
- [ ] Success response envelopes and key fields are documented.
- [ ] Error response envelopes are documented.
- [ ] The translation from domain failure to HTTP status/code is described,
      including the fallback for unexpected errors.
- [ ] Missing actor, invalid body, invalid transition, forbidden action, missing
      resource, and archived/completed conflicts are distinguished.
- [ ] The guide notes where client code parses errors and how the UI presents
      them.
- [ ] Any routes that exist in code but are missing or misdescribed in the
      README are recorded in the drift log.
- [ ] Shared contract types and their consumers are identified, including any
      risk of contract drift.

## 6. Frontend behavior

- [ ] Routes and page responsibilities are documented.
- [ ] Session/identity state ownership is explained, including persistence across
      reloads and the fallback when a stored identity is invalid.
- [ ] Initial loading, error, empty, and not-found states are covered.
- [ ] Data-fetch timing is documented: mount, identity change, filter changes,
      retries, and any abort behavior.
- [ ] Mutation behavior is traced: request, response handling, local state
      replacement, and an explanation of why derived UI updates without reload.
- [ ] The use of server-provided capabilities to hide or expose controls is
      documented, including what happens when a control is absent.
- [ ] Archived and read-only presentations are described.
- [ ] The archive filter's default behavior and effect on the visible set are
      described.
- [ ] The form's client-side validation and its relationship to server validation
      are covered.
- [ ] Any optimistic-update behavior, or lack of it, is stated.
- [ ] Accessibility and responsive behavior worth preserving are noted.

## 7. Cross-layer flows

- [ ] At least one read flow is traced from route to rendered field.
- [ ] At least one write flow is traced from UI interaction to persisted
      mutation, activity entry, derived values, and refreshed UI.
- [ ] At least one rejected flow is traced end to end, including the message the
      user sees.
- [ ] The flows identify every transformation between HTTP DTOs, domain entities,
      and view models.
- [ ] The flows include actual request/response evidence from a running instance.
- [ ] The guide explains which layer is authoritative for permissions,
      transitions, and calculated fields.

## 8. Configuration, tests, and operations

- [ ] Environment variables, defaults, and which process consumes each one are
      documented.
- [ ] The development proxy, production build, and any asset/type configuration
      are explained at the level a new maintainer needs.
- [ ] Package scripts and their actual effects are verified.
- [ ] The test strategy is mapped: unit, persistence, API, and frontend coverage.
- [ ] Important untested behavior is identified.
- [ ] The guide records how to reproduce a failure or verify a behavior
      manually.
- [ ] Runtime logging, observability, health reporting, and shutdown behavior are
      noted where present.
- [ ] Dependency/runtime constraints and known operational limitations are
      recorded.

## 9. Drift, decisions, and follow-up

- [ ] The discrepancy log compares README/API claims and product-brief intent
      against observed behavior, with evidence.
- [ ] Each discrepancy is classified rather than automatically called a bug.
- [ ] At least four non-obvious decisions include context, alternatives,
      trade-offs, and change guidance.
- [ ] Open questions have an owner or a proposed next step.
- [ ] Risks are prioritized by impact and likelihood for a new maintainer.
- [ ] A first-week reading order is justified by the architecture diagram and
      flows, not just by directory order.
- [ ] No deliverable claims behavior that was not verified or marked as
      unverified.
