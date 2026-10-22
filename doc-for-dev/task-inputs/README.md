# Task inputs — Document an unfamiliar codebase for a new engineer

Everything the engineer needs to **start** the exercise lives in this directory.
None of it contains the answer: the architecture, the request flow, the
component map, and the completed README are what the engineer has to produce by
reading the code, running the app, and testing the claims.

The application under study is the Forgeboard project tracker at the repository
root.

## Files in this directory

| File | Format | What it is | Filled in by the engineer? |
| --- | --- | --- | --- |
| `product-brief.md` | Markdown | The behavioural source of truth: purpose, users, workflows, and the rules the product is supposed to follow. Contains no architecture and no implementation detail. | Read only |
| `onboarding-requirements.md` | Markdown | What the finished documentation must let a new engineer understand and do, plus the format expected for each deliverable. | Read only |
| `architecture-checklist.md` | Markdown | Coverage checklist for the architecture and flow write-up, grouped by area. | Use as a checklist |
| `validation-checklist.md` | Markdown | Short final smoke test: setup, automated checks, product flow, permissions, documentation cross-check. | Use as a checklist |
| `architecture-template.odg` | OpenDocument Drawing (`.odg`) | Draw canvas with labelled placeholder boxes for the frontend, the API, the business logic, the persistence layer, and external dependencies. Nothing is connected. | **Yes — deliverable** |
| `onboarding-guide-template.odt` | OpenDocument Text (`.odt`) | Writer skeleton with the required headings: repository structure, architecture overview, request lifecycle, key dependencies, local setup, testing, troubleshooting. All prose is left blank. | **Yes — deliverable** |
| `component-inventory-template.ods` | OpenDocument Spreadsheet (`.ods`) | Calc sheet with the inventory columns *Component*, *Location*, *Responsibility*, *Dependencies*, *Evidence*, a few clearly marked placeholder rows, and a "How to use" sheet. | **Yes — deliverable** |
| `../README.md` | Markdown | The project's own README. Installation and checks work; the architecture, request flow, dependencies, and troubleshooting sections are deliberately unfinished. | **Yes — deliverable** |

## Opening the office documents in LibreOffice

The three templates are standard OpenDocument files, so LibreOffice opens and
edits them natively. Install LibreOffice 7 or newer from
<https://www.libreoffice.org/download/> if you do not have it yet.

**Onboarding guide (`.odt`)**

1. Start **LibreOffice Writer**.
2. Choose **File ▸ Open…** (or `Ctrl+O` / `Cmd+O`), select
   `onboarding-guide-template.odt`, and open it.
3. Type directly into the bracketed placeholder lines; delete the prompts you no
   longer need. Headings use the built-in Heading styles, so they appear in the
   navigation pane and can be turned into a table of contents.
4. Save with `Ctrl+S` / `Cmd+S` and keep the current OpenDocument format.

**Architecture diagram (`.odg`)**

1. Start **LibreOffice Draw**.
2. **File ▸ Open…**, select `architecture-template.odg`, and open it.
3. Click a placeholder box to select it, then double-click to edit its text.
   Drag boxes to arrange them, and use the **Insert ▸ Shape ▸ Connector** or
   the arrow line tool to draw the connections you verified.
4. Save as `.odg`. If you need a flat copy for sharing, use **File ▸ Export as
   PDF** (keeps the layout) or **File ▸ Export** to PNG.

**Component inventory (`.ods`)**

1. Start **LibreOffice Calc**.
2. **File ▸ Open…**, select `component-inventory-template.ods`, and open it.
3. Fill the *Component inventory* sheet row by row, replacing the placeholder
   rows. The second sheet, *How to use*, explains each column — keep it or
   replace it.
4. Save as `.ods`, or use **File ▸ Save As…** to store a copy in another format.

**Command line** (handy for exporting a PDF copy):

```bash
soffice --headless --convert-to pdf onboarding-guide-template.odt
soffice --headless --convert-to pdf architecture-template.odg
soffice --headless --convert-to pdf component-inventory-template.ods
```

**Without LibreOffice:** the spreadsheet and the text document open in Google
Docs / Google Sheets (upload, then *File ▸ Import/Open*), and both open in
OnlyOffice, WPS Office, and Collabora Online. The Draw file is the least
portable of the three — if you have no LibreOffice, export it to PDF or produce
the diagram in another tool and keep the placeholder canvas as the checklist of
what the diagram had to cover.

## Working order that usually works

1. Read `product-brief.md` to learn what the product is supposed to do.
2. Install and run the project, then click through it as a user.
3. Read the code and the tests to find out how it actually works.
4. Fill the three office templates and the README.
5. Run `validation-checklist.md` over the result and fix what it catches.

## Rules of engagement

- Do not change the application source, tests, schema, or configuration. The
  deliverable is documentation.
- Do not delete the placeholder rows, prompts, or boxes until you have replaced
  them with something you verified.
- Cite evidence: a path, a symbol, a command, a response, or an observation.
- Mark what you could not verify instead of guessing.
- When the shipped documentation and the running product disagree, record both
  and classify the difference rather than silently "fixing" the docs.
