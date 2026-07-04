/** 瓦片：同一 z/x/y 内容基本不变，CDN 长缓存 + 浏览器中等缓存 */
export const TILE_CACHE = {
  browser: "public, max-age=604800, stale-while-revalidate=86400",
  cdn: "public, max-age=2592000, stale-while-revalidate=86400",
} as const;

/** Style JSON：按 query 区分，变更少，CDN 一天、浏览器短缓存 */
export const STYLE_CACHE = {
  browser: "public, max-age=3600, stale-while-revalidate=86400",
  cdn: "public, max-age=86400, stale-while-revalidate=604800",
} as const;

export const NO_CACHE = "no-store";

export function applyCacheHeaders(
  headers: Headers,
  cache: { browser: string; cdn: string },
): void {
  headers.set("Cache-Control", cache.browser);
  headers.set("CDN-Cache-Control", cache.cdn);
}

/** 上游 fetch 复用 Next.js Data Cache，减少回源高德 */
export const TILE_FETCH_REVALIDATE = 60 * 60 * 24 * 30; // 30 days

export function pickSubdomain(x: string, y: string): string {
  const subdomains = ["01", "02", "03", "04"];
  const hash = (parseInt(x, 10) + parseInt(y, 10)) % subdomains.length;
  return subdomains[Math.abs(hash)];
}
