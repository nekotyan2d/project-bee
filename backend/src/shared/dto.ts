/** Row → DTO: колонки-`Date` становятся ISO-строками, остальное проходит как есть.
 *  Лишние колонки строки (напр. `ownerId`) режет Zod-схема ответа при сериализации. */
export type IsoDates<T> = { [K in keyof T]: Date extends T[K] ? Exclude<T[K], Date> | string : T[K] };

export function isoDates<T extends object>(row: T): IsoDates<T> {
    return Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value]),
    ) as IsoDates<T>;
}
