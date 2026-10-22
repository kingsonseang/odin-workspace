import { DomainError, type DomainErrorCode } from "@forgeboard/domain";
import type {
  ErrorRequestHandler,
  RequestHandler
} from "express";
import type { ApiErrorBody } from "@forgeboard/shared";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, string>
  ) {
    super(message);
    this.name = "HttpError";
  }
}

const STATUS_BY_DOMAIN_CODE: Record<DomainErrorCode, number> = {
  PROJECT_NOT_FOUND: 404,
  TASK_NOT_FOUND: 404,
  USER_NOT_FOUND: 404,
  FORBIDDEN_PROJECT_MANAGE: 403,
  FORBIDDEN_TASK_WRITE: 403,
  PROJECT_ARCHIVED: 409,
  PROJECT_COMPLETED: 409,
  INVALID_PROJECT_TRANSITION: 409,
  INVALID_TASK_TRANSITION: 409,
  OPEN_TASKS_REMAIN: 409,
  PROJECT_NOT_ELIGIBLE_FOR_ARCHIVE: 409,
  PROJECT_ALREADY_ARCHIVED: 409,
  PROJECT_NOT_ARCHIVED: 409,
  INVALID_ASSIGNEE: 400,
  INVALID_TASK_INPUT: 400,
  DATA_INTEGRITY: 500
};

function sendError(
  res: Parameters<ErrorRequestHandler>[2],
  status: number,
  code: string,
  message: string,
  details?: Record<string, string>
): void {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  };
  res.status(status).json(body);
}

export const notFoundHandler: RequestHandler = (req, res) => {
  sendError(
    res,
    404,
    "ROUTE_NOT_FOUND",
    `No route matches ${req.method} ${req.originalUrl}.`
  );
};

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  next
) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof DomainError) {
    sendError(
      res,
      STATUS_BY_DOMAIN_CODE[error.code],
      error.code,
      error.message,
      error.details
    );
    return;
  }

  if (error instanceof HttpError) {
    sendError(res, error.status, error.code, error.message, error.details);
    return;
  }

  if (
    error instanceof SyntaxError &&
    "status" in error &&
    (error as SyntaxError & { status?: number }).status === 400
  ) {
    sendError(res, 400, "INVALID_JSON", "The request body is not valid JSON.");
    return;
  }

  console.error("Unhandled API error", error);
  sendError(
    res,
    500,
    "INTERNAL_ERROR",
    "The server could not complete the request."
  );
};
