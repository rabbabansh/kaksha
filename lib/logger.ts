type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
    correlationId?: string;
    operation?: string;
    duration?: number;
    error?: string | Error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

const SENSITIVE_KEYS = ["password", "token", "secret", "apiKey"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function redactSensitiveData(data: Record<string, any>): Record<string, any> {
    if (typeof data !== "object" || data === null) return data;

    const redacted = { ...data };
    for (const key of Object.keys(redacted)) {
        if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive))) {
            redacted[key] = "[REDACTED]";
        } else if (typeof redacted[key] === "object") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            redacted[key] = redactSensitiveData(redacted[key] as Record<string, any>);
        }
    }
    return redacted;
}

function formatLog(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const safeContext = context ? redactSensitiveData(context) : undefined;

    if (process.env.NODE_ENV === "production") {
        return JSON.stringify({
            timestamp,
            level,
            message,
            ...safeContext,
        });
    } else {
        let ctxStr = "";
        if (safeContext && Object.keys(safeContext).length > 0) {
            ctxStr = `\n  Context: ${JSON.stringify(safeContext, null, 2)}`;
        }
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${ctxStr}`;
    }
}

export const logger = {
    debug: (message: string, context?: LogContext) =>
        console.debug(formatLog("debug", message, context)),
    info: (message: string, context?: LogContext) =>
        console.info(formatLog("info", message, context)),
    warn: (message: string, context?: LogContext) =>
        console.warn(formatLog("warn", message, context)),
    error: (message: string, context?: LogContext) =>
        console.error(formatLog("error", message, context)),
};

export function createTimer() {
    const start = performance.now();
    return {
        elapsed: () => Math.round(performance.now() - start),
    };
}

export async function withLogging<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: Omit<LogContext, "operation" | "duration">
): Promise<T> {
    const timer = createTimer();
    try {
        const result = await fn();
        logger.info(`${operation} completed`, { operation, duration: timer.elapsed(), ...context });
        return result;
    } catch (error) {
        logger.error(`${operation} failed`, {
            operation,
            duration: timer.elapsed(),
            error: error instanceof Error ? error.message : String(error),
            ...context,
        });
        throw error;
    }
}
