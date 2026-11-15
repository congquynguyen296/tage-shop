import "server-only";
import { AUTH_CONFIG } from "@/config/auth";

export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Transactional email dispatcher for verification and password reset links.
 * Automatically uses RESEND_API_KEY when present, falling back to local dev console logger.
 */
export async function sendAuthEmail({
  to,
  subject,
  text,
  html,
}: SendEmailParams): Promise<void> {
  const { resendApiKey, resendApiUrl, from } = AUTH_CONFIG.email;

  if (resendApiKey) {
    try {
      const res = await fetch(resendApiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to,
          subject,
          text,
          html,
        }),
      });

      if (!res.ok) {
        console.error("Resend API error:", await res.text());
      }
    } catch (err) {
      console.error("Failed to send transactional email:", err);
    }
  } else {
    console.log("--------------------------------------------------");
    console.log(`[AUTH EMAIL SIMULATION] To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text Body: ${text}`);
    console.log("--------------------------------------------------");
  }
}
