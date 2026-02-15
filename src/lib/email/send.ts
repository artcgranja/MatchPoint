import { resend } from "./resend";
import { ConnectionInviteEmail } from "./templates/connection-invite";
import { MagicLinkLoginEmail } from "./templates/magic-link-login";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "MatchPoint <noreply@matchpoint.ai>";

interface SendConnectionInviteParams {
  to: string;
  startupName: string;
  subject: string;
  body: string;
  inviteUrl: string;
  seekerCompany?: string;
}

export async function sendConnectionInvite(params: SendConnectionInviteParams) {
  if (!resend) {
    console.warn("[email] Resend not configured, skipping connection invite email");
    return null;
  }

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: params.subject,
    react: ConnectionInviteEmail({
      startupName: params.startupName,
      subject: params.subject,
      body: params.body,
      inviteUrl: params.inviteUrl,
      seekerCompany: params.seekerCompany,
    }),
  });

  if (error) {
    console.error("[email] Failed to send connection invite:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data?.id ?? null;
}

interface SendMagicLinkParams {
  to: string;
  loginUrl: string;
}

export async function sendMagicLink(params: SendMagicLinkParams) {
  if (!resend) {
    console.warn("[email] Resend not configured, skipping magic link email");
    return null;
  }

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: "Sign in to MatchPoint",
    react: MagicLinkLoginEmail({ loginUrl: params.loginUrl }),
  });

  if (error) {
    console.error("[email] Failed to send magic link:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data?.id ?? null;
}
