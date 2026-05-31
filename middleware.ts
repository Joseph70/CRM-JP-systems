import { NextRequest, NextResponse } from "next/server";

const cookieName = "jp_crm_session";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(cookieName)?.value;
  const isValid = await verifySessionToken(token);

  if (isValid) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: ["/portal/:path*", "/api/crm/:path*", "/api/whatsapp/send", "/api/meta/sync"],
};

async function verifySessionToken(token?: string) {
  if (!token) return false;

  const [payload, signature] = token.split(".");

  if (!payload || !signature) return false;

  const currentSecret = process.env.SESSION_SECRET ?? "dev-only-change-me";
  const previousSecret = process.env.SESSION_SECRET_PREVIOUS || undefined;

  return (
    (await signatureMatches(payload, signature, currentSecret)) ||
    (previousSecret ? await signatureMatches(payload, signature, previousSecret) : false)
  );
}

async function signatureMatches(payload: string, signature: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const expected = base64Url(new Uint8Array(signed));
  return timingSafeEqual(signature, expected);
}

function base64Url(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}
