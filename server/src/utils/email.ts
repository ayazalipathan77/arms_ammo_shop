import nodemailer from 'nodemailer';
import { env } from '../config/env';

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT),
    secure: env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        // In development, if no credentials, mock it
        if (env.NODE_ENV === 'development' && !env.SMTP_USER) {
            console.log('--- MOCK EMAIL ---');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log('Body:', html);
            console.log('------------------');
            return true;
        }

        const info = await transporter.sendMail({
            from: `"Muraqqa Art Gallery" <${env.SMTP_FROM || env.SMTP_USER}>`,
            to,
            subject,
            html,
        });

        // console.log('Message sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

export const getPasswordResetTemplate = (resetUrl: string) => {
    return `
    <div style="font-family: serif; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #d97706; text-align: center; border-bottom: 1px solid #e7e5e4; padding-bottom: 20px;">MURAQQA</h1>
        <p>Hello,</p>
        <p>You requested a password reset for your Muraqqa account. Please click the button below to verify your email and set a new password.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #1c1917; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-family: sans-serif;">Reset Password</a>
        </div>
        <p style="font-size: 0.9em; color: #57534e;">This link will expire in 1 hour.</p>
        <p style="font-size: 0.9em; color: #57534e;">If you didn't request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e7e5e4; margin: 20px 0;">
        <p style="font-size: 0.8em; text-align: center; color: #78716c;">Muraqqa Art Gallery</p>
    </div>
    `;
};

export const getVerificationTemplate = (verifyUrl: string) => {
    return `
    <div style="font-family: serif; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #d97706; text-align: center; border-bottom: 1px solid #e7e5e4; padding-bottom: 20px;">MURAQQA</h1>
        <p>Welcome to Muraqqa,</p>
        <p>Thank you for creating an account. Please verify your email address to complete your registration.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background-color: #1c1917; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-family: sans-serif;">Verify Email</a>
        </div>
        <p style="font-size: 0.9em; color: #57534e;">If you didn't create an account, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e7e5e4; margin: 20px 0;">
        <p style="font-size: 0.8em; text-align: center; color: #78716c;">Muraqqa Art Gallery</p>
    </div>
    `;
};
