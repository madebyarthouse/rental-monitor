export function createColorScale(min: number, max: number) {
  const clampedMin = Number.isFinite(min) ? min : 0;
  const clampedMax = Number.isFinite(max) && max !== min ? max : clampedMin + 1;

  return (value: number | null | undefined): string => {
    if (value == null || !Number.isFinite(value)) return "#B8C1CC"; // muted
    const t = Math.max(
      0,
      Math.min(1, (value - clampedMin) / (clampedMax - clampedMin))
    );
    // Green (#2A9D8F) → Yellow (#E9C46A) → Red (#E63946)
    const stops = [
      { r: 0x2a, g: 0x9d, b: 0x8f },
      { r: 0xe9, g: 0xc4, b: 0x6a },
      { r: 0xe6, g: 0x39, b: 0x46 },
    ];
    const seg = t <= 0.5 ? 0 : 1;
    const localT = t <= 0.5 ? t * 2 : (t - 0.5) * 2;
    const a = stops[seg];
    const b = stops[seg + 1];
    const r = Math.round(a.r + (b.r - a.r) * localT)
      .toString(16)
      .padStart(2, "0");
    const g = Math.round(a.g + (b.g - a.g) * localT)
      .toString(16)
      .padStart(2, "0");
    const bl = Math.round(a.b + (b.b - a.b) * localT)
      .toString(16)
      .padStart(2, "0");
    return `#${r}${g}${bl}`;
  };
}
