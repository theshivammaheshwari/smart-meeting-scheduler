import { NextRequest, NextResponse } from "next/server";
import { sendInviteEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { emails, groupName, inviterName } = await req.json();

    if (!emails || !Array.isArray(emails) || !groupName || !inviterName) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Send emails in parallel (max 10 at a time)
    const batch = emails.slice(0, 10);
    await Promise.allSettled(
      batch.map((email: string) => sendInviteEmail(email, groupName, inviterName))
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
