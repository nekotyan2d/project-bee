export type NavDirection = "forward" | "back";

const TABS = ["/", "/analytics", "/settings"];

function normalize(path: string): string {
    const clean = path.split(/[?#]/)[0] ?? "/";
    return clean.length > 1 ? clean.replace(/\/+$/, "") : clean;
}

export function navLevel(path: string): 0 | 1 | 2 {
    const p = normalize(path);
    if (TABS.includes(p) || p === "/onboarding") return 0;
    if (p.endsWith("/new") || p.endsWith("/edit")) return 2;
    return 1;
}

export function navDirection(from: string, to: string): NavDirection {
    const f = normalize(from);
    const t = normalize(to);

    const fromTab = TABS.indexOf(f);
    const toTab = TABS.indexOf(t);
    if (fromTab >= 0 && toTab >= 0) return toTab > fromTab ? "forward" : "back";

    return navLevel(t) < navLevel(f) ? "back" : "forward";
}

let backRequested = false;

export function markBackNavigation(): void {
    backRequested = true;
}

export function consumeBackNavigation(): boolean {
    const was = backRequested;
    backRequested = false;
    return was;
}
