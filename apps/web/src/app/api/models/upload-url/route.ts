import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { presignUpload } from "@/lib/storage";
import { handleError } from "@/lib/http";

const schema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().default("application/xml"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { filename, contentType } = schema.parse(await req.json());

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `models/${user.id}/${crypto.randomUUID()}-${safeName}`;
    const url = await presignUpload(key, contentType);

    return NextResponse.json({ key, url, expiresIn: 600 });
  } catch (err) {
    return handleError(err);
  }
}
