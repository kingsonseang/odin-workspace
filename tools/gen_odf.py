#!/usr/bin/env python3
"""Generate editable ODF (ODT/ODG/ODS) starter files for the onboarding task.

Each output is a standards-compliant ODF package: a `mimetype` entry stored
first and uncompressed, META-INF/manifest.xml, and the XML parts.
"""

from __future__ import annotations

import os
import zipfile
from pathlib import Path

OUT_DIR = os.environ.get(
    "ODF_OUT",
    str(Path(__file__).resolve().parent.parent / "doc-for-dev" / "task-inputs"),
)
STAMP = "2026-10-21T09:00:00"

NS_COMMON = (
    'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" '
    'xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" '
    'xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" '
    'xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" '
    'xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" '
    'xmlns:presentation="urn:oasis:names:tc:opendocument:xmlns:presentation:1.0" '
    'xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" '
    'xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" '
    'xmlns:dc="http://purl.org/dc/elements/1.1/" '
    'xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0" '
    'xmlns:number="urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0" '
    'xmlns:xlink="http://www.w3.org/1999/xlink"'
)

MIMETYPES = {
    "odt": "application/vnd.oasis.opendocument.text",
    "odg": "application/vnd.oasis.opendocument.graphics",
    "ods": "application/vnd.oasis.opendocument.spreadsheet",
}


def esc(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def manifest(mime: str) -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" '
        'manifest:version="1.4">\n'
        f'  <manifest:file-entry manifest:full-path="/" manifest:version="1.4" manifest:media-type="{mime}"/>\n'
        '  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>\n'
        '  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>\n'
        '  <manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>\n'
        '  <manifest:file-entry manifest:full-path="settings.xml" manifest:media-type="text/xml"/>\n'
        '</manifest:manifest>\n'
    )


def meta_xml(title: str, creator: str) -> str:
    # Single line on purpose: whitespace text nodes confuse some ODF consumers.
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<office:document-meta {NS_COMMON} office:version="1.4">'
        "<office:meta>"
        "<meta:generator>Forgeboard task materials</meta:generator>"
        f"<dc:title>{esc(title)}</dc:title>"
        f"<dc:creator>{esc(creator)}</dc:creator>"
        f"<dc:date>{STAMP}</dc:date>"
        f"<meta:creation-date>{STAMP}</meta:creation-date>"
        "</office:meta>"
        "</office:document-meta>\n"
    )


def settings_xml() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<office:document-settings {NS_COMMON} office:version="1.4">'
        "<office:settings/>"
        "</office:document-settings>\n"
    )


def write_package(path: str, kind: str, content: str, styles: str, title: str) -> None:
    mime = MIMETYPES[kind]
    parts = {
        "META-INF/manifest.xml": manifest(mime),
        "content.xml": content,
        "styles.xml": styles,
        "meta.xml": meta_xml(title, "Forgeboard onboarding exercise"),
        "settings.xml": settings_xml(),
    }
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as zf:
        info = zipfile.ZipInfo("mimetype", date_time=(2026, 10, 21, 9, 0, 0))
        info.compress_type = zipfile.ZIP_STORED
        zf.writestr(info, mime)
        for name, data in parts.items():
            zf.writestr(name, data)
    print(f"wrote {path}")


# --------------------------------------------------------------------------
# Writer (.odt)
# --------------------------------------------------------------------------

