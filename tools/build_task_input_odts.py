#!/usr/bin/env python3
from __future__ import annotations

import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

OUT = Path(__file__).resolve().parent.parent / "git-feat-branch" / "task-inputs"

NS = {
    "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
    "style": "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
    "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
    "fo": "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
    "svg": "urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0",
    "meta": "urn:oasis:names:tc:opendocument:xmlns:meta:1.0",
    "dc": "http://purl.org/dc/elements/1.1/",
    "xlink": "http://www.w3.org/1999/xlink",
    "number": "urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0",
    "manifest": "urn:oasis:names:tc:opendocument:xmlns:manifest:1.0",
}

XMLNS = " ".join(f'xmlns:{prefix}="{uri}"' for prefix, uri in NS.items())
GENERATION_DATE = "2026-10-21T12:00:00Z"
ZIP_DATE = (2026, 10, 21, 12, 0, 0)


def font_face_decls() -> str:
    return """  <office:font-face-decls>
    <style:font-face style:name="Liberation Sans" svg:font-family="'Liberation Sans'" style:font-family-generic="swiss" style:font-pitch="variable"/>
    <style:font-face style:name="Liberation Serif" svg:font-family="'Liberation Serif'" style:font-family-generic="roman" style:font-pitch="variable"/>
  </office:font-face-decls>
"""


def styles_xml() -> str:
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles {XMLNS} office:version="1.4">
{font_face_decls()}  <office:styles>
    <style:default-style style:family="paragraph">
      <style:paragraph-properties fo:orphans="2" fo:widows="2"/>
      <style:text-properties style:font-name="Liberation Sans" fo:font-size="10.5pt" fo:color="#17221c" fo:language="en" fo:country="US"/>
    </style:default-style>
    <style:default-style style:family="table-cell">
      <style:table-cell-properties fo:padding="0.05in"/>
    </style:default-style>
    <style:style style:name="Standard" style:family="paragraph" style:class="text">
      <style:paragraph-properties fo:margin-top="0in" fo:margin-bottom="0.09in"/>
    </style:style>
    <style:style style:name="Title" style:family="paragraph" style:parent-style-name="Standard" style:class="extra">
      <style:paragraph-properties fo:margin-top="0in" fo:margin-bottom="0.05in"/>
      <style:text-properties style:font-name="Liberation Serif" fo:font-size="26pt" fo:font-weight="bold" fo:color="#1f3a2d"/>
    </style:style>
    <style:style style:name="Subtitle" style:family="paragraph" style:parent-style-name="Standard" style:class="extra">
      <style:paragraph-properties fo:margin-bottom="0.2in"/>
      <style:text-properties fo:font-size="11pt" fo:font-style="italic" fo:color="#53645a"/>
    </style:style>
    <style:style style:name="Heading1" style:family="paragraph" style:parent-style-name="Standard" style:next-style-name="Body" style:class="text">
      <style:paragraph-properties fo:margin-top="0.28in" fo:margin-bottom="0.08in" fo:keep-with-next="always" fo:border-bottom="0.7pt solid #b9c7bc" fo:padding-bottom="0.04in"/>
      <style:text-properties style:font-name="Liberation Sans" fo:font-size="15pt" fo:font-weight="bold" fo:color="#254d39"/>
    </style:style>
    <style:style style:name="Heading2" style:family="paragraph" style:parent-style-name="Standard" style:next-style-name="Body" style:class="text">
      <style:paragraph-properties fo:margin-top="0.18in" fo:margin-bottom="0.06in" fo:keep-with-next="always"/>
      <style:text-properties fo:font-size="11.5pt" fo:font-weight="bold" fo:color="#17221c"/>
    </style:style>
    <style:style style:name="Body" style:family="paragraph" style:parent-style-name="Standard" style:class="text">
      <style:paragraph-properties fo:margin-bottom="0.08in"/>
    </style:style>
    <style:style style:name="Note" style:family="paragraph" style:parent-style-name="Standard" style:class="text">
      <style:paragraph-properties fo:margin-top="0.08in" fo:margin-bottom="0.18in" fo:border-left="3pt solid #4d7c5f" fo:padding-left="0.1in" fo:padding-top="0.06in" fo:padding-bottom="0.06in" fo:background-color="#eef4ee"/>
      <style:text-properties fo:font-size="9.5pt" fo:font-style="italic" fo:color="#3f5548"/>
    </style:style>
    <style:style style:name="Checkbox" style:family="paragraph" style:parent-style-name="Standard" style:class="list">
      <style:paragraph-properties fo:margin-left="0.28in" fo:text-indent="-0.28in" fo:margin-bottom="0.07in"/>
      <style:text-properties style:font-name="Liberation Sans" fo:font-size="10.5pt"/>
    </style:style>
    <style:style style:name="FieldLine" style:family="paragraph" style:parent-style-name="Standard" style:class="text">
      <style:paragraph-properties fo:margin-top="0.08in" fo:margin-bottom="0.28in"/>
    </style:style>
    <style:style style:name="RuleText" style:family="text">
      <style:text-properties fo:color="#c5d0c7" fo:text-underline-style="solid" fo:text-underline-width="0.5pt" fo:text-underline-color="#c5d0c7"/>
    </style:style>
    <style:style style:name="Footer" style:family="paragraph" style:parent-style-name="Standard" style:class="extra">
      <style:paragraph-properties fo:margin-top="0in" fo:margin-bottom="0in"/>
      <style:text-properties fo:font-size="8pt" fo:color="#738077"/>
    </style:style>
  </office:styles>
  <office:automatic-styles>
    <style:page-layout style:name="pm1">
      <style:page-layout-properties fo:page-width="8.5in" fo:page-height="11in" style:print-orientation="portrait" fo:margin-top="0.85in" fo:margin-bottom="0.8in" fo:margin-left="1in" fo:margin-right="1in" style:writing-mode="lr-tb"/>
      <style:footer-style>
        <style:header-footer-properties fo:min-height="0.22in" fo:margin-top="0.14in"/>
      </style:footer-style>
    </style:page-layout>
  </office:automatic-styles>
  <office:master-styles>
    <style:master-page style:name="Standard" style:page-layout-name="pm1">
      <style:footer>
        <text:p text:style-name="Footer">Taskline task inputs · complete from final-branch evidence</text:p>
      </style:footer>
    </style:master-page>
  </office:master-styles>
