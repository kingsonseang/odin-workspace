#!/usr/bin/env python3
"""Generate an editable OpenDocument Text (.odt) release report template."""

import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "traige-ci" / "task-inputs" / "release-report-template.odt"

NS = (
    'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" '
    'xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" '
    'xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" '
    'xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" '
    'xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" '
    'xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" '
    'xmlns:number="urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0" '
    'xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0" '
    'xmlns:dc="http://purl.org/dc/elements/1.1/"'
)

MIMETYPE = "application/vnd.oasis.opendocument.text"

MANIFEST = """<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.4">
 <manifest:file-entry manifest:full-path="/" manifest:version="1.4" manifest:media-type="application/vnd.oasis.opendocument.text"/>
 <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
 <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
 <manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
 <manifest:file-entry manifest:full-path="settings.xml" manifest:media-type="text/xml"/>
</manifest:manifest>
"""

META = """<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta {ns} office:version="1.4">
 <office:meta>
  <dc:title>Trailhead 0.9.3 - Release report</dc:title>
  <dc:subject>Triage of the failing CI run #2841</dc:subject>
  <meta:initial-creator>Trailhead release tooling</meta:initial-creator>
  <dc:creator>Trailhead release tooling</dc:creator>
  <meta:generator>Trailhead release tooling</meta:generator>
  <meta:creation-date>2026-03-11T07:15:00</meta:creation-date>
  <meta:editing-cycles>1</meta:editing-cycles>
 </office:meta>
</office:document-meta>
""".format(ns=NS)

SETTINGS = """<?xml version="1.0" encoding="UTF-8"?>
<office:document-settings {ns} office:version="1.4">
 <office:settings>
  <config:config-item-set xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0" config:name="ooo:configuration-settings">
   <config:config-item config:name="LoadReadonly" config:type="boolean">false</config:config-item>
  </config:config-item-set>
 </office:settings>
</office:document-settings>
""".format(ns=NS)