WRITER_SECTIONS = [
    (
        "Repository structure",
        [
            "List the top-level units of the repository and what each one owns.",
            "Point to the entry points (process start, routes, pages) with paths.",
            "Say which parts are generated, vendored, or intentionally empty.",
            "Mark anything you could not verify instead of guessing.",
        ],
    ),
    (
        "Architecture overview",
        [
            "Describe the runtime processes and what each one is responsible for.",
            "Explain the boundaries between them and how they communicate.",
            "Summarise the diagram you produced (architecture-template.odg) so the guide stands alone.",
            "Name the design decisions that shaped the boundaries and their trade-offs.",
        ],
    ),
    (
        "Request lifecycle",
        [
            "Trace one read path end to end: entry point, call chain, data, response.",
            "Trace one write path end to end, including validation and any side effects.",
            "Trace one rejected path and record the exact error the caller receives.",
            "Say which layer is authoritative for permissions, state changes, and computed values.",
        ],
    ),
    (
        "Key dependencies",
        [
            "List the third-party packages that matter and why each one is used.",
            "Record the internal dependency direction between modules.",
            "Note version or runtime constraints that a new engineer must respect.",
            "Flag anything outdated, duplicated, or a candidate for replacement.",
        ],
    ),
    (
        "Local setup",
        [
            "Give the exact commands to install, configure, run, and stop the app.",
            "Record the URLs the running processes actually use.",
            "Document the configuration variables, their defaults, and who reads them.",
            "State what has to be true before the app is healthy.",
        ],
    ),
    (
        "Testing",
        [
            "List the test suites, what each one covers, and how to run them.",
            "Record the commands you ran and the observed results.",
            "Identify important behaviour that is not covered by tests.",
            "Explain how to verify a change end to end in the running app.",
        ],
    ),
    (
        "Troubleshooting",
        [
            "Write the symptoms you hit while setting the project up.",
            "For each symptom, give the cause and the fix that worked.",
            "Cover the failure modes a new engineer is most likely to hit.",
            "Add more rows as you find real problems; do not invent generic advice.",
        ],
    ),
]

WRITER_EXTRA = [
    (
        "Discrepancies found",
        [
            "Record every difference between the shipped documentation and the running product.",
            "For each one, cite the claim, the observed behaviour, your evidence, and a classification.",
            "Say whether the fix belongs in the docs, the code, or a decision that still needs an owner.",
        ],
    ),
    (
        "Decisions and trade-offs",
        [
            "List the non-obvious decisions a new maintainer must respect.",
            "For each: context, the alternative, the consequence, and how to change it safely.",
        ],
    ),
    (
        "Open questions",
        [
            "List anything you could not answer, and who should answer it.",
            "Separate unknowns that block work from unknowns that are merely interesting.",
        ],
    ),
]


def writer_styles() -> str:
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles {NS_COMMON} office:version="1.4">
  <office:styles>
    <style:default-style style:family="paragraph">
      <style:paragraph-properties fo:hyphenation-ladder-count="no-limit"/>
      <style:text-properties style:font-name="Calibri" fo:font-size="11pt" fo:language="en" fo:country="US"/>
    </style:default-style>
    <style:style style:name="Standard" style:family="paragraph" style:class="text"/>
    <style:style style:name="Title" style:family="paragraph" style:parent-style-name="Standard">
      <style:paragraph-properties fo:margin-bottom="0.1cm"/>
      <style:text-properties fo:font-size="22pt" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="Subtitle" style:family="paragraph" style:parent-style-name="Standard">
      <style:paragraph-properties fo:margin-bottom="0.5cm"/>
      <style:text-properties fo:font-size="12pt" fo:font-style="italic" fo:color="#555555"/>
    </style:style>
    <style:style style:name="Heading" style:family="paragraph" style:parent-style-name="Standard">
      <style:paragraph-properties fo:margin-top="0.5cm" fo:margin-bottom="0.2cm" fo:keep-with-next="always"/>
      <style:text-properties fo:font-size="16pt" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="Heading_20_1" style:display-name="Heading 1" style:family="paragraph" style:parent-style-name="Heading">
      <style:text-properties fo:font-size="16pt" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="Heading_20_2" style:display-name="Heading 2" style:family="paragraph" style:parent-style-name="Heading">
      <style:text-properties fo:font-size="13pt" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="Prompt" style:family="paragraph" style:parent-style-name="Standard">
      <style:paragraph-properties fo:margin-left="0.5cm" fo:margin-bottom="0.1cm"/>
      <style:text-properties fo:color="#3d3d3d"/>
    </style:style>
    <style:style style:name="Placeholder" style:family="paragraph" style:parent-style-name="Standard">
      <style:paragraph-properties fo:margin-top="0.25cm" fo:margin-bottom="0.4cm" fo:padding="0.25cm" fo:border="0.5pt dashed #b3b3b3"/>
      <style:text-properties fo:font-style="italic" fo:color="#6f6f6f"/>
    </style:style>
    <style:style style:name="Note" style:family="paragraph" style:parent-style-name="Standard">
      <style:paragraph-properties fo:margin-bottom="0.3cm"/>
      <style:text-properties fo:font-size="10pt" fo:color="#555555"/>
    </style:style>
  </office:styles>
  <office:automatic-styles>
    <style:page-layout style:name="PM1">
      <style:page-layout-properties fo:page-width="21.001cm" fo:page-height="29.7cm" fo:margin-top="2cm" fo:margin-bottom="2cm" fo:margin-left="2cm" fo:margin-right="2cm"/>
    </style:page-layout>
  </office:automatic-styles>
  <office:master-styles>
    <style:master-page style:name="Standard" style:page-layout-name="PM1"/>
  </office:master-styles>
