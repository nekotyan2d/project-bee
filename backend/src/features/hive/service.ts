import { NotFoundError } from "@/shared/errors";

import * as repository from "./repository";
import type { HiveRow } from "./repository";
import type { HiveDto, HiveInput } from "./schema";

function toDto(row: HiveRow): HiveDto {
    return {
        id: row.id,
        apiaryId: row.apiaryId,
        label: row.label,
        type: row.type,
        frameCount: row.frameCount,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        deletedAt: row.deletedAt?.toISOString() ?? null,
    };
}

export async function listHives(ownerId: string, apiaryId?: string, since?: string): Promise<HiveDto[]> {
    const rows = await repository.findAll(ownerId, apiaryId, since ? new Date(since) : undefined);
    return rows.map(toDto);
}

export async function getHive(ownerId: string, id: string): Promise<HiveDto> {
    const row = await repository.findById(ownerId, id);
    if (!row) {
        throw new NotFoundError(`Hive ${id} not found`);
    }
    return toDto(row);
}

export async function upsertHive(ownerId: string, id: string, input: HiveInput): Promise<HiveDto> {
    const owned = await repository.apiaryBelongsToOwner(ownerId, input.apiaryId);
    if (!owned) {
        throw new NotFoundError(`Apiary ${input.apiaryId} not found`);
    }

    const row = await repository.upsert({ id, ...input });
    return toDto(row);
}

export async function deleteHive(ownerId: string, id: string): Promise<void> {
    const deleted = await repository.softDelete(ownerId, id);
    if (!deleted) {
        throw new NotFoundError(`Hive ${id} not found`);
    }
}
