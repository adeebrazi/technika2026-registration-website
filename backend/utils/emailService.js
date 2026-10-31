const dns = require('dns');
// Ensure IPv4 is strictly prioritized across all child sockets
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignore on older node versions
}

const nodemailer = require('nodemailer');

const cleanPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '';

// Gmail SMTP using smtp.googlemail.com on port 587 (STARTTLS) with IPv4 resolution
// smtp.googlemail.com is accessible and avoids ISP IP filtering on port 465
const transporter = nodemailer.createTransport({
  host: 'smtp.googlemail.com',
  port: 587,
  secure: false, // upgrades via STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: cleanPass,
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
});

const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Technika Registration" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your Technika OTP Verification Code',
    text: `Your OTP for Technika registration is: ${otp}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Technika Verification Code</h2>
        <p>Please use the following OTP to verify your email address during registration.</p>
        <h1 style="color: #4CAF50; letter-spacing: 5px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendPasswordResetOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Technika 6.0 Support" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Technika 6.0 — Password Reset OTP',
    text: `Your OTP for resetting your Technika 6.0 password is: ${otp}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 500px; border: 3px solid #000; background: #FFFDF9;">
        <h2 style="margin-top: 0; color: #000; text-transform: uppercase; font-size: 20px;">Password Reset Request</h2>
        <p style="color: #333; font-size: 14px; line-height: 1.5;">We received a request to reset your password for your Technika 6.0 account. Enter the OTP code below to set a new password:</p>
        <div style="background: #D6FD52; border: 3px solid #000; padding: 14px; text-align: center; margin: 18px 0; box-shadow: 4px 4px 0px #000;">
          <h1 style="color: #000; margin: 0; letter-spacing: 6px; font-size: 32px; font-family: monospace;">${otp}</h1>
        </div>
        <p style="color: #444; font-size: 13px; font-weight: bold;">This code is valid for 10 minutes.</p>
        <p style="color: #666; font-size: 12px; margin-top: 16px;">If you did not request this password reset, please ignore this email. Your current password will remain safe.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send official Registration & Events Confirmation Email
 */
