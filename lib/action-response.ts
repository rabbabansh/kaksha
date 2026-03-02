export enum ErrorCode {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    NOT_FOUND = "NOT_FOUND",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    CONFLICT = "CONFLICT",
    DATABASE_ERROR = "DATABASE_ERROR",
    INTERNAL_ERROR = "INTERNAL_ERROR",
}

export type ActionSuccess<T> = {
    success: true;
    data: T;
    correlationId?: string;
};

export type ActionError = {
    success: false;
    error: string;
    code: ErrorCode;
    details?: object;
    correlationId?: string;
};

export type ActionResult<T> = ActionSuccess<T> | ActionError;

export function success<T>(data: T, correlationId?: string): ActionSuccess<T> {
    return { success: true, data, correlationId };
}

export function error(
    message: string,
    code: ErrorCode,
    details?: object,
    correlationId?: string
): ActionError {
    return { success: false, error: message, code, details, correlationId };
}

export function generateCorrelationId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