</office:document-styles>
"""


def writer_content() -> str:
    out: list[str] = []
    out.append(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<office:document-content {NS_COMMON} office:version="1.4">\n'
        + draw_content_styles()
        + "  <office:body>\n"
        "    <office:text>\n"
    )
    out.append(
        '      <text:p text:style-name="Title">Forgeboard onboarding guide</text:p>\n'
    )
    out.append(
        '      <text:p text:style-name="Subtitle">Template - every section below is empty on purpose. '
        "Fill it in from the source code, the tests, and the running app, and delete the prompts "
        "you no longer need.</text:p>\n"
    )
    out.append(
        '      <text:p text:style-name="Note">Author: ______________________    '
        "Reviewed by: ______________________    Date: ______________</text:p>\n"
    )

    for heading, prompts in WRITER_SECTIONS:
        out.append(
            f'      <text:h text:style-name="Heading_20_1" text:outline-level="1">{esc(heading)}</text:h>\n'
        )
        for prompt in prompts:
            out.append(
                f'      <text:p text:style-name="Prompt">\u2022 {esc(prompt)}</text:p>\n'
            )
        out.append(
            '      <text:p text:style-name="Placeholder">[Write the explanation here. '
            "Support each claim with a path, symbol, command, or observed response.]</text:p>\n"
        )

    out.append(
        '      <text:h text:style-name="Heading_20_1" text:outline-level="1">Additional sections</text:h>\n'
    )
    out.append(
        '      <text:p text:style-name="Note">Keep the headings above, and add the sections '
        "below when you have something real to record. Delete any section that stays empty.</text:p>\n"
    )
    for heading, prompts in WRITER_EXTRA:
        out.append(
            f'      <text:h text:style-name="Heading_20_2" text:outline-level="2">{esc(heading)}</text:h>\n'
        )
        for prompt in prompts:
            out.append(
                f'      <text:p text:style-name="Prompt">\u2022 {esc(prompt)}</text:p>\n'
            )
        out.append(
            '      <text:p text:style-name="Placeholder">[Write the explanation here.]</text:p>\n'
        )

    out.append("    </office:text>\n  </office:body>\n</office:document-content>\n")
    return "".join(out)


# --------------------------------------------------------------------------
# Draw (.odg)
# --------------------------------------------------------------------------

BOXES = [
    (
        "Frontend",
        "1cm",
        "4.4cm",
        "Name the real front-end component, its responsibility, and the file that proves it.",
    ),
    (
        "API",
        "10.35cm",
        "4.4cm",
        "Name the real API component, its responsibility, and the file that proves it.",
    ),
    (
        "Business logic",
        "19.7cm",
        "4.4cm",
        "Name the real business-logic component, its responsibility, and the file that proves it.",
    ),
    (
        "Persistence",
        "1cm",
        "9.2cm",
        "Name the real persistence component, its responsibility, and the file that proves it.",
    ),
    (
        "External dependencies",
        "10.35cm",
        "9.2cm",
        "List the external systems, services, or data sources you actually found.",
    ),
]


def draw_styles() -> str:
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles {NS_COMMON} office:version="1.4">
  <office:styles>
    <style:default-style style:family="paragraph">
      <style:text-properties style:font-name="Calibri" fo:font-size="11pt" fo:language="en" fo:country="US"/>
    </style:default-style>
    <style:style style:name="Standard" style:family="paragraph" style:class="text"/>
  </office:styles>
  <office:automatic-styles>
    <style:page-layout style:name="PM1">
      <style:page-layout-properties fo:page-width="29.7cm" fo:page-height="21cm" style:print-orientation="landscape" fo:margin-top="1cm" fo:margin-bottom="1cm" fo:margin-left="1cm" fo:margin-right="1cm"/>
    </style:page-layout>
    <style:style style:name="P-title" style:family="paragraph" style:parent-style-name="Standard">
      <style:paragraph-properties fo:text-align="center" fo:margin-bottom="0.15cm"/>
      <style:text-properties fo:font-size="14pt" fo:font-weight="bold" fo:color="#25332a"/>
    </style:style>
    <style:style style:name="P-body" style:family="paragraph" style:parent-style-name="Standard">
      <style:paragraph-properties fo:text-align="center"/>
      <style:text-properties fo:font-size="10pt" fo:color="#4a4a4a"/>
    </style:style>
    <style:style style:name="P-heading" style:family="paragraph" style:parent-style-name="Standard">
      <style:paragraph-properties fo:text-align="left" fo:margin-bottom="0.1cm"/>
      <style:text-properties fo:font-size="20pt" fo:font-weight="bold" fo:color="#25332a"/>
    </style:style>
    <style:style style:name="P-sub" style:family="paragraph" style:parent-style-name="Standard">
      <style:paragraph-properties fo:text-align="left"/>
      <style:text-properties fo:font-size="11pt" fo:font-style="italic" fo:color="#555555"/>
    </style:style>
    <style:style style:name="dp1" style:family="drawing-page">
      <style:drawing-page-properties draw:fill="solid" draw:fill-color="#ffffff"/>
    </style:style>
  </office:automatic-styles>
  <office:master-styles>
    <style:master-page style:name="Default" style:page-layout-name="PM1"/>
  </office:master-styles>
</office:document-styles>
"""


