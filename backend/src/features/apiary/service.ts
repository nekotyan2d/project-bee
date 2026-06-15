import { NotFoundError } from "@/shared/errors";

import * as repository from "./repository";
import type { ApiaryRow } from "./repository";
import type { ApiaryDto, ApiaryInput } from "./schema";

function toDto(row: ApiaryRow): ApiaryDto {
    return {
        id: row.id,
        name: row.name,
        latitude: row.latitude,
        longitude: row.longitude,
        notes: row.notes,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        deletedAt: row.deletedAt?.toISOString() ?? null,
    };
}

export async function listApiaries(ownerId: string, since?: string): Promise<ApiaryDto[]> {
    const rows = await repository.findAll(ownerId, since ? new Date(since) : undefined);
    return rows.map(toDto);
}

export async function getApiary(ownerId: string, id: string): Promise<ApiaryDto> {
    const row = await repository.findById(ownerId, id);
    if (!row) {
        throw new NotFoundError(`Apiary ${id} not found`);
    }
    return toDto(row);
}

export async function upsertApiary(
    ownerId: string,
    id: string,
    input: ApiaryInput,
): Promise<ApiaryDto> {
    const row = await repository.upsert({ id, ownerId, ...input });
    return toDto(row);
}

export async function deleteApiary(ownerId: string, id: string): Promise<void> {
    const deleted = await repository.softDelete(ownerId, id);
    if (!deleted) {
        throw new NotFoundError(`Apiary ${id} not found`);
    }
}
