import type { LocalColony, LocalHive, LocalQueen } from "~/shared/db";

export const HIVE_TYPES = [
    { value: "dadant", label: "Дадан" },
    { value: "rut", label: "Рут" },
    { value: "ukrainian", label: "Украинский" },
    { value: "multi_hull", label: "Многокорпусный" },
];

const intOrUndefined = (v: string): number | undefined => (v ? parseInt(v, 10) : undefined);
const textOrUndefined = (v: string): string | undefined => v.trim() || undefined;

export interface HiveForm {
    label: string;
    type: string;
    frameCount: string;
    color: string;
    status: string;
}

export type HiveFields = Pick<LocalHive, "label" | "type" | "frameCount" | "color" | "status">;

export function emptyHiveForm(label = ""): HiveForm {
    return { label, type: "", frameCount: "", color: "", status: "active" };
}

export function hiveFields(f: HiveForm): HiveFields {
    return {
        label: f.label.trim(),
        type: f.type || undefined,
        frameCount: intOrUndefined(f.frameCount),
        color: f.color || undefined,
        status: f.status,
    };
}

export function hiveToForm(h: LocalHive): HiveForm {
    return {
        label: h.label,
        type: h.type ?? "",
        frameCount: h.frameCount ? String(h.frameCount) : "",
        color: h.color ?? "",
        status: h.status,
    };
}

export interface QueenForm {
    year: string;
    breed: string;
    origin: string;
    introducedAt: string;
    status: string;
}

export type QueenFields = Pick<LocalQueen, "year" | "breed" | "origin" | "introducedAt" | "status">;

export function emptyQueenForm(): QueenForm {
    return { year: "", breed: "", origin: "", introducedAt: "", status: "active" };
}

export function queenFields(f: QueenForm): QueenFields {
    return {
        year: intOrUndefined(f.year),
        breed: textOrUndefined(f.breed),
        origin: textOrUndefined(f.origin),
        introducedAt: f.introducedAt || undefined,
        status: f.status,
    };
}

export function queenToForm(q: LocalQueen): QueenForm {
    return {
        year: q.year ? String(q.year) : "",
        breed: q.breed ?? "",
        origin: q.origin ?? "",
        introducedAt: q.introducedAt ?? "",
        status: q.status,
    };
}

export interface ColonyForm {
    label: string;
    establishedAt: string;
    origin: string;
    status: string;
}

export type ColonyFields = Pick<LocalColony, "label" | "establishedAt" | "origin" | "status">;

export function emptyColonyForm(label = ""): ColonyForm {
    return { label, establishedAt: "", origin: "", status: "active" };
}

export function colonyFields(f: ColonyForm): ColonyFields {
    return {
        label: f.label.trim(),
        establishedAt: f.establishedAt || undefined,
        origin: textOrUndefined(f.origin),
        status: f.status,
    };
}

export function colonyToForm(c: LocalColony): ColonyForm {
    return {
        label: c.label,
        establishedAt: c.establishedAt ?? "",
        origin: c.origin ?? "",
        status: c.status,
    };
}
