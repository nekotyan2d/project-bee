export type AttentionLevel = "ok" | "warn" | "alert";

export interface InspectionStatus {
    level: AttentionLevel;
    label: string;
}

const WARN_DAYS = 7;
const ALERT_DAYS = 14;

export function inspectionStatus(lastInspectedAt: Date | string | null | undefined): InspectionStatus {
    if (!lastInspectedAt) return { level: "alert", label: "Не осматривалась" };

    const days = Math.floor((Date.now() - new Date(lastInspectedAt).getTime()) / 86_400_000);
    const level: AttentionLevel = days <= WARN_DAYS ? "ok" : days <= ALERT_DAYS ? "warn" : "alert";
    const label = days === 0 ? "осмотр сегодня" : days === 1 ? "осмотр вчера" : `${String(days)} дн. без осмотра`;

    return { level, label };
}
