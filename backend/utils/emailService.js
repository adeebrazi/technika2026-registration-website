const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // Standard gmail service
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
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

module.exports = { sendOtpEmail, sendPasswordResetOtpEmail };

