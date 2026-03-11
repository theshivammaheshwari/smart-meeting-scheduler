import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "SmartSync <onboarding@resend.dev>";

export async function sendInviteEmail(toEmail: string, groupName: string, inviterName: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `You're invited to join "${groupName}" on SmartSync`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="color: #2563eb; margin-bottom: 8px;">📩 Group Invite</h2>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            <strong>${inviterName}</strong> has invited you to join <strong>"${groupName}"</strong> on SmartSync.
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            Login to your SmartSync dashboard to accept the invite and start scheduling!
          </p>
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px;">— SmartSync Team</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("Email send error (invite):", err);
  }
}

export async function sendMeetingScheduledEmail(
  toEmail: string,
  groupName: string,
  day: string,
  time: string
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `Meeting Scheduled: ${groupName} — ${day} at ${time}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="color: #16a34a; margin-bottom: 8px;">✅ Meeting Confirmed</h2>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            A meeting has been scheduled for <strong>"${groupName}"</strong>.
          </p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; color: #166534; font-size: 16px; font-weight: 600;">
              📅 ${day} at ${time}
            </p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Visit SmartSync to view the meeting details and join link.
          </p>
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px;">— SmartSync Team</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("Email send error (meeting):", err);
  }
}

export async function sendAnnouncementEmail(
  toEmail: string,
  groupName: string,
  title: string,
  content: string,
  authorName: string
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `📢 Announcement in "${groupName}": ${title}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="color: #2563eb; margin-bottom: 8px;">📢 New Announcement</h2>
          <p style="color: #6b7280; font-size: 13px; margin-bottom: 16px;">
            ${authorName} posted in <strong>"${groupName}"</strong>
          </p>
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h3 style="margin: 0 0 8px; color: #92400e; font-size: 15px;">${title}</h3>
            <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">${content}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Open SmartSync to view and respond.
          </p>
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px;">— SmartSync Team</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("Email send error (announcement):", err);
  }
}
