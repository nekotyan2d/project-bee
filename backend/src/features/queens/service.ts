import { isoDates } from "@/shared/dto";
import { NotFoundError, ValidationError } from "@/shared/errors";

import * as repository from "./repository";
import type { QueenDto, QueenInput } from "./schema";


export async function listQueens(ownerId: string, since?: string): Promise<QueenDto[]> {
    const rows = await repository.findAll(ownerId, since ? new Date(since) : undefined);
    return rows.map(isoDates);
}

export async function getQueen(ownerId: string, id: string): Promise<QueenDto> {
    const row = await repository.findById(ownerId, id);
    if (!row) {
        throw new NotFoundError(`Queen ${id} not found`);
    }
    return isoDates(row);
}

export async function upsertQueen(ownerId: string, id: string, input: QueenInput): Promise<QueenDto> {
    if (input.colonyId) {
        const ownsColony = await repository.colonyBelongsToOwner(ownerId, input.colonyId);
        if (!ownsColony) {
            throw new NotFoundError(`Colony ${input.colonyId} not found`);
        }
    }

    if (input.motherQueenId) {
        if (input.motherQueenId === id) {
            throw new ValidationError("Queen cannot be its own mother");
        }
        const ownsMother = await repository.queenBelongsToOwner(ownerId, input.motherQueenId);
        if (!ownsMother) {
            throw new NotFoundError(`Queen ${input.motherQueenId} not found`);
        }
    }

    const row = await repository.upsert({ id, ownerId, ...input });
    return isoDates(row);
}

export async function deleteQueen(ownerId: string, id: string): Promise<void> {
    const deleted = await repository.softDelete(ownerId, id);
    if (!deleted) {
        throw new NotFoundError(`Queen ${id} not found`);
    }
}
