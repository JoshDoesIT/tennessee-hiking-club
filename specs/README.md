# Specifications

This project is **spec-driven**. Every non-trivial feature starts as a numbered
spec here, _before_ implementation. Each spec maps 1:1 to a GitHub issue and its
acceptance criteria become the tests we write first (TDD).

## Workflow

1. **Write the spec** (`NNNN-short-name.md`) using the template below.
2. **Open a GitHub issue** that links the spec and copies its acceptance criteria
   as a checklist.
3. **Write failing tests** for each acceptance criterion (RED).
4. **Implement** the minimum to make them pass (GREEN); refactor.
5. **Check off** each criterion in the issue with the file/test that satisfies it.
6. **Open a PR** that references the issue (`Closes #N`).

## Template

```md
# NNNN: Title

- **Status:** Draft | Approved | In progress | Shipped
- **Milestone:** Mx
- **Issue:** #N

## Problem

What need does this address? Who is it for?

## User stories

- As a <user>, I want <goal>, so that <benefit>.

## Acceptance criteria

- [ ] Testable, observable statements. Each one gets a test.

## Non-goals

What this explicitly does not cover.

## Technical approach

Key files, data shapes, libraries, and trade-offs.

## Test plan

Unit / component / e2e coverage for the criteria above.
```

## Index

| Spec                                         | Milestone | Title                                  |
| -------------------------------------------- | --------- | -------------------------------------- |
| [0001](./0001-trail-data-model.md)           | M2        | Trail data model & content pipeline    |
| [0002](./0002-interactive-tennessee-map.md)  | M3        | Interactive Tennessee map              |
| [0003](./0003-trail-directory-and-detail.md) | M4        | Trail directory & detail pages         |
| [0004](./0004-merch-store.md)                | M7–M8     | Merch store (Stripe + print-on-demand) |
