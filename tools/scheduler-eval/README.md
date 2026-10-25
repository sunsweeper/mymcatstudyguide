# Scheduler evaluation (Package 2, Phase 1)

- `sched.js`: the current ladder and the FSRS-5 scheduler and mastery model, as pure functions. The site's code is checked against this file by `tests/scheduler-parity.test.js`.
- `simulate.js`: simulated students under three memory models. Run with `node simulate.js`. Options: `EXAM=45|90|180` (days to the exam), `SESSION=25|50|100` (cards per session), `LEVELS=1` (recall by mastery level).
- `sim-*.txt` / `sim-*.json`: the outputs quoted in `docs/package-2/`.
