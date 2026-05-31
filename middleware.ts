import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*", "/api/crm/:path*", "/api/whatsapp/send", "/api/meta/sync"],
};
