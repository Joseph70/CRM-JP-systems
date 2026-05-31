import { json } from "@/src/server/http";

export function GET() {
  return json({
    status: "ok",
    service: "crm-base-backend",
    timestamp: new Date().toISOString(),
  });
}
