// Границы года вывода матки — для нативной валидации числового поля.
export const MIN_QUEEN_YEAR = 2000;
export const MAX_QUEEN_YEAR = new Date().getFullYear() + 1;

// ponytail: поле payload по-прежнему называется amountKg; для мёда в нём литры (так велись данные с самого начала).
export const harvestUnit = (product: unknown): string => (product === "honey" || product === undefined ? "л" : "кг");

export function formatAmount(v: number, unit: string): string {
    return v % 1 === 0 ? `${String(v)} ${unit}` : `${v.toFixed(1)} ${unit}`;
}
