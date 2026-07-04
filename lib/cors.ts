export function applyCors(headers: Headers = new Headers()): Headers {
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
  headers.set("Access-Control-Max-Age", "86400");
  return headers;
}

export function corsPreflightResponse(): Response {
  return new Response(null, { status: 204, headers: applyCors() });
}
