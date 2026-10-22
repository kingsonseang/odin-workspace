/**
 * One logical CSV record. Record numbers are 1-based and include the header.
 */
export interface CsvRecord {
  readonly recordNumber: number;
  readonly fields: readonly string[];
}

export type CsvParseErrorReason =
  | "UNCLOSED_QUOTE"
  | "UNEXPECTED_QUOTE"
  | "CHARACTER_AFTER_QUOTE";

/**
 * A syntax error in the CSV source. `recordNumber` is the logical record that
 * contains the start of the malformed field, not a physical line number.
 */
export class CsvParseError extends Error {
  readonly recordNumber: number;
  readonly reason: CsvParseErrorReason;

  constructor(
    message: string,
    recordNumber: number,
    reason: CsvParseErrorReason,
  ) {
    super(message);
    this.name = "CsvParseError";
    this.recordNumber = recordNumber;
    this.reason = reason;
  }
}

/**
 * INTENTIONAL STARTER DEFECT:
 *
 * This parser splits physical lines and then splits each line on commas. It
 * does not understand quoted fields, escaped quotes, or quoted newlines, and
 * therefore cannot detect malformed quoting.
 *
 * Do not treat this as the intended implementation. The tests and README
 * describe the expected parser behavior.
 */
export function parseCsv(source: string): CsvRecord[] {
  const withoutBom = source.startsWith("\uFEFF") ? source.slice(1) : source;

  if (withoutBom.length === 0) {
    return [];
  }

  const lines = withoutBom.replace(/\r\n?/g, "\n").split("\n");

  // A single trailing record terminator does not create an extra record.
  if (lines.at(-1) === "") {
    lines.pop();
  }

  return lines.map((line, index) => ({
    recordNumber: index + 1,
    fields: line.split(","),
  }));
}
