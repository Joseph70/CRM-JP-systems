import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { NextRequest } from "next/server";
import type { Role } from "./types";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  workspaceIds: string[];
  expiresAt?: number;
};

const cookieName = "jp_crm_session";
export const defaultSessionUser: SessionUser = {
  id: "user_admin",
  email: "admin@jpsistems.local",
  name: "JP Admin",
  role: "SUPER_ADMIN",
  workspaceIds: [],
};
const scryptAsync = promisify(scrypt);
const roleRank: Record<Role, number> = {
  VIEWER: 1,
  OPERATOR: 2,
  CLIENT_ADMIN: 3,
  AGENCY_ADMIN: 4,
  SUPER_ADMIN: 5,
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production.");
  }

  return secret ?? "dev-only-change-me";
}

function getPreviousSecret() {
  return process.env.SESSION_SECRET_PREVIOUS || undefined;
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string, secret = getSecret()) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(user: SessionUser) {
  const payload = toBase64Url(
    JSON.stringify({
      ...user,
      expiresAt: user.expiresAt ?? Date.now() + 7 * 24 * 60 * 60 * 1000,
    }),
  );
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token?: string): SessionUser | undefined {
  if (!token) {
    return undefined;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return undefined;
  }

  const expected = sign(payload);
  const previousSecret = getPreviousSecret();
  const previousExpected = previousSecret ? sign(payload, previousSecret) : undefined;
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  const previousBuffer = previousExpected ? Buffer.from(previousExpected) : undefined;

  if (
    (receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)) &&
    (!previousBuffer ||
      receivedBuffer.length !== previousBuffer.length ||
      !timingSafeEqual(receivedBuffer, previousBuffer))
  ) {
    return undefined;
  }

  try {
    const user = JSON.parse(fromBase64Url(payload)) as SessionUser;

    if (!user.expiresAt || user.expiresAt < Date.now()) {
      return undefined;
    }

    return user;
  } catch {
    return undefined;
  }
}

export function getSessionFromRequest(request: NextRequest): SessionUser | undefined {
  return verifySessionToken(request.cookies.get(cookieName)?.value) ?? defaultSessionUser;
}

export function sessionCookie(token: string) {
  return `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${cookieSecureFlag()}`;
}

export function clearSessionCookie() {
  return `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${cookieSecureFlag()}`;
}

export function hasRole(user: SessionUser, minimumRole: Role) {
  return roleRank[user.role] >= roleRank[minimumRole];
}

export function canAccessWorkspace(user: SessionUser, workspaceId: string) {
  return user.role === "SUPER_ADMIN" || user.workspaceIds.includes(workspaceId);
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [scheme, salt, hash] = storedHash.split("$");

  if (scheme !== "scrypt" || !salt || !hash) {
    return false;
  }

  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const received = Buffer.from(hash, "base64url");

  return received.length === derived.length && timingSafeEqual(received, derived);
}

export function isRequestHttps(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  return request.nextUrl.protocol === "https:" || forwardedProto === "https";
}

export function enforceHttps(request: NextRequest) {
  return process.env.NODE_ENV !== "production" || isRequestHttps(request);
}

function cookieSecureFlag() {
  return process.env.NODE_ENV === "production" ? "; Secure" : "";
}
