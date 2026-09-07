import type { LocalEvent } from "~/shared/db";

import { formatMonth } from "./formatDate";

export interface FinanceRow {
    event: LocalEvent;
    income: boolean;
    amount: number;
    category: string;
    item: string;
    counterparty: string;
}

export interface FinanceCategorySum {
    category: string;
    income: boolean;
    sum: number;
}

export interface FinanceMonth {
    key: string;
    label: string;
    rows: FinanceRow[];
}

export interface FinanceSeason {
    year: number;
    rows: FinanceRow[];
    months: FinanceMonth[];
    income: number;
    expense: number;
    byCategory: FinanceCategorySum[];
}

function byMonth(rows: FinanceRow[]): FinanceMonth[] {
    const months: FinanceMonth[] = [];
    for (const row of rows) {
        const d = row.event.occurredAt;
        const key = `${String(d.getFullYear())}-${String(d.getMonth())}`;
        const last = months.at(-1);
        if (last && last.key === key) last.rows.push(row);
        else months.push({ key, label: formatMonth(d), rows: [row] });
    }
    return months;
}

function toRow(e: LocalEvent): FinanceRow {
    const p = e.payload;
    return {
        event: e,
        income: p.direction === "income",
        amount: typeof p.amount === "number" ? p.amount : 0,
        category: typeof p.category === "string" ? p.category : "other",
        item: typeof p.item === "string" ? p.item : "",
        counterparty: typeof p.counterparty === "string" ? p.counterparty : "",
    };
}

export function summarizeFinance(events: LocalEvent[]): FinanceSeason[] {
    const byYear = new Map<number, FinanceRow[]>();
    for (const e of events) {
        const year = e.occurredAt.getFullYear();
        const list = byYear.get(year) ?? [];
        list.push(toRow(e));
        byYear.set(year, list);
    }

    const seasons: FinanceSeason[] = [];
    for (const [year, rows] of byYear) {
        rows.sort((a, b) => b.event.occurredAt.getTime() - a.event.occurredAt.getTime());

        const sums = new Map<string, FinanceCategorySum>();
        let income = 0;
        let expense = 0;
        for (const r of rows) {
            if (r.income) income += r.amount;
            else expense += r.amount;

            const key = `${r.income ? "i" : "e"}:${r.category}`;
            const entry = sums.get(key) ?? { category: r.category, income: r.income, sum: 0 };
            entry.sum += r.amount;
            sums.set(key, entry);
        }

        seasons.push({
            year,
            rows,
            months: byMonth(rows),
            income,
            expense,
            byCategory: [...sums.values()].sort((a, b) => Number(b.income) - Number(a.income) || b.sum - a.sum),
        });
    }

    return seasons.sort((a, b) => b.year - a.year);
}
