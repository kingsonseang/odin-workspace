export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export function notFoundResponse(resource: string, identifier: string): ErrorResponse {
  return {
    error: {
      code: "NOT_FOUND",
      message: `${resource} "${identifier}" was not found`,
    },
  };
}

export function internalErrorResponse(): ErrorResponse {
  return {
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
  };
}
