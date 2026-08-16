const nodemailer = require('nodemailer');

/**
 * Transactional email sender with two interchangeable transports.
 *
 * SMTP (preferred for this project) — set:
 *   SMTP_USER   your full Gmail address
 *   SMTP_PASS   a Google App Password, NOT your normal password
 *   MAIL_FROM   optional display name, e.g. "MCO <you@gmail.com>"
 *
 * Resend (HTTP API) — set:
 *   RESEND_API_KEY
 *   MAIL_FROM
 *
 * SMTP is tried first because Resend's shared `onboarding@resend.dev` sender
 * only delivers to the account owner's own address, so password reset would
 * silently fail for every other user. Sending through your own mailbox
 * reaches anyone without needing a verified domain.
 *
 * With neither configured the message is logged to the server console, which
 * keeps local development working but delivers nothing.
 */
const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const smtpConfigured = () =>
  Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

const resendConfigured = () => Boolean(process.env.RESEND_API_KEY);

function isConfigured() {
  return smtpConfigured() || resendConfigured();
}

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_PORT || '465') === '465',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

function fromAddress() {
  if (process.env.MAIL_FROM) return process.env.MAIL_FROM;
  if (smtpConfigured()) return `MCO <${process.env.SMTP_USER}>`;
  return 'MCO <onboarding@resend.dev>';
}

async function sendViaSmtp({ to, subject, html, text }) {
  try {
    await getTransporter().sendMail({ from: fromAddress(), to, subject, html, text });
    return { delivered: true, via: 'smtp' };
  } catch (error) {
    console.error('SMTP delivery error:', error.message);
    return { delivered: false, reason: 'smtp_error' };
  }
}

async function sendViaResend({ to, subject, html, text }) {
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: fromAddress(), to: [to], subject, html, text }),
    });

    if (!res.ok) {
      console.error(`Resend delivery failed (${res.status}): ${await res.text()}`);
      return { delivered: false, reason: 'provider_error' };
    }

    return { delivered: true, via: 'resend' };
  } catch (error) {
    console.error('Resend delivery error:', error.message);
    return { delivered: false, reason: 'network_error' };
  }
}

async function sendMail({ to, subject, html, text }) {
  if (smtpConfigured()) return sendViaSmtp({ to, subject, html, text });
  if (resendConfigured()) return sendViaResend({ to, subject, html, text });

  console.log(
    '\n--- EMAIL NOT SENT (no mail transport configured) ---\n' +
    `To:      ${to}\n` +
    `Subject: ${subject}\n` +
    `${text}\n` +
    '-----------------------------------------------------\n'
  );
  return { delivered: false, reason: 'not_configured' };
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
      <p style="font-size:22px;font-weight:800;color:#2E5FA3;letter-spacing:2px;margin-bottom:24px">MCO</p>
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
