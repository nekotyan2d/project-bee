import { ConflictError, UnauthorizedError } from "@/shared/errors";

import * as repository from "./repository";

const dummyHash = Bun.password.hash("timing-equalizer");

export function createAnonymousUser(): Promise<string> {
    return repository.createUser();
}

export async function getMe(userId: string): Promise<{ id: string; email: string | null }> {
    const user = await repository.findById(userId);
    if (!user) {
        throw new UnauthorizedError("User not found");
    }
    return user;
}

export async function register(userId: string, email: string, password: string): Promise<void> {
    const me = await repository.findById(userId);
    if (me?.email) {
        throw new ConflictError("Account already has credentials");
    }
    const existing = await repository.findByEmail(email);
    if (existing) {
        throw new ConflictError("Email already in use");
    }
    const passwordHash = await Bun.password.hash(password);
    await repository.setCredentials(userId, email, passwordHash);
}

export async function login(email: string, password: string): Promise<string> {
    const user = await repository.findByEmail(email);
    const ok = await Bun.password.verify(password, user?.passwordHash ?? (await dummyHash));
    if (!user?.passwordHash || !ok) {
        throw new UnauthorizedError("Invalid email or password");
    }
    return user.id;
}