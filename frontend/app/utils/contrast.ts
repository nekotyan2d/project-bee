import { hexToRgb } from "./hiveColors";

export function relativeLuminance(hex: string): number {
    const { r, g, b } = hexToRgb(hex);

    const lin = (c: number): number => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };

    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(hex1: string, hex2: string): number {
    const l1 = relativeLuminance(hex1);
    const l2 = relativeLuminance(hex2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function readableTextColors(background: string): { text: string; muted: string } {
    const onWhite = contrastRatio(background, "#fff");
    const onBlack = contrastRatio(background, "#000");
    return onWhite >= onBlack
        ? { text: "#fff", muted: "rgba(255,255,255,0.75)" }
        : { text: "#000", muted: "rgba(0,0,0,0.75)" };
}
