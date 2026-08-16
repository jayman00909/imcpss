/**
 * Minimal transactional email sender.
 *
 * Uses Resend's HTTP API via fetch, so there is no extra dependency to install.
 * Configure with:
 *   RESEND_API_KEY   your Resend API key
 *   MAIL_FROM        verified sender, e.g. "MCO <noreply@yourdomain.com>"
 *
 * If RESEND_API_KEY is not set the message is logged to the server console
 * instead of being sent. That keeps local development working without an
 * account, but it means password reset links are NOT delivered until the key
 * is configured — see DEPLOYMENT.md.
 */
const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function isConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

async function sendMail({ to, subject, html, text }) {
  if (!isConfigured()) {
    console.log(
      '\n--- EMAIL NOT SENT (RESEND_API_KEY not configured) ---\n' +
      `To:      ${to}\n` +
      `Subject: ${subject}\n` +
      `${text}\n` +
      '------------------------------------------------------\n'
    );
    return { delivered: false, reason: 'not_configured' };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || 'MCO <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error(`Email delivery failed (${res.status}): ${detail}`);
      return { delivered: false, reason: 'provider_error' };
    }

    return { delivered: true };
  } catch (error) {
    console.error('Email delivery error:', error.message);
    return { delivered: false, reason: 'network_error' };
  }
}

function passwordResetEmail({ fullName, resetUrl }) {
  const text =
    `Hello ${fullName},\n\n` +
    `We received a request to reset your MCO password.\n\n` +
    `Open this link to choose a new password:\n${resetUrl}\n\n` +
    `The link expires in 1 hour and can only be used once.\n\n` +
    `If you did not request this, you can ignore this email — your password ` +
    `will not change.\n\nMCO — Multi-Criteria Optimization Scheduling`;

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a2e">
      <p style="font-size:22px;font-weight:800;color:#2E5FA3;letter-spacing:2px;margin-bottom:24px">🗂 MCO</p>
      <p style="font-size:16px;font-weight:600">Reset your password</p>
      <p style="font-size:14px;line-height:1.6;color:#4b5563">
        Hello ${fullName}, we received a request to reset your MCO password.
      </p>
      <p style="margin:26px 0">
        <a href="${resetUrl}"
           style="background:#2E5FA3;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block">
          Choose a new password
        </a>
      </p>
      <p style="font-size:13px;color:#6b7280;line-height:1.6">
        This link expires in 1 hour and can only be used once.
        If you did not request it, you can ignore this email — your password will not change.
      </p>
      <p style="font-size:12px;color:#9ca3af;word-break:break-all;margin-top:20px">
        If the button does not work, paste this into your browser:<br />${resetUrl}
      </p>
    </div>`;

  return { subject: 'Reset your MCO password', text, html };
}

module.exports = { sendMail, passwordResetEmail, isConfigured };
