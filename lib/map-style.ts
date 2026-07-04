export type MapTheme = "light" | "dark";

const THEME_DEFAULTS: Record<
  MapTheme,
  { backgroundColor: string; gaodeStyle: string; name: string }
> = {
  light: {
    backgroundColor: "#f8f4f0",
    gaodeStyle: "7",
    name: "Gaode-Immich-Light",
  },
  dark: {
    backgroundColor: "#0d1117",
    gaodeStyle: "7",
    name: "Gaode-Immich-Dark",
  },
};

export function isValidHexColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color);
}

export function buildMapStyle(options: {
  baseUrl: string;
  theme?: MapTheme;
  backgroundColor?: string;
}) {
  const theme = options.theme ?? "light";
  const defaults = THEME_DEFAULTS[theme];
  const darkRasterPaint =
    theme === "dark"
      ? {
          // appmaptile does not expose JS API dark theme directly for raster use.
          // Use a dark raster transform to approximate dark-mode basemap in Immich.
          "raster-saturation": -0.85,
          "raster-contrast": 0.35,
          "raster-brightness-min": 0.02,
          "raster-brightness-max": 0.58,
        }
      : undefined;

  return {
    version: 8 as const,
    name: defaults.name,
    sources: {
      gaode: {
        type: "raster" as const,
        tiles: [
          `${options.baseUrl}/api/tile/{z}/{x}/{y}?style=${defaults.gaodeStyle}`,
        ],
        tileSize: 256,
      },
    },
    layers: [
      {
        id: "background",
        type: "background" as const,
        paint: {
          "background-color":
            options.backgroundColor ?? defaults.backgroundColor,
        },
      },
      {
        id: "gaode",
        type: "raster" as const,
        source: "gaode",
        ...(darkRasterPaint ? { paint: darkRasterPaint } : {}),
      },
    ],
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  };
}

export function getBaseUrl(request: Request): string {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";

  if (host) {
    return `${proto}://${host}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}
