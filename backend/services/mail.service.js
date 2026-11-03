import nodemailer from 'nodemailer';

// Reads SMTP / Email credentials from process.env.
// Supports both EMAIL_USER/EMAIL_PASS and SMTP_USER/SMTP_PASS, with auto-trimming and space-removal for Gmail App Passwords.
function createTransporter() {
  const user = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || process.env.SMTP_PASS || process.env.APP_PASSWORD || '').replace(/\s+/g, '');

  if (!user || !pass) {
    return null;
  }

  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const isGmail = host.includes('gmail.com');

  if (isGmail && !process.env.SMTP_PORT) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

function getSender() {
  const fromEnv = process.env.EMAIL_FROM || process.env.SMTP_FROM;
  if (fromEnv) return fromEnv;
  const user = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  return user ? `Bookfolio <${user}>` : 'Bookfolio <support@bookfolio.live>';
}

// Sends a welcome email when a user registers / signs in for the first time.
export async function sendWelcomeEmail({ email, name }) {
  if (!email) return;
  const userGreeting = name ? name.split(' ')[0] : 'there';
  const origin = process.env.APP_ORIGIN || 'https://bookfolio.live';
  const shelfLink = `${origin}/shelf`;

  const transporter = createTransporter();
  if (!transporter) {
    console.info(`\n[mail] Welcome email for ${email} (${name || 'New Reader'}):`);
    console.info(`[mail] No EMAIL_USER and EMAIL_PASS configured in .env. Email skipped in development.\n`);
    return;
  }

  const mailOptions = {
    from: getSender(),
    to: email,
    subject: 'Welcome to Bookfolio! 📚 Your virtual bookshelf awaits',
    text: `Hi ${userGreeting},\n\nWelcome to Bookfolio.live! We're thrilled to have you with us.\n\nEvery book you've ever loved deserves a home this beautiful. Here is how to get started:\n\n1. Add Your Books: Search over 20M+ titles, snap a shelf photo, or sync your Goodreads library.\n2. Choose Your Look: Pick from unique 3D and grid shelf themes.\n3. Share Your Shelf: Claim your custom bookfolio.live/<yourname> link.\n\nGo to your bookshelf: ${shelfLink}\n\nHave questions or feedback? Reply directly to this email or reach us at bookfoliolive@gmail.com.\n\nHappy Reading!\nThe Bookfolio Team\nhttps://bookfolio.live\n`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Bookfolio</title>
</head>
<body style="margin:0;padding:24px 12px;background-color:#faf6ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1209;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:580px;background:#ffffff;border-radius:16px;border:1px solid #ede3ce;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.04);">
    <tr>
      <td style="padding:36px 32px;text-align:center;border-bottom:1px solid #f4ece1;background:#fffdfa;">
        <a href="${origin}" style="font-family:Georgia,serif;font-style:italic;font-size:26px;font-weight:700;color:#1c1209;text-decoration:none;">Bookfolio.live</a>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 32px 24px;">
        <h1 style="margin:0 0 16px;font-size:24px;line-height:32px;color:#1c1209;">Welcome to Bookfolio, ${userGreeting}! 📚</h1>
        <p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#4a4036;">
          We're delighted to welcome you! Your reading journey deserves a dedicated, beautiful space online. You can now curate your favorite reads, customize themes, and share your shelf with fellow readers.
        </p>

        <div style="text-align:center;margin:28px 0 32px;">
          <a href="${shelfLink}" style="display:inline-block;padding:15px 36px;border-radius:14px;background:#e13a00;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;box-shadow:0 6px 16px rgba(225,58,0,0.25);">Go to My Bookshelf →</a>
        </div>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#faf7f2;border-radius:12px;padding:20px;margin-bottom:24px;">
          <tr>
            <td style="padding:8px 0;">
              <strong style="color:#e13a00;font-size:15px;">1. Add Your Books</strong>
              <div style="font-size:14px;line-height:20px;color:#5c5248;margin-top:2px;">Search 20M+ titles, snap a photo of your physical shelf, or sync your Goodreads reading history.</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;">
              <strong style="color:#e13a00;font-size:15px;">2. Pick Your Look</strong>
              <div style="font-size:14px;line-height:20px;color:#5c5248;margin-top:2px;">Choose from interactive 3D shelves, minimalist spines, and modern grid themes.</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;">
              <strong style="color:#e13a00;font-size:15px;">3. Share Your Shelf</strong>
              <div style="font-size:14px;line-height:20px;color:#5c5248;margin-top:2px;">Claim your personal custom link (e.g. <code>bookfolio.live/yourname</code>) to put in your bio or share with friends.</div>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 16px;font-size:14px;line-height:22px;color:#6f655b;">
          If you have any questions, feedback, or need a custom URL, feel free to reply directly to this email or write to us at <a href="mailto:bookfoliolive@gmail.com" style="color:#e13a00;text-decoration:underline;">bookfoliolive@gmail.com</a>.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 32px;background:#faf7f2;border-top:1px solid #ede3ce;text-align:center;font-size:12px;line-height:18px;color:#8c827a;">
        © ${new Date().getFullYear()} Bookfolio.live · Designed &amp; developed by Trusting Brains.<br>
        All rights reserved.
      </td>
    </tr>
  </table>
</body>
</html>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.info(`[mail] Welcome email sent successfully to ${email} (messageId: ${info.messageId})`);
  } catch (err) {
    console.error(`[mail] Failed to send welcome email to ${email}:`, err.message);
  }
}

// Delivers password-reset links.
export async function sendPasswordReset({ email, link }) {
  const transporter = createTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: getSender(),
        to: email,
        subject: 'Reset your Bookfolio.live password',
        text: `Hi,\n\nWe received a request to reset your password for Bookfolio.live.\n\nClick the link below to set a new password:\n${link}\n\nThis link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.\n\nBest,\nThe Bookfolio Team\nhttps://bookfolio.live`,
        html: `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#faf6ef;padding:24px;color:#1c1209;">
  <div style="max-width:540px;margin:0 auto;background:#fff;padding:32px;border-radius:16px;border:1px solid #ede3ce;">
    <h2 style="margin-top:0;">Reset your password</h2>
    <p>We received a request to reset the password for your Bookfolio.live account.</p>
    <p style="margin:24px 0;"><a href="${link}" style="display:inline-block;padding:12px 28px;background:#e13a00;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;">Reset Password →</a></p>
    <p style="font-size:13px;color:#6f655b;">This link will expire in 1 hour. If you didn't request this reset, you can safely ignore this email.</p>
  </div>
</body>
</html>`,
      });
      console.info(`[mail] Password reset email sent to ${email}`);
      return;
    } catch (err) {
      console.error(`[mail] Failed to send password reset email to ${email}:`, err.message);
    }
  }

  // Fallback in dev when no credentials are configured
  if (process.env.NODE_ENV === 'production') {
    console.warn(`Password reset requested for ${email}, but no email credentials in .env.`);
    return;
  }
  console.info(`\n[dev] Password reset link for ${email}:\n${link}\n`);
}