def build_styles():
    return """<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles {ns} office:version="1.4">
 <office:font-face-decls>
  <style:font-face style:name="Liberation Serif" svg:font-family="&apos;Liberation Serif&apos;,Times New Roman,serif" style:font-family-generic="roman" style:font-pitch="variable"/>
  <style:font-face style:name="Liberation Sans" svg:font-family="&apos;Liberation Sans&apos;,Arial,Helvetica,sans-serif" style:font-family-generic="swiss" style:font-pitch="variable"/>
 </office:font-face-decls>
 <office:styles>
  <style:default-style style:family="paragraph">
   <style:paragraph-properties fo:hyphenate="false" style:line-height="115%" fo:text-align="left" style:writing-mode="lr-tb"/>
   <style:text-properties style:font-name="Liberation Serif" fo:font-size="11pt" fo:language="en" fo:country="GB"/>
  </style:default-style>
  <style:style style:name="Standard" style:family="paragraph" style:class="text">
   <style:paragraph-properties fo:margin-top="0in" fo:margin-bottom="0.08in" fo:line-height="115%"/>
   <style:text-properties fo:font-size="11pt"/>
  </style:style>
  <style:style style:name="Text_20_body" style:display-name="Text body" style:family="paragraph" style:parent-style-name="Standard">
   <style:paragraph-properties fo:margin-bottom="0.08in"/>
  </style:style>
  <style:style style:name="Title" style:family="paragraph" style:parent-style-name="Standard">
   <style:paragraph-properties fo:margin-top="0in" fo:margin-bottom="0.12in" fo:text-align="left"/>
   <style:text-properties fo:font-size="20pt" fo:font-weight="bold" style:font-name="Liberation Sans"/>
  </style:style>
  <style:style style:name="Subtitle" style:family="paragraph" style:parent-style-name="Standard">
   <style:paragraph-properties fo:margin-bottom="0.18in"/>
   <style:text-properties fo:font-size="11pt" fo:color="#4d4d4d" style:font-name="Liberation Sans"/>
  </style:style>
  <style:style style:name="Heading" style:family="paragraph" style:parent-style-name="Standard">
   <style:paragraph-properties fo:margin-top="0.24in" fo:margin-bottom="0.08in" fo:keep-with-next="always"/>
   <style:text-properties fo:font-size="14pt" fo:font-weight="bold" style:font-name="Liberation Sans"/>
  </style:style>
  <style:style style:name="Heading_20_1" style:display-name="Heading 1" style:family="paragraph" style:parent-style-name="Heading">
   <style:paragraph-properties fo:margin-top="0.26in" fo:margin-bottom="0.08in" fo:outline-level="1"/>
   <style:text-properties fo:font-size="14pt" fo:font-weight="bold" style:font-name="Liberation Sans"/>
  </style:style>
  <style:style style:name="Heading_20_2" style:display-name="Heading 2" style:family="paragraph" style:parent-style-name="Heading">
   <style:paragraph-properties fo:margin-top="0.18in" fo:margin-bottom="0.06in" fo:outline-level="2"/>
   <style:text-properties fo:font-size="12pt" fo:font-weight="bold" style:font-name="Liberation Sans"/>
  </style:style>
  <style:style style:name="Instruction" style:family="paragraph" style:parent-style-name="Standard">
   <style:paragraph-properties fo:margin-bottom="0.12in"/>
   <style:text-properties fo:font-style="italic" fo:color="#767171" fo:font-size="10pt"/>
  </style:style>
  <style:style style:name="Table_20_Contents" style:display-name="Table Contents" style:family="paragraph" style:parent-style-name="Standard">
   <style:paragraph-properties fo:margin-top="0.03in" fo:margin-bottom="0.03in"/>
   <style:text-properties fo:font-size="10pt"/>
  </style:style>
  <style:style style:name="Table_20_Heading" style:display-name="Table Heading" style:family="paragraph" style:parent-style-name="Standard">
   <style:paragraph-properties fo:margin-top="0.03in" fo:margin-bottom="0.03in"/>
   <style:text-properties fo:font-size="10pt" fo:font-weight="bold"/>
  </style:style>
 </office:styles>
 <office:automatic-styles>
  <style:page-layout style:name="PL1">
   <style:page-layout-properties fo:page-width="8.27in" fo:page-height="11.69in" fo:margin-top="0.79in" fo:margin-bottom="0.79in" fo:margin-left="0.79in" fo:margin-right="0.79in" style:print-orientation="portrait"/>
  </style:page-layout>
  <style:style style:name="TblCell" style:family="table-cell">
   <style:table-cell-properties fo:border="0.5pt solid #808080" fo:padding="0.05cm" fo:padding-top="0.04cm"/>
  </style:style>
  <style:style style:name="TblHeadCell" style:family="table-cell">
   <style:table-cell-properties fo:border="0.5pt solid #808080" fo:padding="0.05cm" fo:padding-top="0.04cm" fo:background-color="#eeeeee"/>
  </style:style>
 </office:automatic-styles>
 <office:master-styles>
  <style:master-page style:name="Standard" style:page-layout-name="PL1"/>
 </office:master-styles>
</office:document-styles>
""".format(ns=NS)


def h(level, text):
    return ('<text:h text:style-name="Heading_20_{level}" text:outline-level="{level}">{text}</text:h>'
            ).format(level=level, text=text)


def p(text="", style="Text_20_body"):
    if text == "":
        return '<text:p text:style-name="%s"/>' % style
    return '<text:p text:style-name="%s">%s</text:p>' % (style, text)


def instruction(text):
    return p(text, "Instruction")


def table(name, headers, widths, rows):
    """rows: list of list of str (empty string = blank cell)."""
    total = sum(widths)
    page = 6.69  # usable width in inches
    cols = "".join(
        '<table:table-column table:style-name="{name}.{col}" table:number-columns-repeated="1"/>'.format(
            name=name, col=chr(ord("A") + i))
        for i in range(len(widths))
    )
    body = []
    for r in rows:
        cells = "".join(
            '<table:table-cell table:style-name="TblCell" office:value-type="string">'
            '<text:p text:style-name="Table_20_Contents"/></table:table-cell>'
            for _ in r
        )
        body.append("<table:table-row>%s</table:table-row>" % cells)
    head_cells = "".join(
        '<table:table-cell table:style-name="TblHeadCell" office:value-type="string">'
        '<text:p text:style-name="Table_20_Heading">%s</text:p></table:table-cell>' % header
        for header in headers
    )
    return (
        '<table:table table:name="{name}" table:style-name="{name}">'
        '{cols}'
        '<table:table-header-rows><table:table-row>{head}</table:table-row></table:table-header-rows>'
        '{body}'
        '</table:table>'
    ).format(name=name, cols=cols, head=head_cells, body="".join(body))


def blank_rows(count, columns):
    return [[""] * columns for _ in range(count)]


