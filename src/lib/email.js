// -------------------------------------------------------------
// Email Service - Resend Integration
// -------------------------------------------------------------
//
// WHAT THIS FILE DOES:
// Sends transactional emails via Resend.
//
// DEVELOPMENT MODE:
//   In dev, we DON'T actually send. We log the email to the
//   terminal, extract any links, and return a mock result.
//   This means:
//     - No Resend API calls during development
//     - No rate limits
//     - You can test with any recipient email
//     - Copy the invite link from your terminal
//
// PRODUCTION MODE:
//   Sends via Resend's HTTP API (not SMTP — this is key for
//   Vercel's serverless environment).
//
// WHY THIS PATTERN:
// Real email testing is slow and messy during development.
// Console logging gives you everything you need — email body,
// subject, and crucially the invitation link — instantly.
// -------------------------------------------------------------

import { Resend } from 'resend';

// -------------------------------------------------------------
// LAZY INITIALIZATION
// -------------------------------------------------------------
// We don't instantiate Resend at module load because:
//   1. In dev mode we never use it
//   2. If the API key is missing, we want a clear error
//      at send-time, not import-time
//
// `let` (not `const`) so we can cache the instance after
// first use.
let resendClient = null;

function getResendClient() {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      '[email] RESEND_API_KEY is not set. Add it to .env.local (dev) or Vercel env vars (prod).'
    );
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

// -------------------------------------------------------------
// SEND EMAIL
// -------------------------------------------------------------
// Main entry point. Everything else in the app calls this.
//
// Input:
//   to      - recipient email
//   subject - email subject line
//   html    - HTML body
//   text    - optional plain-text fallback
//
// Output:
//   { id, skipped?, error? }
export async function sendEmail({ to, subject, html, text }) {
  // ─── Dev mode: log to console, don't send ───
  if (process.env.NODE_ENV === 'development') {
    return logDevEmail({ to, subject, html, text });
  }

  // ─── Production: send via Resend ───
  try {
    const resend = getResendClient();
    const from = process.env.EMAIL_FROM || 'TeamFlow <onboarding@resend.dev>';

    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });

    // Resend returns { data, error } — no throwing.
    if (result.error) {
      console.error('[EMAIL_SEND_ERROR]', result.error);
      return { error: result.error.message };
    }

    return { id: result.data?.id };
  } catch (err) {
    console.error('[EMAIL_SEND_THROWN]', err);
    return { error: err.message || 'Failed to send email' };
  }
}

// -------------------------------------------------------------
// DEV MODE HELPER
// -------------------------------------------------------------
// Prints a nicely formatted email to the terminal.
// Extracts URLs from the HTML so you can copy them directly.
function logDevEmail({ to, subject, html, text }) {
  const line = '─'.repeat(60);

  console.log('\n' + line);
  console.log('📧  [DEV EMAIL] — Not actually sent');
  console.log(line);
  console.log('To:      ', to);
  console.log('Subject: ', subject);

  // Extract URLs from HTML. Good enough for our use case.
  // We specifically pull out anything that looks like a link
  // (href="..."), since those are what you want to click.
  const urlRegex = /href="([^"]+)"/g;
  const urls = [];
  let match;
  while ((match = urlRegex.exec(html)) !== null) {
    urls.push(match[1]);
  }

  if (urls.length > 0) {
    console.log('\n🔗 Links found in email:');
    urls.forEach((url) => console.log('   →', url));
  }

  console.log('\n📄 Plain text preview:');
  // Strip HTML tags for a rough text preview.
  const preview = (text || html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
  console.log('  ', preview + '...');

  console.log(line + '\n');

  return { id: 'dev-mock', skipped: true };
}