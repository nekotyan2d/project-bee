import { eq } from "drizzle-orm";

import { db } from "@/shared/db/client";
import { users } from "@/shared/db/schema";

export async function createUser(): Promise<string> {
    const [row] = await db.insert(users).values({}).returning({ id: users.id });

    if (!row) {
        throw new Error("Failed to create user");
    }

    return row.id;
}

export async function findById(id: string): Promise<{ id: string; email: string | null } | undefined> {
    return db.query.users.findFirst({
        where: eq(users.id, id),
        columns: { id: true, email: true },
    });
}

export async function findByEmail(
    email: string,
): Promise<{ id: string; passwordHash: string | null } | undefined> {
    return db.query.users.findFirst({
        where: eq(users.email, email),
        columns: { id: true, passwordHash: true },
    });
}

export async function setCredentials(userId: string, email: string, passwordHash: string): Promise<void> {
    await db.update(users).set({ email, passwordHash }).where(eq(users.id, userId));
}