def build_content():
    parts = []

    parts.append(p("Trailhead 0.9.3 - Release report", "Title"))
    parts.append(p("Build 0.9.3 | pipeline run #2841 | commit a71f0c2 | template version 1.0", "Subtitle"))
    parts.append(instruction("This template is the release report required by "
                              "task-inputs/release-criteria.md. Replace the italic hints with the "
                              "result of the work. The analysis and the decision are left blank on "
                              "purpose."))

    # 1 - Document control
    parts.append(h(1, "1. Document control"))
    parts.append(table(
        "TblControl",
        ["Field", "Value"],
        [2.0, 4.5],
        [["Build", "0.9.3"], ["Pipeline run", "#2841"], ["Commit under review", "a71f0c2"],
         ["Author of this report", ""], ["Date", ""], ["Reviewer", ""],
         ["Release decision (go / no-go)", ""]],
    ))
    parts.append(p())

    # 2 - Failure summary
    parts.append(h(1, "2. Failure summary"))
    parts.append(instruction("Summarise what run #2841 reported: how many tests failed, in "
                              "which files, and what the failures look like at a glance. No "
                              "causes here."))
    parts.append(table(
        "TblSummary",
        ["#", "Failing test", "File", "Job", "Disposition"],
        [0.4, 2.6, 1.9, 1.0, 1.3],
        blank_rows(10, 5),
    ))
    parts.append(p())

    # 3 - Root cause analysis
    parts.append(h(1, "3. Root-cause analysis"))
    parts.append(instruction("One row per failing test of run #2841. State how the failure was "
                              "investigated, what the cause is, and the evidence for it. Keep the "
                              "evidence concrete: file, line, command, observation."))
    parts.append(table(
        "TblCause",
        ["Failing test", "Cause category", "Cause", "Evidence", "Change"],
        [1.9, 1.3, 1.6, 1.7, 1.3],
        blank_rows(10, 5),
    ))
    parts.append(p())
    parts.append(h(2, "3.1 Investigation notes"))
    parts.append(instruction("How the failures were reproduced, which commands were used, and "
                              "what ruled a cause out."))
    parts.append(p())

    # 4 - Changes made
    parts.append(h(1, "4. Changes made"))
    parts.append(instruction("Every change to the repository, with the reason and the test that "
                              "covers it. Include changes to tests and to the release criteria "
                              "themselves."))
    parts.append(table(
        "TblChanges",
        ["File", "Change", "Reason", "Test that covers it"],
        [1.8, 2.4, 1.6, 1.5],
        blank_rows(8, 4),
    ))
    parts.append(p())

    # 5 - Verification results
    parts.append(h(1, "5. Verification results"))
    parts.append(instruction("The commands of section E of the release criteria, with their "
                              "result. A criterion that is not met is named with the reason."))
    parts.append(table(
        "TblVerification",
        ["Criterion", "Command", "Result", "Notes"],
        [1.3, 2.2, 1.4, 2.4],
        blank_rows(8, 4),
    ))
    parts.append(p())

    # 6 - Unresolved issues
    parts.append(h(1, "6. Unresolved issues"))
    parts.append(instruction("Everything that is still open after the work, including the "
                              "incidents that are not fixed in this release and the risks that "
                              "were accepted."))
    parts.append(table(
        "TblOpen",
        ["ID", "Description", "Owner", "Target release"],
        [0.9, 3.9, 1.2, 1.3],
        blank_rows(6, 4),
    ))
    parts.append(p())

    # 7 - Release recommendation
    parts.append(h(1, "7. Release recommendation"))
    parts.append(instruction("The decision, the reasoning behind it and what has to happen "
                              "before or after the release."))
    parts.append(p("Decision", "Table_20_Heading"))
    parts.append(p())
    parts.append(p("Reasoning", "Table_20_Heading"))
    parts.append(p())
    parts.append(p("Conditions, follow-up and rollback", "Table_20_Heading"))
    parts.append(p())

    # 8 - Sign off
    parts.append(h(1, "8. Sign-off"))
    parts.append(table(
        "TblSignoff",
        ["Role", "Name", "Date", "Signature"],
        [1.6, 2.0, 1.4, 2.3],
        [["Engineer", "", "", ""], ["Reviewer", "", "", ""], ["Release manager", "", "", ""]],
    ))

    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<office:document-content {ns} office:version="1.4">\n'
        ' <office:scripts/>\n'
        ' <office:font-face-decls>\n'
        '  <style:font-face style:name="Liberation Serif" svg:font-family="&apos;Liberation Serif&apos;,Times New Roman,serif" style:font-family-generic="roman" style:font-pitch="variable"/>\n'
        '  <style:font-face style:name="Liberation Sans" svg:font-family="&apos;Liberation Sans&apos;,Arial,Helvetica,sans-serif" style:font-family-generic="swiss" style:font-pitch="variable"/>\n'
        ' </office:font-face-decls>\n'
        ' <office:automatic-styles>\n'
        '  <style:style style:name="TblCell" style:family="table-cell">\n'
        '   <style:table-cell-properties fo:border="0.5pt solid #808080" fo:padding="0.05cm" fo:padding-top="0.04cm"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblHeadCell" style:family="table-cell">\n'
        '   <style:table-cell-properties fo:border="0.5pt solid #808080" fo:padding="0.05cm" fo:padding-top="0.04cm" fo:background-color="#eeeeee"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblSummary.A" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="0.4in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblSummary.B" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="2.6in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblSummary.C" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="1.9in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblSummary.D" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="1.0in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblSummary.E" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="1.3in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblCause.A" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="1.9in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblCause.B" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="1.3in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblCause.C" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="1.6in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblCause.D" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="1.7in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblCause.E" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="1.3in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblChanges.A" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="1.8in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblChanges.B" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="2.4in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblChanges.C" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="1.6in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblChanges.D" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="1.5in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblVerification.A" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="1.3in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblVerification.B" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="2.2in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblVerification.C" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="1.4in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblVerification.D" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="2.4in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblOpen.A" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="0.9in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblOpen.B" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="3.9in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblOpen.C" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="1.2in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblOpen.D" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="1.3in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblControl.A" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="2.0in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblControl.B" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="4.5in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblSignoff.A" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="1.6in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblSignoff.B" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="2.0in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblSignoff.C" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="1.4in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblSignoff.D" style:family="table-column">\n'
        '   <style:table-column-properties style:column-width="2.3in"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblSummary" style:family="table">\n'
        '   <style:table-properties table:display="true" style:write-protection="none"/>\n'
        '   <style:table-column-properties style:use-optimal-column-width="true"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblCause" style:family="table">\n'
        '   <style:table-properties table:display="true" style:write-protection="none"/>\n'
        '   <style:table-column-properties style:use-optimal-column-width="true"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblChanges" style:family="table">\n'
        '   <style:table-properties table:display="true" style:write-protection="none"/>\n'
        '   <style:table-column-properties style:use-optimal-column-width="true"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblVerification" style:family="table">\n'
        '   <style:table-properties table:display="true" style:write-protection="none"/>\n'
        '   <style:table-column-properties style:use-optimal-column-width="true"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblOpen" style:family="table">\n'
        '   <style:table-properties table:display="true" style:write-protection="none"/>\n'
        '   <style:table-column-properties style:use-optimal-column-width="true"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblControl" style:family="table">\n'
        '   <style:table-properties table:display="true" style:write-protection="none"/>\n'
        '   <style:table-column-properties style:use-optimal-column-width="true"/>\n'
        '  </style:style>\n'
        '  <style:style style:name="TblSignoff" style:family="table">\n'
        '   <style:table-properties table:display="true" style:write-protection="none"/>\n'
        '   <style:table-column-properties style:use-optimal-column-width="true"/>\n'
        '  </style:style>\n'
        ' </office:automatic-styles>\n'
        ' <office:body><office:text>{content}</office:text></office:body>\n'
        '</office:document-content>\n'
    ).format(ns=NS, content="".join(parts))


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    if OUT.exists():
        OUT.unlink()

    with zipfile.ZipFile(OUT, "w") as zf:
        # mimetype must be the first entry and must be stored uncompressed
        zf.writestr(zipfile.ZipInfo("mimetype"), MIMETYPE, compress_type=zipfile.ZIP_STORED)
        zf.writestr("META-INF/manifest.xml", MANIFEST, compress_type=zipfile.ZIP_DEFLATED)
        zf.writestr("content.xml", build_content(), compress_type=zipfile.ZIP_DEFLATED)
        zf.writestr("styles.xml", build_styles(), compress_type=zipfile.ZIP_DEFLATED)
        zf.writestr("meta.xml", META, compress_type=zipfile.ZIP_DEFLATED)
        zf.writestr("settings.xml", SETTINGS, compress_type=zipfile.ZIP_DEFLATED)

    print("written:", OUT, OUT.stat().st_size, "bytes")


if __name__ == "__main__":
    main()
