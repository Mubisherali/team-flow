// -------------------------------------------------------------
// Email Templates
// -------------------------------------------------------------
//
// WHAT THIS FILE DOES:
// Provides HTML + text bodies for transactional emails.
//
// WHY INLINE STYLES + TABLES:
// Email clients (Gmail, Outlook, Apple Mail, etc.) are stuck
// in 2005. They strip <style> tags, ignore flexbox/grid, and
// block external CSS. So we use:
//   - Inline styles on every element
//   - <table> for layout (universally supported)
//   - No images (reduces spam score, always renders)
//
// WHY BOTH html AND text:
// Some users disable HTML emails, and some spam filters
// prefer a text part. Emails with BOTH have better
// deliverability.
//
// BRAND COLORS:
// Indigo (#4f46e5) matches the app's primary color.
// -------------------------------------------------------------

// -------------------------------------------------------------
// SHARED LAYOUT WRAPPER
// -------------------------------------------------------------
// Every email is wrapped in this shell:
//   - Outer background (light gray)
//   - Centered 600px card
//   - TeamFlow header
//   - Body (template-specific)
//   - Footer with legal
function wrapTemplate({ bodyHtml, previewText = '' }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>TeamFlow</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #111827;">

  <!-- Preview text (hidden, shows in inbox preview line) -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    ${previewText}
  </div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!-- Main card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">

          <!-- Logo header -->
          <tr>
            <td align="center" style="padding: 32px 32px 0 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color: #4f46e5; width: 40px; height: 40px; border-radius: 10px; text-align: center; vertical-align: middle;">
                    <span style="color: #ffffff; font-size: 20px; font-weight: 900; line-height: 40px; display: inline-block;">T</span>
                  </td>
                  <td style="padding-left: 12px; font-size: 18px; font-weight: 700; color: #111827; vertical-align: middle;">
                    TeamFlow
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body content -->
          <tr>
            <td style="padding: 32px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="border-top: 1px solid #e5e7eb;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px 32px 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #6b7280;">
                This email was sent by TeamFlow.<br>
                If you didn't expect this email, you can safely ignore it.
              </p>
              <p style="margin: 16px 0 0 0; font-size: 11px; color: #9ca3af;">
                © ${new Date().getFullYear()} TeamFlow
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

// -------------------------------------------------------------
// BUTTON HELPER
// -------------------------------------------------------------
// Produces a cross-client "button". It's actually a table cell
// with a link inside — the standard trick, since real buttons
// render differently in Outlook.
function button({ href, label }) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="border-radius: 8px; background-color: #4f46e5;">
          <a href="${href}" target="_blank"
             style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

// =============================================================
// INVITATION EMAIL
// =============================================================
//
// Sent when someone is invited to a workspace.
//
// VARIABLES:
//   inviterName    - "Mubisher Ahmed" (who sent the invite)
//   workspaceName  - "NOVA TECH"
//   roleName       - "MEMBER" | "MANAGER"
//   inviteLink     - "https://app.com/invite/abc123..."
//   expiresInDays  - 7
//
// Returns:
//   { subject, html, text }
export function invitationEmail({
  inviterName,
  workspaceName,
  roleName,
  inviteLink,
  expiresInDays = 7,
}) {
  const subject = `You're invited to join ${workspaceName} on TeamFlow`;

  // Role badge label — humanize the enum
  const roleLabel =
    roleName === 'MANAGER' ? 'a manager' : 'a member';

  // ---------- HTML BODY ----------
  const bodyHtml = `
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #111827; line-height: 1.3;">
      You've been invited to ${workspaceName}
    </h1>

    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">
      <strong>${inviterName}</strong> has invited you to join
      <strong>${workspaceName}</strong> on TeamFlow as ${roleLabel}.
    </p>

    <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #374151;">
      TeamFlow gives your team one place to manage projects, assign tasks,
      and track progress together.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      ${button({ href: inviteLink, label: 'Accept invitation' })}
    </div>

    <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.6; color: #6b7280;">
      Or copy and paste this link into your browser:
    </p>

    <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.5; color: #4f46e5; word-break: break-all; background-color: #f3f4f6; padding: 12px; border-radius: 6px; font-family: 'Courier New', Courier, monospace;">
      ${inviteLink}
    </p>

    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #6b7280;">
      This invitation expires in <strong>${expiresInDays} days</strong>.
    </p>
  `;

  const html = wrapTemplate({
    bodyHtml,
    previewText: `${inviterName} invited you to join ${workspaceName} on TeamFlow`,
  });

  // ---------- PLAIN TEXT BODY ----------
  const text = `
You've been invited to ${workspaceName}

${inviterName} has invited you to join ${workspaceName} on TeamFlow as ${roleLabel}.

TeamFlow gives your team one place to manage projects, assign tasks,
and track progress together.

Accept your invitation here:
${inviteLink}

This invitation expires in ${expiresInDays} days.

---
This email was sent by TeamFlow.
If you didn't expect this email, you can safely ignore it.
  `.trim();

  return { subject, html, text };
}