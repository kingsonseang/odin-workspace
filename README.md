# odin-workspace

Task fixtures for the evaluation of the Mercor tasks of project **Odin**.

Every folder in this workspace is one self-contained task: a small application with a
seeded defect, a broken or missing deliverable, and the material the agent needs to
start (the brief, the specification, the incident reports, the office templates). An
agent that is evaluated on a task works in that one folder; the folders are
independent of each other.

The authoritative statement of a task is the one on **Mercor Studio** (project Odin).
The material in the folders is the offline copy of it. If the two differ, the task on
Mercor Studio wins.

## Getting the workspace

The workspace is one git repository, and two of the task folders are submodules of it:
`traige-ci` and `git-feat-branch` are git repositories of their own, because their
prepared history is part of the task. Clone them with their submodules, or those two
folders stay empty:

```bash
git clone --recurse-submodules git@github.com:kingsonseang/odin-workspace.git
```

The repository is private. A clone that was made without `--recurse-submodules` is
completed with:

```bash
git submodule update --init --recursive
```

Both submodules are pinned to a fixed commit, so a fresh clone starts in a detached
HEAD state. The branches of the two fixtures are fetched with it and are checked out
like this:

```bash
git -C git-feat-branch checkout main     # or: feature/task-priority-filters
git -C traige-ci checkout main
```

## Layout

```
odin-workspace/
  <task-folder>/            one task per folder
    README.md               the brief of the task, and the state of the checkout
    task-inputs/            the material the agent is given (where the task has one)
    src/ tests/ docs/ ...   the application under test
  tools/                    the generators of the office templates
  README.md                 this file
```

`traige-ci` carries the material twice: its `task-inputs/` is the consolidated package
for the task, its `task-input/` the same material in expanded form, one file per
report. The two describe the same incident and can be read together.

## The tasks

| Folder | Application | What the agent has to do | Deliverable |
| --- | --- | --- | --- |
| `batch-img` | TypeScript + Sharp | Implement the batch path of the image resizer correctly; the batch path is unsafe on purpose | Fixed code, green tests |
| `crx-purchase` | FauxPay webhook handler | Make the payment webhook idempotent against redelivery | Fixed code, green tests |
| `csv-imp-val` | CSV import validator | Close the gaps of the validator until it meets the import contract | Fixed code, green tests |
| `csv-parse` | Strict CSV parser | Fix the seeded defect in `src/parser.ts`; tests, fixtures and schema stay unchanged | Fixed code, green tests |
| `data-prox` | Record matcher | Replace the inefficient matcher with a faster one that stays correct | Faster implementation, benchmark on the recording machine |
| `doc-for-dev` | Forgeboard project tracker | Document the codebase for a new engineer | README plus three office documents (`.odg`, `.ods`, `.odt`) |
| `fix-json-exp` | React JSON viewer | Fix the stale-data defect of the JSON download | Fixed code, green tests |
| `fix-md-exp` | Markdown to HTML | Fix the seeded relative-link bug | Fixed code, green tests |
| `git-feat-branch` | Taskline board | Integrate two divergent branches, resolve the conflict, review the result | PR and release checklist (`.odt`), branch evidence |
| `image-meta` | Thumbnail generator | Respect the JPEG EXIF orientation tag when resizing | Fixed code, green tests |
| `img-up-preview` | Image preview | Fix the preview state synchronization and the object URL lifecycle | Fixed code, green tests |
| `img-up-stall` | Image upload preview | Clear the stale preview and clean up the object URLs | Fixed code, green tests |
| `json-conf-val` | Config loader | Validate the parsed JSON at runtime instead of trusting a type assertion | Fixed code, green tests |
| `prod-api` | Records API | Make the intentionally imperfect API production-ready | Hardened service, green tests |
| `relaible-json-exp-action` | React JSON viewer | Make the JSON export action reliable | Fixed code, green tests |
| `test-plan-defect-regression` | Tasklane board | Build a regression test plan from six defect reports | Defect register, test matrix and report (`.ods`, `.odt`), new tests |
| `thumbnail-gen` | Thumbnail generator | Fix the crop dimensions and the second seeded gap | Fixed code, green tests |
| `traige-ci` | Trailhead planning app | Triage the failing CI run #2841 and decide on the release | Release report (`.odt`), the fixes, the go/no-go decision |
| `transparent-img` | Image converter | Handle transparency when converting to JPEG, add the background configuration | Fixed code, green tests |

## Conventions

* Node.js 20.11 or newer and npm 10 or newer. `img-up-stall` needs Node 22, and
  `crx-purchase` runs on Bun 1.4 (it is the runtime, the package manager and the test
  runner there).
* The applications are small, offline and synthetic. No database, no account, no
  network access at runtime.
* The defects are deliberate. In the code fixtures the tests describe the intended
  behaviour and fail until the work is done, so a failing test suite is the expected
  starting state. The other fixtures start with a missing deliverable (a document, a
  report, a merged branch) instead of a defect.
* The specification decides. Where the code, a test and the specification disagree,
  the specification wins, and a test that contradicts it is the thing that has to be
  corrected.
* The material of the task (the incident reports, the criteria, the requirements, the
  office templates) is the record of the incident and must not be edited. Work on a
  copy of a template.
* The seeded demo data and the tests are not to be weakened to make something pass.

## The apps

The tasks are carried out with **Firefox**, **Terminal.app**, **Visual Studio Code**
and **LibreOffice Writer**. The task states which of them it needs, and an
alternative must not be substituted for a stated app: a browser check is made in
Firefox, not in another browser, and the office documents are filled in with
LibreOffice, not with another word processor. If a task states another app, that app
is the one to use.

## Working on a fixture

```bash
cd <task-folder>
npm install        # or: bun install
npm test           # in the code fixtures: expect the described tests to fail
npm run typecheck
npm run build
```

The README of the folder states the exact commands, the acceptance criteria and the
deliverable. The fixtures with a browser or an office deliverable state how the
verification is made in the browser and how the template is filled in.

## Notes

* `traige-ci` and `git-feat-branch` are git repositories with a prepared history
  (a failing build, divergent branches with a real conflict). The other fixtures are
  plain directories. The two are submodules of this repository, which is why the clone
  needs `--recurse-submodules`.
* `doc-for-dev` (Forgeboard, a monorepo with an API and a web app) and
  `test-plan-defect-regression` (Tasklane, a Vite app) are two different
  applications of the same kind, a project and task board, with two different
  exercises: one asks for documentation, the other for a regression test plan.
* All the office templates declare ODF 1.4 and open in LibreOffice Writer, Draw
  and Calc without a repair. The generators that build them are in
  [`tools/`](./tools/).
