# Performance Optimization Report

> **Fill this in from an actual run on the recording machine.**
> Do not copy numbers from another machine, CI, the README, or a previous
> report. One timing is not conclusive. Record raw samples and state the limits
> of the measurement.

## 1. Summary

- Task:
- Recording date:
- Author:
- Implementation revision/commit:
- One-paragraph summary of what was investigated and changed:

## 2. Recording environment

| Item | Value |
| --- | --- |
| Hostname or machine identifier | _record during run_ |
| CPU model | _record during run_ |
| CPU core count | _record during run_ |
| Memory | _record during run_ |
| OS and version | _record during run_ |
| Architecture | _record during run_ |
| Node.js version | _record during run_ |
| npm version | _record during run_ |
| Filesystem / container context, if any | _record during run_ |

## 3. Reproduction commands

```sh
npm install
npm run typecheck
npm test
npm run build
npm run bench
```

Additional commands or environment overrides used for this report:

```sh
# Record exact commands, including BENCH_WARMUP and BENCH_ITERATIONS.
```

## 4. Baseline investigation

Describe the observed bottleneck and the evidence for it. Do not state a cause
that was not supported by investigation.

- Where does repeated work occur?
- What growth pattern is visible as fixture sizes increase?
- What evidence was collected (source inspection, profiling, timing samples,
  operation counts, or another measurement)?
- What parts of the baseline are likely to matter most for realistic inputs?
- What constraints must a replacement preserve?

Evidence:

```text
Paste relevant notes or a small excerpt of profiling/timing output here.
```

## 5. Candidate implementation

- Description of the replacement approach:
- Files changed:
- Why this approach addresses the observed bottleneck:
- What is intentionally not changed:
- Complexity or resource trade-offs, described from analysis rather than assumed:
- Remaining costs or limitations:

## 6. Correctness evidence

### Automated tests

```text
Paste the summary from `npm test` on the recording machine.
```

- Number of tests:
- Pass/fail:
- Edge cases covered:

### Additional cases added

List any tests added beyond the starter suite and why they were needed.

### Benchmark equivalence

The benchmark compares `matchRecordsBaseline` and `matchRecords` before timing.
Record its equivalence result:

```text
Paste the equivalence lines from the benchmark output.
```

- Was every fixture equivalent? _yes/no_
- Were inputs frozen to detect mutation? _yes/no_
- Were empty collections and duplicate-key cases separately tested? _yes/no_

## 7. Benchmark configuration

| Item | Value |
| --- | --- |
| Fixtures used | `small`, `medium`, `large` |
| Small primary / reference counts | 24 / 12 |
| Medium primary / reference counts | 1,000 / 400 |
| Large primary / reference counts | 8,000 / 3,000 |
| Warm-up iterations | _record actual value_ |
| Measured iterations | _record actual value_ |
| Execution order | Alternating baseline/candidate per iteration |
| Command | _record exact command_ |

## 8. Raw measurements

Paste the benchmark's raw samples exactly as printed. Do not round them for the
report. If results from multiple independent runs are reported, label each run
and do not present only the best one.

### Small fixture

| Implementation | Raw samples (ms) | Median (ms) | Min (ms) | Max (ms) |
| --- | --- | ---: | ---: | ---: |
| Baseline | _paste_ | _paste_ | _paste_ | _paste_ |
| Candidate | _paste_ | _paste_ | _paste_ | _paste_ |

### Medium fixture

| Implementation | Raw samples (ms) | Median (ms) | Min (ms) | Max (ms) |
| --- | --- | ---: | ---: | ---: |
| Baseline | _paste_ | _paste_ | _paste_ | _paste_ |
| Candidate | _paste_ | _paste_ | _paste_ | _paste_ |

### Large fixture

| Implementation | Raw samples (ms) | Median (ms) | Min (ms) | Max (ms) |
| --- | --- | ---: | ---: | ---: |
| Baseline | _paste_ | _paste_ | _paste_ | _paste_ |
| Candidate | _paste_ | _paste_ | _paste_ | _paste_ |

## 9. Summary of measured results

| Fixture | Baseline median (ms) | Candidate median (ms) | Candidate / baseline | Notes |
| --- | ---: | ---: | ---: | --- |
| Small | _paste_ | _paste_ | _derive from this run_ | |
| Medium | _paste_ | _paste_ | _derive from this run_ | |
| Large | _paste_ | _paste_ | _derive from this run_ | |

The ratio is candidate median divided by baseline median, computed from this
run only. A value below `1.0` means the candidate median was lower in this run;
it is not a guaranteed speedup. State clearly whether these values come from one
run or repeated runs, describe run-to-run variation, and do not generalize
beyond the measured environment.

## 10. Interpretation and limitations

- What do the measurements support?
- What do they not support?
- Which results are stable and which are noisy?
- How might fixture shape, duplicate rates, CPU, Node.js version, or memory
  pressure affect the result?
- What would need to be measured before making a broader performance claim?
- Is the result sufficient for the recorded task? Why?

## 11. Follow-ups

- None.
- Or list concrete, evidence-backed follow-ups without promising unimplemented
  performance improvements.

## 12. Completion checklist

- [ ] `matchRecordsBaseline` is unchanged and still functional.
- [ ] Public `matchRecords` signature and result shape are unchanged.
- [ ] `npm run typecheck` passes.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] Benchmark equivalence check passes for every fixture.
- [ ] Inputs were not mutated by either implementation.
- [ ] Raw benchmark samples are included.
- [ ] Summary values were derived from this run only.
- [ ] No invented, copied, or guaranteed speedup is claimed.
- [ ] Environment details identify the actual recording machine.
- [ ] Limitations and single-run uncertainty are stated.