def draw_content_styles() -> str:
    """The styles of the shapes, declared in content.xml.

    A graphic style that only lives in styles.xml is not applied by
    LibreOffice: every shape falls back to the default drawing style, a solid
    green fill, and the canvas loses its colours.
    """
    return """  <office:automatic-styles>
    <style:style style:name="fr-box" style:family="graphic">
      <style:graphic-properties draw:stroke="solid" draw:stroke-color="#6f7d73" draw:stroke-width="0.06cm" draw:fill="solid" draw:fill-color="#f4f6f4" style:run-through="foreground" style:protect="none" fo:padding="0.25cm"/>
    </style:style>
    <style:style style:name="fr-note" style:family="graphic">
      <style:graphic-properties draw:stroke="solid" draw:stroke-color="#9aa39d" draw:stroke-width="0.04cm" draw:fill="solid" draw:fill-color="#fbfaf5" style:run-through="foreground" style:protect="none" fo:padding="0.25cm"/>
    </style:style>
    <style:style style:name="fr-text" style:family="graphic">
      <style:graphic-properties draw:stroke="none" draw:fill="none" style:run-through="foreground" style:protect="none" fo:padding="0cm"/>
    </style:style>
  </office:automatic-styles>
"""


def draw_content() -> str:
    out: list[str] = [
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<office:document-content {NS_COMMON} office:version="1.4">\n'
        "  <office:body>\n"
        "    <office:drawing>\n"
        '      <draw:page draw:name="Architecture" draw:style-name="dp1" draw:master-page-name="Default">\n'
    ]

    out.append(
        '        <draw:frame draw:style-name="fr-text" draw:name="Title" '
        'svg:x="1cm" svg:y="1cm" svg:width="27.7cm" svg:height="1.1cm" text:anchor-type="page">\n'
        "          <draw:text-box>\n"
        '            <text:p text:style-name="P-heading">Architecture - template</text:p>\n'
        '            <text:p text:style-name="P-sub">Placeholder canvas. Replace the boxes, '
        "positions, and labels with the components you actually find, then connect them with "
        "the real dependency and request directions.</text:p>\n"
        "          </draw:text-box>\n"
        "        </draw:frame>\n"
    )

    shape_ids = {
        "Frontend": "Frontend",
        "API": "Api",
        "Business logic": "BusinessLogic",
        "Persistence": "Persistence",
        "External dependencies": "ExternalDependencies",
    }
    for name, x, y, hint in BOXES:
        out.append(
            f'        <draw:frame draw:style-name="fr-box" draw:name="{shape_ids[name]}" '
            f'svg:x="{x}" svg:y="{y}" svg:width="8cm" svg:height="4.2cm" text:anchor-type="page">\n'
            "          <draw:text-box>\n"
            f'            <text:p text:style-name="P-title">{esc(name)} placeholder</text:p>\n'
            f'            <text:p text:style-name="P-body">{esc(hint)}</text:p>\n'
            "          </draw:text-box>\n"
            "        </draw:frame>\n"
        )

    out.append(
        '        <draw:frame draw:style-name="fr-note" draw:name="Notes" '
        'svg:x="19.7cm" svg:y="9.2cm" svg:width="8cm" svg:height="4.2cm" text:anchor-type="page">\n'
        "          <draw:text-box>\n"
        '            <text:p text:style-name="P-title">Notes and evidence</text:p>\n'
        '            <text:p text:style-name="P-body">Record the file, symbol, or command that '
        "proves each element you draw.</text:p>\n"
        "          </draw:text-box>\n"
        "        </draw:frame>\n"
    )

    out.append(
        '        <draw:frame draw:style-name="fr-text" draw:name="Footer" '
        'svg:x="1cm" svg:y="14.2cm" svg:width="27.7cm" svg:height="2.2cm" text:anchor-type="page">\n'
        "          <draw:text-box>\n"
        '            <text:p text:style-name="P-sub">Box positions are placeholders only - they do '
        "not show the real dependency direction, and no connectors are drawn for you.</text:p>\n"
        '            <text:p text:style-name="P-sub">Add connectors only after you have verified the '
        "actual paths in the source code and the running app.</text:p>\n"
        '            <text:p text:style-name="P-sub">Legend to maintain: solid border = module you '
        "own, dashed border = external system, double border = shared contract, "
        "connector label = the message that travels.</text:p>\n"
        "          </draw:text-box>\n"
        "        </draw:frame>\n"
    )

    out.append("      </draw:page>\n    </office:drawing>\n  </office:body>\n</office:document-content>\n")
    return "".join(out)


