import { NextRequest } from "next/server";
import {
  applyCacheHeaders,
  NO_CACHE,
  pickSubdomain,
  TILE_CACHE,
  TILE_FETCH_REVALIDATE,
} from "@/lib/cache-headers";
import { applyCors, corsPreflightResponse } from "@/lib/cors";

export const runtime = "edge";

export function OPTIONS() {
  return corsPreflightResponse();
}

export async function GET(
  request: NextRequest,
  { params }: { params: { z: string; x: string; y: string } },
) {
  const key = process.env.GAODE_API_KEY;
  if (!key) {
    return new Response("GAODE_API_KEY not configured", {
      status: 500,
      headers: applyCors(new Headers({ "Cache-Control": NO_CACHE })),
    });
  }

  const { z, x, y } = params;
  const { searchParams } = request.nextUrl;

  const style = searchParams.get("style") ?? "7";
  const lang = searchParams.get("lang") ?? "zh_cn";
  const size = searchParams.get("size") ?? "1";
  const scale = searchParams.get("scale") ?? "1";

  const subdomain = pickSubdomain(x, y);
  const gaodeUrl =
    `https://webrd${subdomain}.is.autonavi.com/appmaptile` +
    `?key=${encodeURIComponent(key)}` +
    `&lang=${encodeURIComponent(lang)}` +
    `&size=${encodeURIComponent(size)}` +
    `&scale=${encodeURIComponent(scale)}` +
    `&style=${encodeURIComponent(style)}` +
    `&x=${encodeURIComponent(x)}` +
    `&y=${encodeURIComponent(y)}` +
    `&z=${encodeURIComponent(z)}`;

  try {
    const response = await fetch(gaodeUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Immich-Proxy/1.0)",
      },
      next: { revalidate: TILE_FETCH_REVALIDATE },
    });

    if (!response.ok) {
      return new Response("Proxy error", {
        status: response.status,
        headers: applyCors(new Headers({ "Cache-Control": NO_CACHE })),
      });
    }

    const buffer = await response.arrayBuffer();
    const headers = applyCors(
      new Headers({
        "Content-Type": response.headers.get("content-type") ?? "image/png",
      }),
    );
    applyCacheHeaders(headers, TILE_CACHE);

    return new Response(buffer, { headers });
  } catch (error) {
    console.error("Tile proxy failed:", error);
    return new Response("Proxy failed", {
      status: 500,
      headers: applyCors(new Headers({ "Cache-Control": NO_CACHE })),
    });
  }
}
