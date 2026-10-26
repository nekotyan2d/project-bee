import { isoDates } from "@/shared/dto";
import { NotFoundError } from "@/shared/errors";

import * as repository from "./repository";
import type { ColonyDto, ColonyInput } from "./schema";


export async function listColonies(ownerId: string, apiaryId?: string, since?: string): Promise<ColonyDto[]> {
    const rows = await repository.findAll(ownerId, apiaryId, since ? new Date(since) : undefined);
    return rows.map(isoDates);
}

export async function getColony(ownerId: string, id: string): Promise<ColonyDto> {
    const row = await repository.findById(ownerId, id);
    if (!row) {
        throw new NotFoundError(`Colony ${id} not found`);
    }
    return isoDates(row);
}

export async function upsertColony(ownerId: string, id: string, input: ColonyInput): Promise<ColonyDto> {
    const ownsApiary = await repository.apiaryBelongsToOwner(ownerId, input.apiaryId);
    if (!ownsApiary) {
        throw new NotFoundError(`Apiary ${input.apiaryId} not found`);
    }

    const row = await repository.upsert(ownerId, { id, ...input });
    if (!row) {
        throw new NotFoundError(`Colony ${id} not found`);
    }
    return isoDates(row);
}
