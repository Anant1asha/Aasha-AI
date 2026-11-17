# Assessment Levels — 3-Tier Gamified Assessment Architecture

Based on the `paste-1.md` spec, all assessments are organized into three
difficulty levels, each testing a different cognitive tier.

## Level 1: Warm-up (Recall)

**Purpose:** Rapid activation of prior knowledge before deep learning.

**Question types:**
- Rapid-fire MCQ (3-4 options, quick tap)
- Flashcard battles (flip to reveal, mark known/unknown)
- Image hotspots (tap the correct area on a diagram)
- Fill-in-the-blanks (JCloze style)
- True/False with explanation

**Difficulty tier:** Recall, Conceptual Understanding

**XP per question:** 5 XP

**Example:**
```
Q: What is the top number of a fraction called?
  (a) Denominator
  (b) Numerator  ← correct
  (c) Whole number
  (d) Decimal
```

## Level 2: Deep Dive (Application)

**Purpose:** Test application and numerical problem-solving with step-by-step hints.

**Question types:**
- Interactive numeric solvers with hint reveals
- Multi-step MCQ (solve a problem, select the answer)
- Match the column (JMatch style)
- Drag-and-place (build a fraction, arrange steps)
- Worked example checks (verify understanding of a solved problem)

**Difficulty tier:** Application, Numerical

**XP per question:** 10 XP

**Features:**
- Step-by-step hint reveals (tap "Show Hint" for progressive guidance)
- Instant feedback with misconception explanation
- Retry without penalty (but no double XP)

**Example:**
```
Q: Calculate 2/3 + 1/3
  (a) 3/3 (= 1)  ← correct
  (b) 2/6
  (c) 3/6

Hint: When denominators are the same, add the numerators.
```

## Level 3: Boss Challenge (Critical Thinking)

**Purpose:** Multi-step scenario testing cross-concept mastery.

**Question types:**
- Branching scenarios (choose a path, see consequences)
- Multi-concept synthesis (combine 2+ concepts to solve)
- Open-ended with self-assessment rubric
- Case study analysis

**Difficulty tier:** Critical Thinking

**XP per question:** 20 XP

**Features:**
- No hints (students must apply all learned concepts)
- Explanatory feedback after answering
- May combine multiple sub-questions

**Example:**
```
Q: A pizza is cut into 8 slices. Priya eats 3 slices and Rahul eats 2.
   What fraction of the pizza is left? Explain your reasoning.

  (a) 3/8 — Priya ate 3/8, Rahul ate 2/8, total eaten = 5/8, left = 3/8  ← correct
  (b) 5/8 — This is how much was eaten, not what's left
  (c) 1/4 — Incorrect calculation
```

## Scoring and Feedback Engine

| Component | Description |
|-----------|-------------|
| **XP** | Awarded per correct answer (5/10/20 based on level) |
| **Levels** | Auto-level-up every 50 XP |
| **Badges** | Milestone badges for node completion, streaks, perfect scores |
| **Streaks** | Consecutive correct answers build a streak (shown in topbar) |
| **Confetti** | Visual celebration on correct answers and level-ups |
| **Misconception feedback** | Every wrong answer gets a verbal explanation (never reveals the correct answer) |

## Exercise Conversion (100% Coverage)

The ExerciseExtractor extracts **every** exercise from the source PDF:

| Source Format | Detected Type | Gamified As |
|---------------|---------------|-------------|
| MCQ with options (a)(b)(c)(d) | `mcq` | Level 1 or 2 (based on difficulty) |
| "Find/Calculate/Solve" + numbers | `numerical` | Level 2 (Deep Dive) |
| "What/Why/How/Explain" | `short_answer` | Level 1 (Warm-up) |
| "Discuss/Analyze/Compare" | `long_answer` | Level 3 (Boss Challenge) |
| "Fill in the blanks" / underscores | `fill_blank` | Level 1 (JCloze) |
| "True or False" | `true_false` | Level 1 (Warm-up) |
| "Match the following" | `match_column` | Level 2 (JMatch) |

Each extracted exercise is classified by difficulty tier (Recall → Conceptual →
Application → Critical Thinking) and routed to the appropriate assessment level.
