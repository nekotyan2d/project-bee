export function pluralRu(n: number, one: string, few: string, many: string): string {
    const abs = Math.abs(n);
    const lastTwo = abs % 100;
    const last = abs % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return many;
    if (last === 1) return one;
    if (last >= 2 && last <= 4) return few;
    return many;
}
