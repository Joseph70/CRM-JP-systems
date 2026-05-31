import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyMetaSignature(rawBody: string, signatureHeader: string | null, appSecret?: string) {
  if (!appSecret) {
    return { ok: true, skipped: true };
  }

  if (!signatureHeader?.startsWith("sha256=")) {
    return { ok: false, skipped: false };
  }

  const received = signatureHeader.slice("sha256=".length);
  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const receivedBuffer = Buffer.from(received, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return {
    ok:
      receivedBuffer.length === expectedBuffer.length &&
      timingSafeEqual(receivedBuffer, expectedBuffer),
    skipped: false,
  };
}
