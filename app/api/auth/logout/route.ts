import { clearSessionCookie } from "@/src/server/auth";
import { json } from "@/src/server/http";

export function POST() {
  return json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": clearSessionCookie(),
      },
    },
  );
}
