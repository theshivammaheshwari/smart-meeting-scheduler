import { NextRequest, NextResponse } from "next/server";
import { sendMeetingScheduledEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { emails, groupName, day, time } = await req.json();

    if (!emails || !Array.isArray(emails) || !groupName || !day || !time) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const batch = emails.slice(0, 50);
    await Promise.allSettled(
      batch.map((email: string) => sendMeetingScheduledEmail(email, groupName, day, time))
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
