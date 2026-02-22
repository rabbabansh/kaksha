export enum ErrorCode {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    NOT_FOUND = "NOT_FOUND",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    CONFLICT = "CONFLICT",
    DATABASE_ERROR = "DATABASE_ERROR",
    INTERNAL_ERROR = "INTERNAL_ERROR",
}

export class AppError extends Error {
    public code: ErrorCode;
    public statusCode: number;
    public isOperational: boolean;

    constructor(
        message: string,
        code: ErrorCode,
        statusCode: number,
        isOperational: boolean = true
    ) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            success: false,
            error: this.message,
            code: this.code,
        };
    }
}

export class ValidationError extends AppError {
    constructor(message: string = "Validation failed") {
        super(message, ErrorCode.VALIDATION_ERROR, 400);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = "Resource not found") {
        super(message, ErrorCode.NOT_FOUND, 404);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = "Unauthorized access") {
        super(message, ErrorCode.UNAUTHORIZED, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = "Forbidden access") {
        super(message, ErrorCode.FORBIDDEN, 403);
    }
}

export class ConflictError extends AppError {
    constructor(message: string = "Resource conflict") {
        super(message, ErrorCode.CONFLICT, 409);
    }
}

export class DatabaseError extends AppError {
    constructor(message: string = "Database error occurred") {
        super(message, ErrorCode.DATABASE_ERROR, 500, false);
    }
}
