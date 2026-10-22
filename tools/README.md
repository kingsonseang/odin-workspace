# tools

The generators of the office templates of the task fixtures. Every template in a
`task-inputs/` directory is produced by one of these scripts, so a template can be
changed and rebuilt instead of being edited by hand.

| Script | Writes | Task |
| --- | --- | --- |
| `make_odt.py` | `traige-ci/task-inputs/release-report-template.odt` | Release report of the CI triage task |
| `build_task_input_odts.py` | `git-feat-branch/task-inputs/pull-request-template.odt`, `git-feat-branch/task-inputs/release-checklist-template.odt` | Pull request and release checklist of the branch task |
| `gen_odf.py` | `doc-for-dev/task-inputs/onboarding-guide-template.odt`, `doc-for-dev/task-inputs/architecture-template.odg`, `doc-for-dev/task-inputs/component-inventory-template.ods` | Onboarding guide, architecture canvas and component inventory of the documentation task |
| `generate_task_inputs_odf.py` | `test-plan-defect-regression/task-inputs/defect-register.ods`, `defect-test-matrix.ods`, `verification-report-template.odt` | Defect register, test matrix and verification report of the regression task |

```bash
cd tools
python3 make_odt.py            # the others work the same way
```

The paths are relative to the workspace root, so the scripts can be run from
anywhere. `gen_odf.py` writes to `doc-for-dev/task-inputs` by default and takes
`ODF_OUT` as an override.

The templates of `test-plan-defect-regression` were opened and saved by
LibreOffice itself, so they carry the extra entries of a LibreOffice package
(`manifest.rdf`, `Thumbnails/`, `Configurations2/`). `generate_task_inputs_odf.py`
writes an equivalent but smaller package; running it replaces them with a
different (not broken) shape.

## Where a style has to live

The styles of the shapes of the drawing canvas (`fr-box`, `fr-note`, `fr-text`) are
declared in **content.xml**, in its `office:automatic-styles`. A graphic style that
only lives in styles.xml is not applied by LibreOffice: every shape falls back to
the default drawing style, a solid green fill, and the canvas loses its colours.
The paragraph styles and the page layout stay in styles.xml.

The boxes of the canvas are 4.2 cm high. The longest placeholder hint needs five
lines, and at 3.4 cm it ran out of the box and into the box below it.


## The ODF version

The packages declare **ODF 1.4**. LibreOffice 26.8 and newer refuse to open a
package that declares 1.3: the load fails with *source file could not be loaded*,
without a filter error, and the document cannot be opened in Writer, Draw or Calc.
Both `office:version` and `manifest:version` have to be 1.4 for the package to open.

The templates of `test-plan-defect-regression` were the only ones that already
declared 1.4, which is why they were the only ones that opened.
