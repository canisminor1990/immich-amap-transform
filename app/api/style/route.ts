import { NextRequest } from "next/server";
import {
  buildMapStyle,
  getBaseUrl,
  isValidHexColor,
  type MapTheme,
} from "@/lib/map-style";

function parseTheme(value: string | null): MapTheme | null {
  if (value === "light" || value === "dark") {
    return value;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const theme = parseTheme(searchParams.get("theme") ?? "light");
  if (!theme) {
    return Response.json(
      { error: "theme must be light or dark" },
      { status: 400 },
    );
  }

  const backgroundColor =
    searchParams.get("bg") ??
    searchParams.get("background") ??
    searchParams.get("background-color");

  if (backgroundColor && !isValidHexColor(backgroundColor)) {
    return Response.json(
      { error: "background color must be a hex value like #f8f4f0" },
      { status: 400 },
    );
  }

  const style = buildMapStyle({
    baseUrl: getBaseUrl(request),
    theme,
    backgroundColor: backgroundColor ?? undefined,
  });

  return Response.json(style, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
