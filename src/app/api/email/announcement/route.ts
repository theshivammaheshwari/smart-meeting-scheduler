import { NextRequest, NextResponse } from "next/server";
import { sendAnnouncementEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { emails, groupName, title, content, authorName } = await req.json();

    if (!emails || !Array.isArray(emails) || !groupName || !title || !content) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const batch = emails.slice(0, 50);
    await Promise.allSettled(
      batch.map((email: string) =>
        sendAnnouncementEmail(email, groupName, title, content, authorName || "Admin")
      )
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