# --------------------------------------------------------------------------
# Calc (.ods)
# --------------------------------------------------------------------------

INVENTORY_COLUMNS = [
    ("Component", "3.4cm"),
    ("Location", "3.6cm"),
    ("Responsibility", "4.2cm"),
    ("Dependencies", "3.0cm"),
    ("Evidence", "3.0cm"),
]

INVENTORY_ROWS = [
    (
        "[Component name]",
        "[path/to/module or directory]",
        "[One sentence: what this unit is responsible for]",
        "[Upstream and downstream units]",
        "[File path, symbol, test, or command output]",
    ),
    (
        "[Component name]",
        "[path/to/module or directory]",
        "[One sentence: what this unit is responsible for]",
        "[Upstream and downstream units]",
        "[File path, symbol, test, or command output]",
    ),
    (
        "[Component name]",
        "[path/to/module or directory]",
        "[One sentence: what this unit is responsible for]",
        "[Upstream and downstream units]",
        "[File path, symbol, test, or command output]",
    ),
]

HOW_TO_USE = [
    ("Component inventory", "Template for the deliverable described in onboarding-requirements.md."),
    ("How to use this sheet", "Instructions only - delete nothing from this sheet except the placeholders you replace."),
    ("Purpose", "One row per component you discover, so a new engineer can see responsibility and dependency at a glance."),
    ("Before you start", "Inspect the source code and the tests, run the app, and confirm the setup instructions before filling any row in."),
    ("Component", "The name of the unit as it exists in the repository, using the same wording the code uses."),
    ("Location", "The path to the unit, precise enough that someone else can open it without guessing."),
    ("Responsibility", "What the unit is responsible for, in one sentence."),
    ("Dependencies", "What the unit depends on, and what depends on it. Keep both directions."),
    ("Evidence", "How you know: a file path, symbol, test name, or command output."),
    ("Row rules", "Delete the placeholder rows before you hand the document in. Do not invent components to fill the grid."),
    ("Uncertain entries", "If you could not confirm a component, keep the row and mark the evidence as unverified rather than deleting it."),
    ("Scope", "Cover the running application. Build tooling and editor configuration are out of scope unless they affect how the app runs."),
    ("Companion documents", "The guide and the diagram in this task are the place for the narrative; keep this sheet factual."),
]


