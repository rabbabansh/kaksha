import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
    DATABASE_URL: z.string().url().optional(),
    // Add more environment variables here as needed
});

function validateEnv() {
    if (typeof window !== "undefined") {
        // Return empty object on client side or mock env
        return {} as z.infer<typeof envSchema>;
    }

    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
        const errorMessage = "Invalid environment variables: " + parsed.error.message;
        if (process.env.NODE_ENV === "production") {
            console.error("[CRITICAL] " + errorMessage);
            // In production, we log severe error but allow app to start in degraded state
            // Return unvalidated process.env as fallback
            return process.env as unknown as z.infer<typeof envSchema>;
        } else {
            throw new Error(errorMessage);
        }
    }

    return parsed.data;
}

export const env = validateEnv();
