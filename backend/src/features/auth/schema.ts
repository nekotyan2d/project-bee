import { z } from "zod";

export const anonymousResponse = z.object({
    token: z.string(),
});
