import nodemailer from 'nodemailer';
import env from '../config/env';
import logger from '../config/logger';

// 1. Initialize the modular SMTP transporter using Zod-validated environment config
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // True if using port 465, false for other ports (like 587 or 2525)
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

/**
 * Dispatches a password reset email using a responsive, premium glassmorphism-styled HTML template.
 * Includes complete fallback parameters and error handling.
 */
export const sendResetPasswordEmail = async (
  email: string,
  resetUrl: string
): Promise<void> => {
  const htmlContent = `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Reset Your Password - ffairdrop</title>
      <style type="text/css">
        /* Client-specific Styles */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; }
        
        /* Reset Styles */
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #090d16; }
      </style>
    </head>
    <body style="margin: 0 !important; padding: 0 !important; background-color: #090d16;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #090d16; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
        <tr>
          <td align="center" style="padding: 40px 10px 40px 10px;">
            <!--[if (gte mso 9)|(IE)]>
            <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
            <tr>
            <td align="center" valign="top" width="600">
            <![endif]-->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #121826; border: 1px solid #1f293d; border-top: 4px solid #00f0ff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);">
              <!-- Logo Header -->
              <tr>
                <td align="center" style="padding: 40px 40px 20px 40px;">
                  <span style="font-family: 'Montserrat', 'Inter', sans-serif; font-size: 32px; font-weight: 900; letter-spacing: 3px; color: #00f0ff; text-transform: uppercase; text-shadow: 0 0 15px rgba(0, 240, 255, 0.4);">ffairdrop</span>
                </td>
              </tr>
              <!-- Divider line -->
              <tr>
                <td align="center" style="padding: 0 40px;">
                  <hr style="border: 0; height: 1px; background: linear-gradient(90deg, transparent, #1f293d, transparent); margin: 0;" />
                </td>
              </tr>
              <!-- Body Content -->
              <tr>
                <td align="left" style="padding: 40px 40px 20px 40px;">
                  <h1 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 20px 0; letter-spacing: -0.5px;">Password Reset Request</h1>
                  <p style="font-size: 15px; line-height: 24px; color: #94a3b8; margin: 0 0 20px 0;">Hello,</p>
                  <p style="font-size: 15px; line-height: 24px; color: #94a3b8; margin: 0 0 30px 0;">We received a request to reset the password associated with your <strong>ffairdrop</strong> player account. If you made this request, please click the Cyber Green action button below to set up a new password:</p>
                </td>
              </tr>
              <!-- Core CTA Button -->
              <tr>
                <td align="center" style="padding: 0 40px 40px 40px;">
                  <!--[if (gte mso 9)|(IE)]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${resetUrl}" style="height:52px;v-text-anchor:middle;width:220px;" arcsize="16%" stroke="f" fillcolor="#05ffc5">
                    <w:anchorlock/>
                    <center style="color:#090d16;font-family:sans-serif;font-size:16px;font-weight:bold;">RESET PASSWORD</center>
                  </v:roundrect>
                  <![endif]-->
                  <!--[if !mso]><!-->
                  <a href="${resetUrl}" style="background: linear-gradient(135deg, #00f0ff 0%, #05ffc5 100%); color: #090d16 !important; display: inline-block; font-size: 15px; font-weight: 700; letter-spacing: 1px; line-height: 52px; text-align: center; text-decoration: none; text-transform: uppercase; width: 220px; border-radius: 8px; box-shadow: 0 0 20px rgba(5, 255, 197, 0.35); transition: all 0.3s ease;">Reset Password</a>
                  <!--<![endif]-->
                </td>
              </tr>
              <!-- Security Warning Box -->
              <tr>
                <td align="left" style="padding: 0 40px 30px 40px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.15); border-radius: 6px;">
                    <tr>
                      <td style="padding: 16px; font-size: 13px; line-height: 20px; color: #fbbf24;">
                        <strong>⚠️ Security Note:</strong> If you did not request this change, you can safely ignore this email. This password reset link will automatically expire in <strong>1 hour</strong> and can only be used once.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Divider line -->
              <tr>
                <td align="center" style="padding: 0 40px;">
                  <hr style="border: 0; height: 1px; background: #1f293d; margin: 0;" />
                </td>
              </tr>
              <!-- Footer Section -->
              <tr>
                <td align="center" style="padding: 30px 40px 40px 40px;">
                  <!-- Social Links placeholders -->
                  <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                    <tr>
                      <td style="padding: 0 10px;">
                        <a href="#" style="color: #00f0ff; text-decoration: none; font-size: 13px; font-weight: 600;">Twitter</a>
                      </td>
                      <td style="color: #1f293d;">•</td>
                      <td style="padding: 0 10px;">
                        <a href="#" style="color: #00f0ff; text-decoration: none; font-size: 13px; font-weight: 600;">Discord</a>
                      </td>
                      <td style="color: #1f293d;">•</td>
                      <td style="padding: 0 10px;">
                        <a href="#" style="color: #00f0ff; text-decoration: none; font-size: 13px; font-weight: 600;">Support</a>
                      </td>
                    </tr>
                  </table>
                  <p style="font-size: 12px; line-height: 18px; color: #475569; margin: 0;">
                    This is an automated operational transmission. Please do not reply directly to this email.<br />
                    © 2026 ffairdrop Esports Management Platform. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
            <!--[if (gte mso 9)|(IE)]>
            </td>
            </tr>
            </table>
            <![endif]-->
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `ffairdrop <${env.SMTP_USER}>`,
    to: email,
    subject: '🔒 Reset Your Password - ffairdrop',
    html: htmlContent,
    text: `Reset your ffairdrop password by opening this link in your browser: ${resetUrl}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`📧 [SMTP DISPATCH] Successfully sent password reset email to ${email}`);
  } catch (error) {
    logger.error(`❌ [SMTP ERROR] Failed to dispatch password reset email to ${email}: `, error);
    throw error;
  }
};

export default sendResetPasswordEmail;
