const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
function createTransporter() {
  const host = process.env.MAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.MAIL_PORT || '587');
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASSWORD;

  if (!user || !pass) {
    console.warn('[EMAIL WARNING] MAIL_USER or MAIL_PASSWORD environment variables are missing.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

/**
 * Sends a password reset email to the specified user
 * @param {Object} options - { to, fullName, resetUrl }
 * @returns {Promise<boolean>} true if sent successfully, false otherwise
 */
async function sendPasswordResetEmail({ to, fullName, resetUrl }) {
  const from = process.env.MAIL_FROM || 'BrushIQ Support <no-reply@brushiq.com>';

  const transporter = createTransporter();
  if (!transporter) {
    console.error('[EMAIL ERROR] Transporter cannot be created due to missing SMTP credentials.');
    return false;
  }

  const recipientName = fullName ? fullName : 'BrushIQ User';

  const mailOptions = {
    from,
    to,
    subject: 'BrushIQ Password Reset Request',
    text: `Hello ${recipientName},\n\nWe received a request to reset your BrushIQ password.\n\nPlease use the link below to reset your password:\n${resetUrl}\n\nThis link will expire after 1 hour.\n\nIf you did not request this password reset, you can safely ignore this email.\n`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0B1120; color: #E2E8F0; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #38BDF8; font-size: 26px; margin: 0; font-weight: 800;">BrushIQ</h1>
          <p style="color: #94A3B8; font-size: 14px; margin-top: 4px;">AI-Powered Dental Diagnostics</p>
        </div>

        <div style="background-color: #1E293B; padding: 24px; border-radius: 8px; border: 1px solid #334155;">
          <h2 style="color: #F8FAFC; font-size: 18px; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #CBD5E1; font-size: 15px; line-height: 1.6;">Hello ${recipientName},</p>
          <p style="color: #CBD5E1; font-size: 15px; line-height: 1.6;">We received a request to reset your BrushIQ password.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #38BDF8; color: #0F172A; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 15px; display: inline-block;">RESET PASSWORD</a>
          </div>

          <p style="color: #94A3B8; font-size: 13px; line-height: 1.5;">Or copy and paste this URL into your browser:<br/><a href="${resetUrl}" style="color: #38BDF8; word-break: break-all;">${resetUrl}</a></p>
          <p style="color: #94A3B8; font-size: 13px;">This link will expire after 1 hour.</p>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <p style="color: #64748B; font-size: 12px;">If you did not request this password reset, you can safely ignore this email.</p>
        </div>
      </div>
    `
  };

  try {
    console.log('[EMAIL] SMTP send attempt started');
    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] SMTP provider accepted message');
    console.log('[EMAIL] Message sent ID:', info.messageId);
    return true;
  } catch (error) {
    const safeErrorMsg = error.message ? error.message.replace(/pass(word)?=([^& ]+)/gi, 'pass=***') : 'Unknown SMTP error';
    console.error('[EMAIL] SMTP error:', safeErrorMsg);
    return false;
  }
}

module.exports = {
  sendPasswordResetEmail,
  createTransporter
};
