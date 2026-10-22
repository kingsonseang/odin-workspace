export type DomainErrorCode =
  | "PROJECT_NOT_FOUND"
  | "TASK_NOT_FOUND"
  | "USER_NOT_FOUND"
  | "FORBIDDEN_PROJECT_MANAGE"
  | "FORBIDDEN_TASK_WRITE"
  | "PROJECT_ARCHIVED"
  | "PROJECT_COMPLETED"
  | "INVALID_PROJECT_TRANSITION"
  | "INVALID_TASK_TRANSITION"
  | "OPEN_TASKS_REMAIN"
  | "PROJECT_NOT_ELIGIBLE_FOR_ARCHIVE"
  | "PROJECT_ALREADY_ARCHIVED"
  | "PROJECT_NOT_ARCHIVED"
  | "INVALID_ASSIGNEE"
  | "INVALID_TASK_INPUT"
  | "DATA_INTEGRITY";

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly details?: Record<string, string>;

  constructor(
    code: DomainErrorCode,
    message: string,
    details?: Record<string, string>
  ) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.details = details;
  }
}
