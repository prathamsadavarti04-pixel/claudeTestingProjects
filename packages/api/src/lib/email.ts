/**
 * Deliberately not the `resend` SDK — it's one fetch call, and this keeps
 * packages/api dependency-light. If RESEND_API_KEY isn't set, every call
 * here is a no-op: invites and review notifications still work, they just
 * aren't emailed (the invite link is always shown in-app as a fallback —
 * see components/settings/invite-dialog.tsx).
 */

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(input: SendEmailInput): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "ShipFlow AI <notifications@shipflow.example>";

  if (!apiKey) {
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { sent: false, reason: `Resend API returned ${res.status}: ${body.slice(0, 200)}` };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : "Unknown error" };
  }
}

export function inviteEmailHtml(opts: { workspaceName: string; inviterName: string; acceptUrl: string }): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0A1317;">You're invited to ${escapeHtml(opts.workspaceName)}</h2>
      <p style="color: #4E606F;">${escapeHtml(opts.inviterName)} invited you to join their workspace on ShipFlow AI.</p>
      <a href="${opts.acceptUrl}" style="display: inline-block; background: #3E481D; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; margin-top: 12px;">Accept invite</a>
      <p style="color: #A4B0BC; font-size: 13px; margin-top: 24px;">If you weren't expecting this, you can ignore this email.</p>
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
