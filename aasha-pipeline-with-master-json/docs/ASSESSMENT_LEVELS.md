# Assessment Levels — 3-Tier Gamified Assessment Architecture

All assessments are organized into three difficulty levels, each testing a different cognitive tier.

## Level 1: Warm-up (Recall)
- **Question types:** Rapid-fire MCQ, Flashcard battles, Fill-in-the-blanks.
- **Difficulty tier:** Recall, Conceptual Understanding
- **XP per question:** 5 XP

## Level 2: Deep Dive (Application)
- **Question types:** Interactive numeric solvers, Match the column, Drag-and-place.
- **Difficulty tier:** Application, Numerical
- **XP per question:** 10 XP
- **Features:** Step-by-step hint reveals.

## Level 3: Boss Challenge (Critical Thinking)
- **Question types:** Branching scenarios, Multi-concept synthesis, Case study.
- **Difficulty tier:** Critical Thinking
- **XP per question:** 20 XP
- **Features:** No hints, explanatory feedback after answering.

## Mastery Tracking

To provide a cohesive learning experience, the system implements **Mastery Tracking**.
- Each concept mapped by Agent 1 and Agent 2 is tied to a specific mastery node.
- As the user answers questions correctly across the three tiers, they build mastery for that specific concept.
- Mastery is tracked as a percentage. Reaching 100% on a node yields a mastery badge.
- Repeated failures in Level 2 or 3 will dynamically suggest a review of Level 1 material for that concept.

## Offline Queue & Auto-Sync Mechanism

Since the chapters are deployed in low-connectivity environments (offline-first), the assessment data is heavily reliant on a resilient local storage system.

### The Offline Queue
- All progress (XP earned, badges unlocked, answers submitted, mastery changes) is immediately serialized to `localStorage` and placed into an **Offline Queue**.
- The student can complete the entire chapter, earn badges, and close the browser without needing a network connection.

### Auto-Sync Mechanism
- An embedded JavaScript background worker routinely checks for `navigator.onLine`.
- The moment connectivity is restored, the auto-sync mechanism fires off the queued payloads to the centralized backend (if integrated).
- It uses a timestamp-based conflict resolution to merge offline progress with server state.
- After a successful sync, the offline queue is flushed, ensuring no data loss between rural offline usage and eventual network availability.
