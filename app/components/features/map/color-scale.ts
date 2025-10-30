export type ColorScaleOptions = {
  alpha?: number; // 0..1 transparency, optional
};

const HEATMAP_COLORS: readonly string[] = [
  "#529F86", // good
  "#6ed0b1", // low-good
  "#F4A262", // medium
  "#E94E4B", // low-bad
  "#E94E4B", // bad
];

function applyAlpha(hex: string, alpha?: number): string {
  if (alpha == null || alpha >= 1) return hex;
  const a = Math.max(0, Math.min(1, alpha));
  const aa = Math.round(a * 255)
    .toString(16)
    .padStart(2, "0");
  // Use 8-digit hex #RRGGBBAA for alpha support
  return `${hex}${aa}`;
}

export function createColorScale(
  min: number,
  max: number,
  options?: ColorScaleOptions
) {
  const clampedMin = Number.isFinite(min) ? min : 0;
  const clampedMax = Number.isFinite(max) && max !== min ? max : clampedMin + 1;
  const palette = HEATMAP_COLORS.map((c) => applyAlpha(c, options?.alpha));

  return (value: number | null | undefined): string => {
    if (value == null || !Number.isFinite(value)) return "#B8C1CC"; // muted
    const v = value as number;

    // Match HeatmapLegend buckets exactly for known modes
    // limitedPercentage → 0–20, 21–40, 41–60, 61–80, 81–100+
    if (clampedMin === 0 && clampedMax === 100) {
      const idx = v <= 20 ? 0 : v <= 40 ? 1 : v <= 60 ? 2 : v <= 80 ? 3 : 4;
      return palette[idx];
    }
    // avgPricePerSqm → 0–5, 5–10, 10–15, 15–20, 20+
    if (clampedMin === 0 && clampedMax === 20) {
      const idx = v <= 5 ? 0 : v <= 10 ? 1 : v <= 15 ? 2 : v <= 20 ? 3 : 4;
      return palette[idx];
    }

    // Default: 5 equal steps across [min, max]
    const t = Math.max(
      0,
      Math.min(1, (v - clampedMin) / (clampedMax - clampedMin))
    );
    const idx = Math.min(
      palette.length - 1,
      Math.max(0, Math.floor(t * palette.length))
    );
    return palette[idx];
  };
}
