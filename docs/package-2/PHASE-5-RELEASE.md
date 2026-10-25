# Package 2 · Phase 5 release — adaptive sessions

## 5.1 Targeted review selection

This applies to **Focus review** sessions (every link and Study My Top Priorities on My Weaknesses), and to any resumed "Weakest topics" session.

**Order, up to 50 cards:**

| Order | Cards |
|---|---|
| 1 | Due and overdue cards, most overdue first |
| 2 | Cards missed repeatedly: 2 or more Didn't know among the last 4 reviews |
| 3 | Other missed cards: last rated Struggled or Didn't know |
| 4 | **Weak prerequisites:** cards outside the set whose concept is a prerequisite (Package 1 links) and that she has missed. Up to 5. |
| 5 | **Unseen cards:** capped at about 40% of the session |
| 6 | **Stronger cards for periodic review:** about 10% (provisionally mastered or mastered) |
| 7 | Everything else, to fill |

**Near-duplicates:** at most **3 cards per concept**, and never both cards of a near-duplicate pair. The 29 pairs marked same-fact or near-duplicate in Package 1 are now part of the embedded index.

**Doesn't distort schedules:** in a targeted session, a **Got it on a card that isn't due yet** leaves its due date, interval, memory strength and mastery level unchanged. It's saved with the rating as practice (`e`). A **miss counts normally**, because forgetting is real evidence. Regular sessions behave as before.

## 5.2 Controlled interleaving

Used for regular sessions (after the due reviews, which still come first) and for targeted sessions.

- **Familiar cards** (Developing or better): mixed across subtopics, never the same concept or a near-duplicate back to back.
- **New and still-shaky cards:** kept in **small blocks of up to 4 from one subtopic**, so first learning isn't scrambled. Blocks are spaced out among the familiar cards. Near-duplicates inside a block are moved apart.

## 5.3 End-of-session reinforcement

Instead of three random cards from positions 4–10, the picks are:
1. **a card she struggled with this session** (first rating Struggled / Didn't know);
2. **a card with a history of forgetting** (a Didn't know before today, or "needs attention");
3. **a card she'd already learned** (Developing or better, rated Got it this session), as a retention check.

Cards from the last three of the session are avoided when there's a choice. When a kind is missing (for example, a session of all new cards), the old positions 4–10 rule fills in.

Reinforcement is still retrieval before reveal and still changes no schedule or rating. Repeating a card at the end of a session is never counted toward mastery.

## Data changes and rollback

- **Data:** one optional field, `e`, on history entries. The embedded index gains `d` (near-duplicate pairs) and still matches `metadata/` exactly. No database change.
- **Rollback:** revert this commit or promote the previous deployment. Older builds treat an `e` entry as an ordinary rating.

## Tests

| Suite | Result |
|---|---|
| `tests/phase5-sessions.test.js` | 23 / 23 passed, stable over 5 runs |
| All other logic suites | 474 passed |
| Browser suites | 48 + 113 + 13 + 16 + 17 + 9 + 25 + 29 passed. The full-session reinforcement check now expects a struggled card. |

No interface change, so no layout or visual baseline change. Card protection passes.
