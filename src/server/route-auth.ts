import type { NextRequest } from "next/server";
import { canAccessWorkspace, getSessionFromRequest, hasRole, type SessionUser } from "./auth";
import { apiError } from "./http";
import type { Role } from "./types";

export function requireSession(request: NextRequest) {
  const user = getSessionFromRequest(request);

  if (!user) {
    return { ok: false as const, response: apiError("No autenticado.", 401) };
  }

  return { ok: true as const, user };
}

export function requireRole(request: NextRequest, role: Role) {
  const session = requireSession(request);

  if (!session.ok) {
    return session;
  }

  if (!hasRole(session.user, role)) {
    return { ok: false as const, response: apiError("Permisos insuficientes.", 403) };
  }

  return session;
}

export function getWorkspaceScope(user: SessionUser, requestedWorkspaceId?: string) {
  if (requestedWorkspaceId) {
    if (!canAccessWorkspace(user, requestedWorkspaceId)) {
      return { ok: false as const, response: apiError("No tienes acceso a este cliente.", 403) };
    }

    return { ok: true as const, workspaceIds: [requestedWorkspaceId] };
  }

  return {
    ok: true as const,
    workspaceIds: user.role === "SUPER_ADMIN" ? undefined : user.workspaceIds,
  };
}

export function canReadWorkspaceId(user: SessionUser, workspaceId?: string) {
  return Boolean(workspaceId) && canAccessWorkspace(user, workspaceId!);
}
