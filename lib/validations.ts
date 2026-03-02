import { z } from "zod";

// Example Domain Schema
export const domainSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters long"),
    description: z.string().optional(),
});

export type DomainInput = z.infer<typeof domainSchema>;

/**
 * Extracts the first human-readable error message from a ZodError
 */
export function formatValidationError(error: z.ZodError): string {
    if (error.issues && error.issues.length > 0) {
        const firstError = error.issues[0];
        const path = firstError.path.length > 0 ? `${firstError.path.join('.')}: ` : '';
        return `${path}${firstError.message}`;
    }
    return "Validation failed";
}
