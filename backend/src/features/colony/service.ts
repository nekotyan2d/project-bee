import { NotFoundError } from "@/shared/errors";

import * as repository from "./repository";
import type { ColonyRow } from "./repository";
import type { ColonyDto, ColonyInput } from "./schema";

function toDto(row: ColonyRow): ColonyDto {
    return {
        id: row.id,
        apiaryId: row.apiaryId,
        currentHiveId: row.currentHiveId,
        label: row.label,
        establishedAt: row.establishedAt,
        origin: row.origin,
        status: row.status,
        currentQueenId: row.currentQueenId,
        superCount: row.superCount,
        lastInspectedAt: row.lastInspectedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

export async function listColonies(ownerId: string, apiaryId?: string, since?: string): Promise<ColonyDto[]> {
    const rows = await repository.findAll(ownerId, apiaryId, since ? new Date(since) : undefined);
    return rows.map(toDto);
}

export async function getColony(ownerId: string, id: string): Promise<ColonyDto> {
    const row = await repository.findById(ownerId, id);
    if (!row) {
        throw new NotFoundError(`Colony ${id} not found`);
    }
    return toDto(row);
}

export async function upsertColony(ownerId: string, id: string, input: ColonyInput): Promise<ColonyDto> {
    const ownsApiary = await repository.apiaryBelongsToOwner(ownerId, input.apiaryId);
    if (!ownsApiary) {
        throw new NotFoundError(`Apiary ${input.apiaryId} not found`);
    }

    const row = await repository.upsert({ id, ...input });
    return toDto(row);
}
