const dateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });
const dateShortFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", { dateStyle: "long", timeStyle: "short" });
const monthFormatter = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" });

export function formatDateTime(value: Date | string | null | undefined): string {
    if (!value) return "—";
    return dateTimeFormatter.format(new Date(value));
}

export function formatDate(value: Date | string | null | undefined): string {
    if (!value) return "—";
    return dateFormatter.format(new Date(value));
}

function formatDateShort(value: Date | string | null | undefined): string {
    if (!value) return "—";
    return dateShortFormatter.format(new Date(value));
}

export function toDatetimeLocal(date: Date): string {
    const p = (n: number) => String(n).padStart(2, "0");
    return `${String(date.getFullYear())}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

export function daysAgo(value: Date | string | null | undefined): string | null {
    if (!value) return null;
    const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
    if (days <= 0) return "сегодня";
    if (days === 1) return "вчера";
    return `${String(days)} дн. назад`;
}

// Свежие события (≤7 дн) — относительно, дальше короткая дата.
export function relativeDate(value: Date | string | null | undefined): string {
    if (!value) return "—";
    if (Date.now() - new Date(value).getTime() > 7 * 86_400_000) return formatDateShort(value);
    return daysAgo(value) ?? "—";
}

// «Июнь 2026» — для группировки истории по месяцам.
export function formatMonth(value: Date | string): string {
    const s = monthFormatter.format(new Date(value));
    return s.charAt(0).toUpperCase() + s.slice(1);
}
