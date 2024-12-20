import { Request, Response } from 'express';
import nodemailer from 'nodemailer';

export async function handleContactForm(req: Request, res: Response) {
  const { email, subject, message } = req.body;

  if (!email || !subject || !message) {
    return res.status(400).json({ 
      error: 'Please provide email, subject, and message' 
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    });

    // Log configuration for debugging (without sensitive data)
    console.log('SMTP Configuration:', {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      hasUser: !!process.env.SMTP_USER,
      hasPassword: !!process.env.SMTP_PASSWORD
    });

    await transporter.sendMail({
      from: email,
      to: 'support@neurowealth.ai',
      subject: `Contact Form: ${subject}`,
      text: `From: ${email}\n\n${message}`,
      html: `
        <h3>Contact Form Submission</h3>
        <p><strong>From:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    });

    return res.status(200).json({ 
      message: 'Email sent successfully' 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ 
      error: 'Failed to send email' 
    });
  }
}
