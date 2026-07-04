import { NextRequest } from "next/server";
import {
  applyCacheHeaders,
  NO_CACHE,
  pickSubdomain,
  TILE_CACHE,
  TILE_FETCH_REVALIDATE,
} from "@/lib/cache-headers";
import { mapWgsTileToGcjTile } from "@/lib/coord-transform";
import { applyCors, corsPreflightResponse } from "@/lib/cors";
import { getHotTile, setHotTile } from "@/lib/hot-tile-cache";

export const runtime = "nodejs";
export const preferredRegion = ["hkg1", "sin1"];

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
  const useWgsToGcj = searchParams.get("transform") !== "0";

  const zNum = Number.parseInt(z, 10);
  const xNum = Number.parseInt(x, 10);
  const yNum = Number.parseInt(y, 10);
  if (
    !Number.isFinite(zNum) ||
    !Number.isFinite(xNum) ||
    !Number.isFinite(yNum) ||
    zNum < 0
  ) {
    return new Response("Invalid z/x/y", {
      status: 400,
      headers: applyCors(new Headers({ "Cache-Control": NO_CACHE })),
    });
  }

  const style = searchParams.get("style") ?? "7";
  const lang = searchParams.get("lang") ?? "zh_cn";
  const size = searchParams.get("size") ?? "1";
  const scale = searchParams.get("scale") ?? "1";

  const mapped = useWgsToGcj
    ? mapWgsTileToGcjTile(zNum, xNum, yNum)
    : { x: xNum, y: yNum };
  const hotCacheKey = [
    zNum,
    mapped.x,
    mapped.y,
    style,
    lang,
    size,
    scale,
    useWgsToGcj ? "t1" : "t0",
  ].join(":");
  const hot = getHotTile(hotCacheKey);
  if (hot) {
    const headers = applyCors(
      new Headers({
        "Content-Type": hot.contentType,
        "X-Proxy-Cache": "hot-memory-hit",
      }),
    );
    applyCacheHeaders(headers, TILE_CACHE);
    return new Response(hot.body.slice(0), { headers });
  }

  const subdomain = pickSubdomain(String(mapped.x), String(mapped.y));
  const gaodeUrl =
    `https://webrd${subdomain}.is.autonavi.com/appmaptile` +
    `?key=${encodeURIComponent(key)}` +
    `&lang=${encodeURIComponent(lang)}` +
    `&size=${encodeURIComponent(size)}` +
    `&scale=${encodeURIComponent(scale)}` +
    `&style=${encodeURIComponent(style)}` +
    `&x=${encodeURIComponent(String(mapped.x))}` +
    `&y=${encodeURIComponent(String(mapped.y))}` +
    `&z=${encodeURIComponent(z)}`;

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 3500);
  try {
    const response = await fetch(gaodeUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Immich-Proxy/1.0)",
      },
      signal: abortController.signal,
      next: { revalidate: TILE_FETCH_REVALIDATE },
    });

    if (!response.ok) {
      return new Response("Proxy error", {
        status: response.status,
        headers: applyCors(new Headers({ "Cache-Control": NO_CACHE })),
      });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") ?? "image/png";
    setHotTile(hotCacheKey, buffer, contentType);
    const headers = applyCors(
      new Headers({
        "Content-Type": contentType,
        "X-Proxy-Cache": "miss",
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
  } finally {
    clearTimeout(timeout);
  }
}
