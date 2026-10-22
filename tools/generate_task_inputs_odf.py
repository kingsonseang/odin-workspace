from __future__ import annotations

import html
import os
import zipfile
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "test-plan-defect-regression" / "task-inputs"
OUT.mkdir(parents=True, exist_ok=True)

NS = {
    'office': 'urn:oasis:names:tc:opendocument:xmlns:office:1.0',
    'style': 'urn:oasis:names:tc:opendocument:xmlns:style:1.0',
    'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0',
    'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
    'fo': 'urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0',
    'number': 'urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0',
    'svg': 'urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0',
    'meta': 'urn:oasis:names:tc:opendocument:xmlns:meta:1.0',
    'dc': 'http://purl.org/dc/elements/1.1/',
    'manifest': 'urn:oasis:names:tc:opendocument:xmlns:manifest:1.0',
    'config': 'urn:oasis:names:tc:opendocument:xmlns:config:1.0',
}

XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>\n'


def ns_attrs(include_manifest: bool = False, include_config: bool = False) -> str:
    parts = []
    for key, value in NS.items():
        if key == 'manifest' and not include_manifest:
            continue
        if key == 'config' and not include_config:
            continue
        parts.append(f'xmlns:{key}="{value}"')
    return ' '.join(parts)


def esc(value: str) -> str:
    return html.escape(value, quote=False)


