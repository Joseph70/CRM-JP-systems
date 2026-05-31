import { NextRequest } from "next/server";
import { createSessionToken, enforceHttps, sessionCookie, verifyPassword } from "@/src/server/auth";
import { apiError, json, parseJson } from "@/src/server/http";
import { crmStore } from "@/src/server/store";
import { asObject, readString } from "@/src/server/validation";

export async function POST(request: NextRequest) {
  if (!enforceHttps(request)) {
    return apiError("HTTPS es obligatorio en produccion.", 426);
  }

  const source = asObject(await parseJson(request));
  const errors: Record<string, string> = {};
  const email = readString(source, "email", errors, { required: true, maxLength: 160 });
  const password = readString(source, "password", errors, { required: true, maxLength: 120 });

  if (Object.keys(errors).length > 0) {
    return apiError("Datos invalidos.", 422, errors);
  }

  const user = await crmStore.findUserByEmail(email!);

  if (!user || !(await verifyPassword(password!, user.passwordHash))) {
    return apiError("Credenciales invalidas.", 401);
  }

  const memberships = await crmStore.getUserMemberships(user.id);
  const role = await crmStore.getUserPrimaryRole(user.id);
  const token = createSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role,
    workspaceIds: memberships.map((membership) => membership.workspaceId),
  });

  await crmStore.recordAuditLog({
    actorUserId: user.id,
    action: "auth.login",
    entityType: "User",
    entityId: user.id,
  });

  return json(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role,
        workspaceIds: memberships.map((membership) => membership.workspaceId),
      },
    },
    {
      headers: {
        "Set-Cookie": sessionCookie(token),
      },
    },
  );
}