</office:document-styles>
'''


def p(text: str = "", style: str = "Body") -> str:
    content = escape(text) if text else "&#160;"
    return f'<text:p text:style-name="{style}">{content}</text:p>'


def h(text: str, level: int = 1) -> str:
    style = "Heading1" if level == 1 else "Heading2"
    return f'<text:h text:style-name="{style}" text:outline-level="{level}">{escape(text)}</text:h>'


def blank_lines(count: int) -> str:
    rule = "\u00a0" * 142
    return "\n".join(
        f'<text:p text:style-name="FieldLine">'
        f'<text:span text:style-name="RuleText">{rule}</text:span>'
        f"</text:p>"
        for _ in range(count)
    )


def content_xml(title: str, subtitle: str, body: str) -> str:
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<office:document-content {XMLNS} office:version="1.4">
{font_face_decls()}  <office:automatic-styles/>
  <office:body>
    <office:text>
      {p(title, "Title")}
      {p(subtitle, "Subtitle")}
      {body}
    </office:text>
  </office:body>
</office:document-content>
'''


def meta_xml(title: str) -> str:
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta {XMLNS} office:version="1.4">
  <office:meta>
    <meta:generator>Taskline task-input generator</meta:generator>
    <dc:title>{escape(title)}</dc:title>
    <dc:subject>Taskline production-release input template</dc:subject>
    <meta:creation-date>{GENERATION_DATE}</meta:creation-date>
  </office:meta>
</office:document-meta>
'''


def settings_xml() -> str:
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<office:document-settings {XMLNS} office:version="1.4">
  <office:settings/>
</office:document-settings>
'''


