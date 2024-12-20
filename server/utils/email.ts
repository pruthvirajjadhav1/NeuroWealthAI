import nodemailer from 'nodemailer';
import { type User } from '@db/schema';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(user: User, resetToken: string) {
  const resetUrl = `${process.env.APP_URL || ''}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@neurowealth.ai',
    to: user.email,
    subject: 'Reset Your Password - NeuroWealth AI',
    html: `
      <h1>Password Reset Request</h1>
      <p>Hello ${user.username},</p>
      <p>You have requested to reset your password. Click the link below to set a new password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this reset, please ignore this email.</p>
      <p>Best regards,<br>NeuroWealth AI Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', user.email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

// For future email verification implementation
export async function sendVerificationEmail(user: User, verificationToken: string) {
  // To be implemented later
}