def calc_styles() -> str:
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles {NS_COMMON} office:version="1.4">
  <office:styles>
    <style:default-style style:family="paragraph">
      <style:text-properties style:font-name="Calibri" fo:font-size="10pt" fo:language="en" fo:country="US"/>
    </style:default-style>
    <style:style style:name="Standard" style:family="paragraph" style:class="text"/>
  </office:styles>
  <office:automatic-styles>
    <style:page-layout style:name="PM1">
      <style:page-layout-properties fo:page-width="21.001cm" fo:page-height="29.7cm" fo:margin-top="2cm" fo:margin-bottom="2cm" fo:margin-left="2cm" fo:margin-right="2cm"/>
    </style:page-layout>
  </office:automatic-styles>
  <office:master-styles>
    <style:master-page style:name="Default" style:page-layout-name="PM1"/>
  </office:master-styles>
</office:document-styles>
"""


def calc_content() -> str:
    out: list[str] = [
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<office:document-content {NS_COMMON} office:version="1.4">\n'
        "  <office:body>\n"
        "    <office:spreadsheet>\n"
    ]

    # Sheet 1: inventory
    out.append('      <table:table table:name="Component inventory" table:style-name="ta1">\n')
    for _, width in INVENTORY_COLUMNS:
        out.append(
            f'        <table:table-column table:style-name="co-{width}" table:default-cell-style-name="Default"/>\n'
        )
    out.append('        <table:table-row table:style-name="ro-head">\n')
    for label, width in INVENTORY_COLUMNS:
        out.append(
            f'          <table:table-cell table:style-name="ce-head-{width}" office:value-type="string">'
            f"<text:p text:style-name=\"P-head\">{esc(label)}</text:p></table:table-cell>\n"
        )
    out.append("        </table:table-row>\n")
    for row in INVENTORY_ROWS:
        out.append('        <table:table-row table:style-name="ro-body">\n')
        for value, width in zip(row, [w for _, w in INVENTORY_COLUMNS]):
            out.append(
                f'          <table:table-cell table:style-name="ce-body-{width}" office:value-type="string">'
                f'<text:p text:style-name="P-body">{esc(value)}</text:p></table:table-cell>\n'
            )
        out.append("        </table:table-row>\n")
    out.append("      </table:table>\n")

    # Sheet 2: how to use
    out.append('      <table:table table:name="How to use" table:style-name="ta1">\n')
    out.append('        <table:table-column table:style-name="co-note" table:default-cell-style-name="Default"/>\n')
    out.append('        <table:table-column table:style-name="co-note-text" table:default-cell-style-name="Default"/>\n')
    out.append('        <table:table-row table:style-name="ro-head">\n')
    out.append(
        '          <table:table-cell table:style-name="ce-head-note" office:value-type="string">'
        '<text:p text:style-name="P-head">Topic</text:p></table:table-cell>\n'
    )
    out.append(
        '          <table:table-cell table:style-name="ce-head-note-text" office:value-type="string">'
        '<text:p text:style-name="P-head">Guidance</text:p></table:table-cell>\n'
    )
    out.append("        </table:table-row>\n")
    for topic, guidance in HOW_TO_USE:
        out.append('        <table:table-row table:style-name="ro-body">\n')
        out.append(
            f'          <table:table-cell table:style-name="ce-body-note" office:value-type="string">'
            f'<text:p text:style-name="P-body-strong">{esc(topic)}</text:p></table:table-cell>\n'
        )
        out.append(
            f'          <table:table-cell table:style-name="ce-body-note-text" office:value-type="string">'
            f'<text:p text:style-name="P-body">{esc(guidance)}</text:p></table:table-cell>\n'
        )
        out.append("        </table:table-row>\n")
    out.append("      </table:table>\n")

    out.append("    </office:spreadsheet>\n  </office:body>\n</office:document-content>\n")
    content = "".join(out)

    # Inject the cell / column / paragraph styles that the sheets reference.
    styles_extra = [
        '  <office:automatic-styles>',
        '    <style:style style:name="ta1" style:family="table">',
        '      <style:table-properties table:display="true" style:writing-mode="lr-tb"/>',
        "    </style:style>",
        '    <style:style style:name="ro-head" style:family="table-row">',
        '      <style:table-row-properties style:min-row-height="0.8cm"/>',
        "    </style:style>",
        '    <style:style style:name="ro-body" style:family="table-row">',
        '      <style:table-row-properties style:min-row-height="0.65cm"/>',
        "    </style:style>",
    ]
    for _, width in INVENTORY_COLUMNS:
        styles_extra.append(f'    <style:style style:name="co-{width}" style:family="table-column">')
        styles_extra.append(
            f'      <style:table-column-properties style:column-width="{width}"/>'
        )
        styles_extra.append("    </style:style>")
    styles_extra += [
        '    <style:style style:name="co-note" style:family="table-column">',
        '      <style:table-column-properties style:column-width="4.5cm"/>',
        "    </style:style>",
        '    <style:style style:name="co-note-text" style:family="table-column">',
        '      <style:table-column-properties style:column-width="12.5cm"/>',
        "    </style:style>",
    ]
    for _, width in INVENTORY_COLUMNS:
        styles_extra.append(f'    <style:style style:name="ce-head-{width}" style:family="table-cell">')
        styles_extra.append(
            '      <style:table-cell-properties fo:background-color="#e8ece9" fo:border="0.5pt solid #8b978f" fo:padding="0.12cm" style:vertical-align="middle"/>'
        )
        styles_extra.append("    </style:style>")
        styles_extra.append(f'    <style:style style:name="ce-body-{width}" style:family="table-cell">')
        styles_extra.append(
            '      <style:table-cell-properties fo:border="0.5pt solid #b6bdb8" fo:padding="0.12cm" style:vertical-align="top"/>'
        )
        styles_extra.append("    </style:style>")
    styles_extra += [
        '    <style:style style:name="ce-head-note" style:family="table-cell">',
        '      <style:table-cell-properties fo:background-color="#e8ece9" fo:border="0.5pt solid #8b978f" fo:padding="0.12cm" style:vertical-align="middle"/>',
        "    </style:style>",
        '    <style:style style:name="ce-head-note-text" style:family="table-cell">',
        '      <style:table-cell-properties fo:background-color="#e8ece9" fo:border="0.5pt solid #8b978f" fo:padding="0.12cm" style:vertical-align="middle"/>',
        "    </style:style>",
        '    <style:style style:name="ce-body-note" style:family="table-cell">',
        '      <style:table-cell-properties fo:border="0.5pt solid #b6bdb8" fo:padding="0.12cm" style:vertical-align="top"/>',
        "    </style:style>",
        '    <style:style style:name="ce-body-note-text" style:family="table-cell">',
        '      <style:table-cell-properties fo:border="0.5pt solid #b6bdb8" fo:padding="0.12cm" style:vertical-align="top"/>',
        "    </style:style>",
        '    <style:style style:name="P-head" style:family="paragraph" style:parent-style-name="Standard">',
        '      <style:text-properties fo:font-weight="bold" fo:color="#25332a"/>',
        "    </style:style>",
        '    <style:style style:name="P-body" style:family="paragraph" style:parent-style-name="Standard">',
        '      <style:text-properties fo:color="#333333"/>',
        "    </style:style>",
        '    <style:style style:name="P-body-strong" style:family="paragraph" style:parent-style-name="Standard">',
        '      <style:text-properties fo:font-weight="bold" fo:color="#25332a"/>',
        "    </style:style>",
        "  </office:automatic-styles>",
    ]

    block = "\n".join(styles_extra) + "\n"
    marker = "  <office:body>"
    idx = content.index(marker)
    content = content[:idx] + block + content[idx:]
    return content


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    write_package(
        os.path.join(OUT_DIR, "onboarding-guide-template.odt"),
        "odt",
        writer_content(),
        writer_styles(),
        "Forgeboard onboarding guide (template)",
    )
    write_package(
        os.path.join(OUT_DIR, "architecture-template.odg"),
        "odg",
        draw_content(),
        draw_styles(),
        "Forgeboard architecture (template)",
    )
    write_package(
        os.path.join(OUT_DIR, "component-inventory-template.ods"),
        "ods",
        calc_content(),
        calc_styles(),
        "Forgeboard component inventory (template)",
    )


if __name__ == "__main__":
    main()