def manifest_xml() -> str:
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="{NS["manifest"]}" manifest:version="1.4">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.4" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="settings.xml" manifest:media-type="text/xml"/>
</manifest:manifest>
'''


def write_odt(path: Path, title: str, subtitle: str, body: str) -> None:
    entries = {
        "content.xml": content_xml(title, subtitle, body),
        "styles.xml": styles_xml(),
        "meta.xml": meta_xml(title),
        "settings.xml": settings_xml(),
        "META-INF/manifest.xml": manifest_xml(),
    }
    with zipfile.ZipFile(path, "w") as archive:
        mimetype = zipfile.ZipInfo("mimetype", date_time=ZIP_DATE)
        mimetype.compress_type = zipfile.ZIP_STORED
        archive.writestr(
            mimetype, "application/vnd.oasis.opendocument.text"
        )
        for name, content in entries.items():
            info = zipfile.ZipInfo(name, date_time=ZIP_DATE)
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, content.encode("utf-8"))


pr_sections = [
    "Summary",
    "Implementation details",
    "Conflict resolution",
    "Testing performed",
    "Screenshots or verification evidence",
    "Outstanding risks",
]

pr_body = p(
    "Complete every section before requesting review. Leave a section blank until the corresponding work and evidence exist.",
    "Note",
)
for section in pr_sections:
    pr_body += f"\n      {h(section, 2)}\n      {blank_lines(3)}"

write_odt(
    OUT / "pull-request-template.odt",
    "Taskline Pull Request",
    "Feature integration for production release",
    pr_body,
)


def check(text: str) -> str:
    return p(f"☐  {text}", "Checkbox")


checklist_groups = [
    (
        "Code review",
        [
            "The final integrated diff has been reviewed by a second engineer.",
            "Behavior matches the feature specification and acceptance criteria.",
            "Integration and conflict-resolution changes have been reviewed for unintended side effects.",
            "No unresolved conflict markers remain in tracked source files.",
        ],
    ),
    (
        "Automated tests",
        [
            "The complete automated test suite has been run.",
            "No automated tests are failing or skipped.",
            "Coverage includes combined search, status, and priority filtering.",
            "Coverage includes partial and atomic task edits.",
            "API coverage includes invalid filters, unknown tasks, and invalid updates.",
            "The regression scenario has an automated test where appropriate.",
        ],
    ),
    (
        "Type checks and build",
        [
            "The TypeScript check completes without errors.",
            "The production build completes successfully.",
            "Any configured lint or formatting checks complete without errors.",
        ],
    ),
    (
        "Browser verification",
        [
            "The board loads with the seeded tasks and default filters.",
            "Search covers title and description, including multi-term queries.",
            "Search, status, and priority filters combine correctly.",
            "Inline priority editing persists and immediately updates the filtered view.",
            "Active filters remain unchanged when an edit removes a task from view.",
            "A task that still matches remains visible after an edit.",
            "Blank titles are rejected with a visible error and the previous title remains.",
            "Clear filters restores the full board and resets all filter controls.",
            "Result counts and the empty state match the visible tasks.",
            "The combined-filter and API steps in regression-scenario.md have been executed.",
        ],
    ),
    (
        "Known risks",
        [
            "Known risks and limitations are documented in the pull request.",
            "Every outstanding risk has an owner and a follow-up action.",
            "Any unverified item is called out rather than marked complete.",
        ],
    ),
]

checklist_body = p(
    "Mark each box only after verifying the item on the final integrated branch. Record evidence and any exceptions in the notes area below the checklist.",
    "Note",
)
for heading, items in checklist_groups:
    checklist_body += f"\n      {h(heading, 2)}\n"
    for item in items:
        checklist_body += "      " + check(item) + "\n"
    if heading == "Known risks":
        checklist_body += "      " + blank_lines(4) + "\n"

checklist_body += f"\n      {h('Verification evidence and notes', 2)}\n      {blank_lines(5)}"

write_odt(
    OUT / "release-checklist-template.odt",
    "Taskline Release Checklist",
    "Production release review · all boxes start unchecked",
    checklist_body,
)

print("Wrote pull-request-template.odt and release-checklist-template.odt")
