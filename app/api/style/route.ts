import { NextRequest } from "next/server";
import { applyCacheHeaders, NO_CACHE, STYLE_CACHE } from "@/lib/cache-headers";
import { applyCors, corsPreflightResponse } from "@/lib/cors";
import {
  buildMapStyle,
  getBaseUrl,
  isValidHexColor,
  type MapTheme,
} from "@/lib/map-style";

export const runtime = "edge";

function parseTheme(value: string | null): MapTheme | null {
  if (value === "light" || value === "dark") {
    return value;
  }
  return null;
}

export function OPTIONS() {
  return corsPreflightResponse();
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const theme = parseTheme(searchParams.get("theme") ?? "light");
  if (!theme) {
    return Response.json(
      { error: "theme must be light or dark" },
      {
        status: 400,
        headers: applyCors(new Headers({ "Cache-Control": NO_CACHE })),
      },
    );
  }

  const backgroundColor =
    searchParams.get("bg") ??
    searchParams.get("background") ??
    searchParams.get("background-color");

  if (backgroundColor && !isValidHexColor(backgroundColor)) {
    return Response.json(
      { error: "background color must be a hex value like #f8f4f0" },
      {
        status: 400,
        headers: applyCors(new Headers({ "Cache-Control": NO_CACHE })),
      },
    );
  }

  const style = buildMapStyle({
    baseUrl: getBaseUrl(request),
    theme,
    backgroundColor: backgroundColor ?? undefined,
  });

  const headers = applyCors(new Headers({ "Content-Type": "application/json" }));
  applyCacheHeaders(headers, STYLE_CACHE);

  return Response.json(style, { headers });
}
