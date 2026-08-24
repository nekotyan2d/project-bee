import { isoDates } from "@/shared/dto";
import { NotFoundError } from "@/shared/errors";

import * as repository from "./repository";
import type { ApiaryDto, ApiaryInput } from "./schema";


export async function listApiaries(ownerId: string, since?: string): Promise<ApiaryDto[]> {
    const rows = await repository.findAll(ownerId, since ? new Date(since) : undefined);
    return rows.map(isoDates);
}

export async function getApiary(ownerId: string, id: string): Promise<ApiaryDto> {
    const row = await repository.findById(ownerId, id);
    if (!row) {
        throw new NotFoundError(`Apiary ${id} not found`);
    }
    return isoDates(row);
}

export async function upsertApiary(
    ownerId: string,
    id: string,
    input: ApiaryInput,
): Promise<ApiaryDto> {
    const row = await repository.upsert({ id, ownerId, ...input });
    return isoDates(row);
}

export async function deleteApiary(ownerId: string, id: string): Promise<void> {
    const deleted = await repository.softDelete(ownerId, id);
    if (!deleted) {
        throw new NotFoundError(`Apiary ${id} not found`);
    }
}
