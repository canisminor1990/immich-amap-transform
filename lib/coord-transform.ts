const PI = Math.PI;
const A = 6378245.0;
const EE = 0.00669342162296594323;

function outOfChina(lng: number, lat: number): boolean {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

function transformLat(lng: number, lat: number): number {
  let ret =
    -100.0 +
    2.0 * lng +
    3.0 * lat +
    0.2 * lat * lat +
    0.1 * lng * lat +
    0.2 * Math.sqrt(Math.abs(lng));
  ret +=
    ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) *
      2.0) /
    3.0;
  ret +=
    ((20.0 * Math.sin(lat * PI) + 40.0 * Math.sin((lat / 3.0) * PI)) * 2.0) /
    3.0;
  ret +=
    ((160.0 * Math.sin((lat / 12.0) * PI) +
      320 * Math.sin((lat * PI) / 30.0)) *
      2.0) /
    3.0;
  return ret;
}

function transformLng(lng: number, lat: number): number {
  let ret =
    300.0 +
    lng +
    2.0 * lat +
    0.1 * lng * lng +
    0.1 * lng * lat +
    0.1 * Math.sqrt(Math.abs(lng));
  ret +=
    ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) *
      2.0) /
    3.0;
  ret +=
    ((20.0 * Math.sin(lng * PI) + 40.0 * Math.sin((lng / 3.0) * PI)) * 2.0) /
    3.0;
  ret +=
    ((150.0 * Math.sin((lng / 12.0) * PI) +
      300.0 * Math.sin((lng / 30.0) * PI)) *
      2.0) /
    3.0;
  return ret;
}

export function wgs84ToGcj02(
  lng: number,
  lat: number,
): { lng: number; lat: number } {
  if (outOfChina(lng, lat)) {
    return { lng, lat };
  }

  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLng = transformLng(lng - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);

  dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI);
  dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI);

  return {
    lng: lng + dLng,
    lat: lat + dLat,
  };
}

function tileXToLng(x: number, z: number): number {
  return (x / 2 ** z) * 360 - 180;
}

function tileYToLat(y: number, z: number): number {
  const n = PI - (2 * PI * y) / 2 ** z;
  return (180 / PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function lngToTileX(lng: number, z: number): number {
  return ((lng + 180) / 360) * 2 ** z;
}

function latToTileY(lat: number, z: number): number {
  const latRad = (lat * PI) / 180;
  return (
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / PI) / 2) * 2 ** z
  );
}

function clampTile(value: number, z: number): number {
  const max = 2 ** z - 1;
  return Math.min(Math.max(value, 0), max);
}

export function mapWgsTileToGcjTile(
  z: number,
  x: number,
  y: number,
): { x: number; y: number } {
  // Use tile center for coordinate transform, then map back to target tile.
  const wgsLng = tileXToLng(x + 0.5, z);
  const wgsLat = tileYToLat(y + 0.5, z);
  const gcj = wgs84ToGcj02(wgsLng, wgsLat);

  const mappedX = Math.floor(lngToTileX(gcj.lng, z));
  const mappedY = Math.floor(latToTileY(gcj.lat, z));

  return {
    x: clampTile(mappedX, z),
    y: clampTile(mappedY, z),
  };
}
