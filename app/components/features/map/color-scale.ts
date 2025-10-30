export function createColorScale(min: number, max: number) {
  const clampedMin = Number.isFinite(min) ? min : 0;
  const clampedMax = Number.isFinite(max) && max !== min ? max : clampedMin + 1;

  return (value: number | null | undefined): string => {
    if (value == null || !Number.isFinite(value)) return "#B8C1CC"; // muted
    const t = Math.max(
      0,
      Math.min(1, (value - clampedMin) / (clampedMax - clampedMin))
    );
    // More vibrant colors: Green (#2A9D8F) → Yellow (#F4A261) → Red (#E63946)
    // Increased saturation for more vibrant appearance
    const stops = [
      { r: 0x2a, g: 0x9d, b: 0x8f }, // Green
      { r: 0xf4, g: 0xa2, b: 0x61 }, // Orange/Yellow (more vibrant)
      { r: 0xe6, g: 0x39, b: 0x46 }, // Red
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