const sendRegistrationConfirmationEmail = async ({ user, events = [], senderName = 'Organizing Committee' }) => {
  if (!user || !user.email) {
    throw new Error('User email address is missing');
  }

  const eventsListHtml = events.length > 0 
    ? events.map((ev, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 14px; font-weight: 700; color: #0f172a; font-size: 14px;">${idx + 1}. ${ev.name || ev.title || 'Event'}</td>
        <td style="padding: 10px 14px; font-size: 13px; color: #475569;">${ev.category || 'General'}</td>
        <td style="padding: 10px 14px; text-align: right;">
          <span style="background: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">
            ${ev.type || (ev.teamAllowed ? 'Team Event' : 'Individual')}
          </span>
        </td>
      </tr>
    `).join('')
    : `
      <tr>
        <td colspan="3" style="padding: 14px; text-align: center; color: #64748b; font-size: 13px;">
          All-Access General Registration (Events can also be selected on-campus)
        </td>
      </tr>
    `;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Registration Confirmation — Technika 6.0</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">

          <!-- Top Header: Official Technika 6.0 Banner -->
          <tr>
            <td style="padding: 0; margin: 0; background-color: #0f172a; text-align: center; border-bottom: 4px solid #2563eb;">
              <img
                src="https://i.postimg.cc/Bv7C2ZZc/Whats-App-Image-2026-10-30-at-12-42-52-PM.jpg"
                alt="ARKA JAIN University – Technika 6.0"
                width="600"
                border="0"
                style="display: block; width: 100%; max-width: 600px; height: auto; margin: 0 auto; padding: 0; border: 0; outline: none; text-decoration: none;"
              >
            </td>
          </tr>

          <!-- Verification Badge -->
          <tr>
            <td style="padding: 24px 28px 12px 28px;">
              <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 14px 18px; text-align: center;">
                <div style="color: #059669; font-size: 16px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px;">
                  ✓ REGISTRATION & PAYMENT VERIFIED
                </div>
                <div style="color: #047857; font-size: 12px; font-weight: 600; margin-top: 4px;">
                  Congratulations! You have successfully registered for TECHNIKA 6.0. We look forward to welcoming you and wish you an exciting experience ahead!
                </div>
              </div>
            </td>
          </tr>

          <!-- Greeting & Details -->
          <tr>
            <td style="padding: 12px 28px 20px 28px;">
              <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 0 0 10px 0;">
                Hello ${user.name},
              </h2>
              <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 18px 0;">
                We are thrilled to officially welcome you to <strong>Technika 6.0</strong>! Your registration is complete and confirmed. Below are your official participant details:
              </p>

              <!-- Participant Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 22px;">
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Participant ID</span>
                    <div style="font-size: 20px; font-weight: 900; color: #2563eb; font-family: monospace; letter-spacing: 1px; margin-top: 2px;">
                      ${user.registrationId}
                    </div>
                  </td>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Institution</span>
                    <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px;">
                      ${user.institution || 'ARKA JAIN University'}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px;">
                    <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Course & Semester</span>
                    <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">
                      ${user.course || 'N/A'} ${user.semester ? `· Sem ${user.semester}` : ''}
                    </div>
                  </td>
                  <td style="padding: 14px 18px;">
                    <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Registered Email</span>
                    <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">
                      ${user.email}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Registered Events List -->
              <div style="margin-bottom: 22px;">
                <div style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                  📋 Registered Competitions & Events (${events.length})
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; background: #ffffff;">
                  <thead>
                    <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1;">
                      <th align="left" style="padding: 8px 14px; font-size: 11px; color: #475569; text-transform: uppercase;">Event Name</th>
                      <th align="left" style="padding: 8px 14px; font-size: 11px; color: #475569; text-transform: uppercase;">Category</th>
                      <th align="right" style="padding: 8px 14px; font-size: 11px; color: #475569; text-transform: uppercase;">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- Injected rows with Event Name, Category, Team/Individual -->
                    ${eventsListHtml}
                  </tbody>
                </table>
              </div>

              <!-- WhatsApp Group -->
              <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px;">
                <div style="color: #065f46; font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: 6px;">
                  💬 Join the Official Technika 6.0 WhatsApp Group:
                </div>
                <p style="color: #047857; font-size: 12px; line-height: 1.5; margin: 0 0 10px 0;">
                  Stay updated with important announcements, event schedules, and other fest-related information.
                </p>
                <a href="https://chat.whatsapp.com/LR0WpPwaKwVDie7H4zD7OJ" target="_blank" style="display: inline-block; background: #16a34a; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 700; padding: 10px 16px; border-radius: 6px;">
                  Join WhatsApp Group
                </a>
              </div>

              <!-- Important Instructions -->
              <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px;">
                <div style="color: #92400e; font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">
                  📌 Important Fest Guidelines:
                </div>
                <ul style="color: #78350f; font-size: 12px; line-height: 1.5; margin: 0; padding-left: 18px;">
                  <li>Please carry your original <strong>College / School ID Card</strong> for campus entry.</li>
                  <li>You will receive your <strong>Digital Entry QR Pass</strong> separately before fest day.</li>
                  <li>For any schedule conflicts or queries, visit the Registration Helpdesk on Day 1.</li>
                </ul>
              </div>

              <!-- Contact & Support -->
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px;">
                <div style="color: #0f172a; font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px;">
                  📞 For Queries & Assistance:
                </div>
                <div style="color: #334155; font-size: 13px; line-height: 1.8;">
                  <div>Mr. Adeeb Razi (Student Coordinator): <a href="tel:+91 62067 82574" style="color: #2563eb; text-decoration: none;">+91 6206782574</a></div>
                  <div>Prof. Mamatha Vayelapelli (Faculty Coordinator): <a href="tel:+91 78588 12586" style="color: #2563eb; text-decoration: none;">+91 7858812586</a></div>
                </div>
              </div>

              <!-- Sign-off -->
              <p style="color: #64748b; font-size: 12px; margin: 16px 0 0 0; line-height: 1.5;">
                Verified by <strong>${senderName}</strong><br>
                Team Technika 6.0<br>
                School of Engineering & IT, ARKA JAIN University, Jamshedpur
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; color: #94a3b8; font-size: 11px;">
              © 2026 Technika 6.0 · ARKA JAIN University · All rights reserved.<br>
              This is an official automated communication for registered participants.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const mailOptions = {
    from: `"Technika 6.0 | ARKA JAIN University" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: `🎉 Registration Confirmed: Technika 6.0 [${user.registrationId}]`,
    text: `Hello ${user.name},\n\nYour registration for Technika 6.0 is confirmed!\nParticipant ID: ${user.registrationId}\nInstitution: ${user.institution || 'ARKA JAIN University'}\nEvents: ${events.map(e => e.name || e.title).join(', ')}\n\nSee you at the fest!`,
    html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendOtpEmail,
  sendPasswordResetOtpEmail,
  sendRegistrationConfirmationEmail,
};
