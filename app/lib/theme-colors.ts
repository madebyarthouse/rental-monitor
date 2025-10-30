/**
 * Theme colors extracted from moment.at website
 * These colors are used across the application for consistent theming
 */

export const themeColors = {
  arbeitswelt: {
    basic: "#e3546c",
    highlight: "#fd4bba",
    rgb: "rgb(227, 84, 108)",
  },
  demokratie: {
    basic: "#f08f7f",
    highlight: "#fd3102",
    rgb: "rgb(240, 143, 127)",
  },
  fortschritt: {
    basic: "#7695ea",
    highlight: "#123ce8",
    rgb: "rgb(118, 149, 234)",
  },
  gesundheit: {
    basic: "#80d9e5",
    highlight: "#00c5ff",
    rgb: "rgb(128, 217, 229)",
  },
  kapitalismus: {
    basic: "#f7bb74",
    highlight: "#ff8900",
    rgb: "rgb(247, 187, 116)",
  },
  klimakrise: {
    basic: "#8cd68c",
    highlight: "#75ed2e",
    rgb: "rgb(140, 214, 140)",
  },
  ungleichheit: {
    basic: "#ad9ad1",
    highlight: "#9d21ea",
    rgb: "rgb(173, 154, 209)",
  },
} as const;

/**
 * Chart color palette using theme colors
 * Colors are chosen to provide good contrast and visual distinction
 */
export const chartColors = {
  // Limited/Unlimited contracts
  limited: themeColors.arbeitswelt.basic, // Red/coral for limited contracts
  unlimited: themeColors.fortschritt.basic, // Blue for unlimited contracts

  // Price-related charts
  price: themeColors.kapitalismus.basic, // Orange/yellow for price data
  priceHighlight: themeColors.kapitalismus.highlight,

  // General data visualization
  primary: themeColors.arbeitswelt.basic,
  secondary: themeColors.fortschritt.basic,
  tertiary: themeColors.kapitalismus.basic,
  quaternary: themeColors.ungleichheit.basic,

  // Additional colors for multi-series charts
  series1: themeColors.arbeitswelt.basic,
  series2: themeColors.fortschritt.basic,
  series3: themeColors.kapitalismus.basic,
  series4: themeColors.gesundheit.basic,
  series5: themeColors.klimakrise.basic,
  series6: themeColors.ungleichheit.basic,
  series7: themeColors.demokratie.basic,
} as const;

