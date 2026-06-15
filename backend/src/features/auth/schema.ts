import { z } from "zod";

export const anonymousResponse = z.object({
    token: z.string(),
});

export const credentialsInput = z.object({
    email: z.email(),
    password: z.string().min(8).max(200),
});

export const tokenResponse = z.object({
    token: z.string(),
    email: z.string(),
});

export const meResponse = z.object({
    id: z.uuid(),
    email: z.string().nullable(),
});
