import { db } from "@/shared/db/client";
import { users } from "@/shared/db/schema";

export async function createUser(): Promise<string> {
    const [row] = await db.insert(users).values({}).returning({ id: users.id });

    if (!row) {
        throw new Error("Failed to create user");
    }

    return row.id;
}
