import { CsvParseError, parseCsv } from "./parser.js";
import { validateRecords } from "./validator.js";
import type { ImportError, ImportResult } from "./validator.js";

/**
 * Parses and validates a complete CSV source.
 *
 * Syntax errors are fail-fast. Validation errors are collected for every data
 * record. Any error makes the import all-or-nothing: no partial records are
 * returned and no record is silently skipped.
 */
export function importCsv(source: string): ImportResult {
  try {
    return validateRecords(parseCsv(source));
  } catch (error: unknown) {
    if (error instanceof CsvParseError) {
      const parseError: ImportError = {
        code: "PARSE_ERROR",
        recordNumber: error.recordNumber,
        message: error.message,
      };
      return { ok: false, records: [], errors: [parseError] };
    }

    throw error;
  }
}