def write_odf(path: Path, media_type: str, files: dict[str, str]) -> None:
    manifest = f'''{XML_HEADER}<manifest:manifest xmlns:manifest="{NS['manifest']}" manifest:version="1.4">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.4" manifest:media-type="{media_type}"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="settings.xml" manifest:media-type="text/xml"/>
</manifest:manifest>
'''
    with zipfile.ZipFile(path, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr('mimetype', media_type, compress_type=zipfile.ZIP_STORED)
        archive.writestr('content.xml', files['content.xml'], compress_type=zipfile.ZIP_DEFLATED)
        archive.writestr('styles.xml', files['styles.xml'], compress_type=zipfile.ZIP_DEFLATED)
        archive.writestr('meta.xml', files['meta.xml'], compress_type=zipfile.ZIP_DEFLATED)
        archive.writestr('settings.xml', files['settings.xml'], compress_type=zipfile.ZIP_DEFLATED)
        archive.writestr('META-INF/manifest.xml', manifest, compress_type=zipfile.ZIP_DEFLATED)


# ---------------------------------------------------------------------------
# Shared styles
# ---------------------------------------------------------------------------

def styles_xml(landscape: bool = False) -> str:
    if landscape:
        page_layout = '''
    <style:page-layout style:name="pm1">
      <style:page-layout-properties fo:page-width="29.7cm" fo:page-height="21cm" style:print-orientation="landscape" fo:margin-top="1.5cm" fo:margin-bottom="1.5cm" fo:margin-left="1.5cm" fo:margin-right="1.5cm"/>
    </style:page-layout>'''
        master_page = '''
  <style:master-page style:name="Default" style:page-layout-name="pm1"/>'''
    else:
        page_layout = '''
    <style:page-layout style:name="pm1">
      <style:page-layout-properties fo:page-width="21cm" fo:page-height="29.7cm" style:print-orientation="portrait" fo:margin-top="2.1cm" fo:margin-bottom="2.1cm" fo:margin-left="2.2cm" fo:margin-right="2.2cm"/>
    </style:page-layout>'''
        master_page = '''
  <style:master-page style:name="Default" style:page-layout-name="pm1"/>'''

    return f'''{XML_HEADER}<office:document-styles {ns_attrs()} office:version="1.4">
  <office:font-face-decls>
    <style:font-face style:name="Liberation Sans" svg:font-family="'Liberation Sans'" style:font-family-generic="swiss" style:font-pitch="variable"/>
    <style:font-face style:name="Liberation Serif" svg:font-family="'Liberation Serif'" style:font-family-generic="roman" style:font-pitch="variable"/>
  </office:font-face-decls>
  <office:styles>
    <style:default-style style:family="paragraph">
      <style:paragraph-properties fo:line-height="130%" fo:margin-top="0cm" fo:margin-bottom="0.2cm"/>
      <style:text-properties style:font-name="Liberation Sans" fo:font-size="10pt" fo:color="#1D2922"/>
    </style:default-style>
    <style:default-style style:family="table-cell">
      <style:table-cell-properties fo:padding="0.08cm" style:vertical-align="middle"/>
    </style:default-style>
    <style:style style:name="Standard" style:family="paragraph" style:class="text"/>
  </office:styles>
  <office:automatic-styles>__PAGE_LAYOUT__</office:automatic-styles>
  <office:master-styles>{master_page}
  </office:master-styles>
</office:document-styles>
'''.replace('__PAGE_LAYOUT__', page_layout)


def settings_xml() -> str:
    return f'''{XML_HEADER}<office:document-settings {ns_attrs(include_config=True)} office:version="1.4">
  <office:settings/>
</office:document-settings>
'''


def meta_xml(title: str, subject: str) -> str:
    return f'''{XML_HEADER}<office:document-meta {ns_attrs()} office:version="1.4">
  <office:meta>
    <dc:title>{esc(title)}</dc:title>
    <dc:subject>{esc(subject)}</dc:subject>
    <dc:creator>Tasklane synthetic fixture</dc:creator>
    <meta:generator>Tasklane fixture document generator</meta:generator>
    <meta:creation-date>2026-10-21T16:00:00</meta:creation-date>
  </office:meta>
</office:document-meta>
'''


# ---------------------------------------------------------------------------
# Shared spreadsheet building blocks
# ---------------------------------------------------------------------------

DEFECTS = [
    ('BUG-1042', 'Title of exactly 80 characters is rejected'),
    ('BUG-1047', 'Status and priority filters return too many tasks'),
    ('BUG-1051', 'Tasks without due dates appear first in due-date sort'),
    ('BUG-1056', 'Details panel shows an outdated status after completing from the list'),
    ('BUG-1061', 'Editing from the details panel can reverse a completion'),
    ('BUG-1067', 'An existing task can be saved with a blank title'),
]

# Cell styles carry the character formatting. LibreOffice Calc only honours
# text properties that live inside a table-cell style, not paragraph styles.
CELL_STYLES = '''
    <style:style style:name="ceTitle" style:family="table-cell">
      <style:table-cell-properties fo:background-color="#24604A" fo:padding="0.18cm" fo:border="none" style:wrap-option="wrap" style:vertical-align="middle"/>
      <style:paragraph-properties fo:margin="0cm"/>
      <style:text-properties style:font-name="Liberation Serif" fo:font-size="16pt" fo:font-weight="bold" fo:color="#FFFFFF"/>
    </style:style>
    <style:style style:name="ceNote" style:family="table-cell">
      <style:table-cell-properties fo:background-color="#EDF2EE" fo:padding="0.16cm" fo:border="0.5pt solid #D4DDD7" style:wrap-option="wrap" style:vertical-align="middle"/>
      <style:paragraph-properties fo:margin="0cm"/>
      <style:text-properties style:font-name="Liberation Sans" fo:font-size="9pt" fo:color="#4D5C54"/>
    </style:style>
    <style:style style:name="ceHeader" style:family="table-cell">
      <style:table-cell-properties fo:background-color="#E2EBE5" fo:padding="0.12cm" fo:border="0.5pt solid #C8D3CB" style:wrap-option="wrap" style:vertical-align="middle"/>
      <style:paragraph-properties fo:margin="0cm"/>
      <style:text-properties style:font-name="Liberation Sans" fo:font-size="9pt" fo:font-weight="bold" fo:color="#1D2922"/>
    </style:style>
    <style:style style:name="ceBody" style:family="table-cell">
      <style:table-cell-properties fo:background-color="#FFFFFF" fo:padding="0.12cm" fo:border="0.5pt solid #D9E0DB" style:wrap-option="wrap" style:vertical-align="top"/>
      <style:paragraph-properties fo:margin="0cm"/>
      <style:text-properties style:font-name="Liberation Sans" fo:font-size="9pt" fo:color="#1D2922"/>
    </style:style>
    <style:style style:name="ceID" style:family="table-cell">
      <style:table-cell-properties fo:background-color="#F7F9F7" fo:padding="0.12cm" fo:border="0.5pt solid #D9E0DB" style:wrap-option="wrap" style:vertical-align="top"/>
      <style:paragraph-properties fo:margin="0cm"/>
      <style:text-properties style:font-name="Liberation Sans" fo:font-size="9pt" fo:font-weight="bold" fo:color="#24604A"/>
    </style:style>'''


def column_styles(widths: list[str]) -> str:
    return '\n'.join(
        f'''    <style:style style:name="co{i + 1}" style:family="table-column">
      <style:table-column-properties style:column-width="{width}"/>
    </style:style>'''
        for i, width in enumerate(widths)
    )


def build_sheet(
    sheet_name: str,
    title: str,
    note: str,
    headers: list[str],
    widths: list[str],
    body_rows: list[list[str]],
    body_height: str,
) -> str:
    total_width = sum(float(width[:-2]) for width in widths)
    columns = '\n'.join(
        f'    <table:table-column table:style-name="co{i + 1}"/>'
        for i in range(len(headers))
    )

    rows = [
        f'''    <table:table-row table:style-name="roTitle">
      <table:table-cell table:style-name="ceTitle" table:number-columns-spanned="{len(headers)}" office:value-type="string">
        <text:p>{esc(title)}</text:p>
      </table:table-cell>
      <table:covered-table-cell table:number-columns-repeated="{len(headers) - 1}"/>
    </table:table-row>''',
        f'''    <table:table-row table:style-name="roNote">
      <table:table-cell table:style-name="ceNote" table:number-columns-spanned="{len(headers)}" office:value-type="string">
        <text:p>{esc(note)}</text:p>
      </table:table-cell>
      <table:covered-table-cell table:number-columns-repeated="{len(headers) - 1}"/>
    </table:table-row>''',
    ]

    header_cells = '\n'.join(
        f'      <table:table-cell table:style-name="ceHeader" office:value-type="string"><text:p>{esc(header)}</text:p></table:table-cell>'
        for header in headers
    )
    rows.append(f'''    <table:table-row table:style-name="roHeader">
{header_cells}
    </table:table-row>''')

    for index, row in enumerate(body_rows):
        cells = []
        for column, value in enumerate(row):
            style = 'ceID' if column == 0 else 'ceBody'
            if value:
                cells.append(
                    f'      <table:table-cell table:style-name="{style}" office:value-type="string"><text:p>{esc(value)}</text:p></table:table-cell>'
                )
            else:
                cells.append(f'      <table:table-cell table:style-name="{style}"/>')
        row_style = 'roBodyAlt' if index % 2 else 'roBody'
        rows.append(
            f'''    <table:table-row table:style-name="{row_style}">
{chr(10).join(cells)}
    </table:table-row>'''
        )

    return f'''{XML_HEADER}<office:document-content {ns_attrs()} office:version="1.4">
  <office:automatic-styles>
{column_styles(widths)}
    <style:style style:name="ta1" style:family="table">
      <style:table-properties table:display="true" style:width="{total_width:.1f}cm"/>
      <style:master-page-name style:master-page-name="Default"/>
    </style:style>
    <style:style style:name="roTitle" style:family="table-row">
      <style:table-row-properties style:row-height="1.3cm"/>
    </style:style>
    <style:style style:name="roNote" style:family="table-row">
      <style:table-row-properties style:row-height="0.8cm"/>
    </style:style>
    <style:style style:name="roHeader" style:family="table-row">
      <style:table-row-properties style:row-height="1.1cm"/>
    </style:style>
    <style:style style:name="roBody" style:family="table-row">
      <style:table-row-properties style:row-height="{body_height}"/>
    </style:style>
    <style:style style:name="roBodyAlt" style:family="table-row">
      <style:table-row-properties style:row-height="{body_height}"/>
    </style:style>{CELL_STYLES}
  </office:automatic-styles>
  <office:body>
    <office:spreadsheet>
      <table:calculation-settings table:automatic-find-labels="false"/>
      <table:table table:name="{esc(sheet_name)}" table:style-name="ta1">
{columns}
{os.linesep.join(rows)}
      </table:table>
    </office:spreadsheet>
  </office:body>
</office:document-content>
'''


def ods_register() -> None:
    headers = [
        'Defect ID',
        'Summary',
        'Impact',
        'Priority',
        'Reproduction Status',
        'Assigned Test',
        'Resolution Status',
    ]
    widths = ['2.4cm', '7.2cm', '6.0cm', '2.0cm', '3.0cm', '3.3cm', '2.6cm']
    body_rows = [[defect_id, summary, '', '', '', '', ''] for defect_id, summary in DEFECTS]

    content = build_sheet(
        sheet_name='Defect Register',
        title='Tasklane — Defect Register',
        note='Starting register for the regression exercise. Complete the investigation and recording fields during the task; priorities are intentionally blank.',
        headers=headers,
        widths=widths,
        body_rows=body_rows,
        body_height='1.4cm',
    )

    write_odf(
        OUT / 'defect-register.ods',
        'application/vnd.oasis.opendocument.spreadsheet',
        {
            'content.xml': content,
            'styles.xml': styles_xml(landscape=True),
            'meta.xml': meta_xml('Tasklane — Defect Register', 'Defect register for a regression test-plan task'),
            'settings.xml': settings_xml(),
        },
    )


def ods_matrix() -> None:
    headers = [
        'Defect ID',
        'Reproduction Steps',
        'Expected Result',
        'Regression Test Reference',
        'Test Result',
        'Notes',
    ]
    widths = ['2.4cm', '6.6cm', '5.4cm', '3.4cm', '2.4cm', '3.6cm']
    body_rows = [[defect_id, '', '', '', '', ''] for defect_id, _summary in DEFECTS]

    content = build_sheet(
        sheet_name='Defect Test Matrix',
        title='Tasklane — Defect Test Matrix',
        note='Record reproduction steps, expected results, test references, outcomes, and notes during the regression task. Investigation fields are intentionally blank.',
        headers=headers,
        widths=widths,
        body_rows=body_rows,
        body_height='3.0cm',
    )

    write_odf(
        OUT / 'defect-test-matrix.ods',
        'application/vnd.oasis.opendocument.spreadsheet',
        {
            'content.xml': content,
            'styles.xml': styles_xml(landscape=True),
            'meta.xml': meta_xml('Tasklane — Defect Test Matrix', 'Defect-to-test matrix for a regression test-plan task'),
            'settings.xml': settings_xml(),
        },
    )


# ---------------------------------------------------------------------------
# Verification report template (ODT)
# ---------------------------------------------------------------------------

def odt_report() -> None:
    sections = [
        'Test strategy',
        'Defects reproduced',
        'Tests added',
        'Fixes verified',
        'Unresolved defects',
        'Residual risks',
    ]
    section_xml = []
    for heading in sections:
        # The body of every substantive section is intentionally empty.
        section_xml.append(
            f'    <text:h text:style-name="RptHeading1" text:outline-level="1">{esc(heading)}</text:h>\n'
            '    <text:p text:style-name="RptBody"/>'
        )

    metadata_rows = []
    for label in ['Engineer', 'Recording date', 'Build or commit', 'Environment']:
        metadata_rows.append(
            '      <table:table-row>\n'
            f'        <table:table-cell table:style-name="ceMetaLabel" office:value-type="string"><text:p text:style-name="PMetaLabel">{esc(label)}</text:p></table:table-cell>\n'
            '        <table:table-cell table:style-name="ceMetaValue"/>\n'
            '      </table:table-row>'
        )

    content = f'''{XML_HEADER}<office:document-content {ns_attrs()} office:version="1.4">
  <office:automatic-styles>
    <style:style style:name="RptTitle" style:family="paragraph" style:parent-style-name="Standard" style:class="text">
      <style:paragraph-properties fo:margin-top="0cm" fo:margin-bottom="0.15cm"/>
      <style:text-properties style:font-name="Liberation Serif" fo:font-size="27pt" fo:font-weight="bold" fo:color="#1D2922"/>
    </style:style>
    <style:style style:name="RptSubtitle" style:family="paragraph" style:parent-style-name="Standard" style:class="text">
      <style:paragraph-properties fo:margin-bottom="0.8cm"/>
      <style:text-properties style:font-name="Liberation Sans" fo:font-size="11pt" fo:color="#5C6961"/>
    </style:style>
    <style:style style:name="RptIntro" style:family="paragraph" style:parent-style-name="Standard" style:class="text">
      <style:paragraph-properties fo:margin-bottom="0.55cm" fo:padding-bottom="0.3cm" fo:border-bottom="0.6pt solid #C8D3CB"/>
      <style:text-properties style:font-name="Liberation Sans" fo:font-size="10.5pt" fo:color="#3F4C44"/>
    </style:style>
    <style:style style:name="RptHeading1" style:family="paragraph" style:parent-style-name="Standard" style:class="text" style:default-outline-level="1">
      <style:paragraph-properties fo:margin-top="0.8cm" fo:margin-bottom="0.25cm" fo:padding-bottom="0.12cm" fo:border-bottom="0.5pt solid #C8D3CB" fo:keep-with-next="always"/>
      <style:text-properties style:font-name="Liberation Serif" fo:font-size="16pt" fo:font-weight="bold" fo:color="#24604A"/>
    </style:style>
    <style:style style:name="RptBody" style:family="paragraph" style:parent-style-name="Standard" style:class="text">
      <style:paragraph-properties fo:margin-top="0cm" fo:margin-bottom="0.2cm"/>
      <style:text-properties style:font-name="Liberation Sans" fo:font-size="10.5pt" fo:color="#1D2922"/>
    </style:style>
    <style:style style:name="PMetaLabel" style:family="paragraph" style:parent-style-name="Standard" style:class="text">
      <style:paragraph-properties fo:margin="0cm"/>
      <style:text-properties style:font-name="Liberation Sans" fo:font-size="9pt" fo:font-weight="bold" fo:color="#5C6961"/>
    </style:style>
    <style:style style:name="ceMetaLabel" style:family="table-cell">
      <style:table-cell-properties fo:background-color="#EDF2EE" fo:padding="0.12cm" fo:border="0.5pt solid #D9E0DB" style:vertical-align="middle"/>
    </style:style>
    <style:style style:name="ceMetaValue" style:family="table-cell">
      <style:table-cell-properties fo:background-color="#FFFFFF" fo:padding="0.12cm" fo:border="0.5pt solid #D9E0DB" style:vertical-align="middle"/>
    </style:style>
    <style:style style:name="coMetaLabel" style:family="table-column">
      <style:table-column-properties style:column-width="4.4cm"/>
    </style:style>
    <style:style style:name="coMetaValue" style:family="table-column">
      <style:table-column-properties style:column-width="11.8cm"/>
    </style:style>
    <style:style style:name="taMeta" style:family="table">
      <style:table-properties table:display="true" style:width="16.2cm"/>
    </style:style>
  </office:automatic-styles>
  <office:body>
    <office:text>
      <text:p text:style-name="RptTitle">Regression Verification Report</text:p>
      <text:p text:style-name="RptSubtitle">Tasklane — Build a regression test plan from defect reports</text:p>
      <text:p text:style-name="RptIntro">Complete this report while reproducing the supplied defects, adding regression coverage, and verifying outcomes. The substantive sections below are intentionally blank.</text:p>
      <table:table table:name="Report details" table:style-name="taMeta">
        <table:table-column table:style-name="coMetaLabel"/>
        <table:table-column table:style-name="coMetaValue"/>
{os.linesep.join(metadata_rows)}
      </table:table>
{os.linesep.join(section_xml)}
    </office:text>
  </office:body>
</office:document-content>
'''
    write_odf(
        OUT / 'verification-report-template.odt',
        'application/vnd.oasis.opendocument.text',
        {
            'content.xml': content,
            'styles.xml': styles_xml(landscape=False),
            'meta.xml': meta_xml('Tasklane — Regression Verification Report', 'Verification report template for a regression test-plan task'),
            'settings.xml': settings_xml(),
        },
    )


if __name__ == '__main__':
    ods_register()
    ods_matrix()
    odt_report()
    for name in ['defect-register.ods', 'defect-test-matrix.ods', 'verification-report-template.odt']:
        path = OUT / name
        print(f'{name}: {path.stat().st_size} bytes')
