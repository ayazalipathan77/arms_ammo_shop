import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { env } from '../config/env';

// Initialize Resend client (preferred method - more reliable with hosting providers)
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

// Fallback SMTP transporter (if Resend API key is not provided)
const transporter = !env.RESEND_API_KEY && env.SMTP_USER ? nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT),
    secure: env.SMTP_PORT === '465',
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
    connectionTimeout: 90000,
    socketTimeout: 90000,
    greetingTimeout: 30000,
    logger: env.NODE_ENV === 'development',
    debug: env.NODE_ENV === 'development',
}) : null;

// Log email service status on startup
if (resend) {
    console.log(`📧 Email service: Resend (from: ${env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'})`);
    if (!env.RESEND_FROM_EMAIL) {
        console.warn('⚠️  Using onboarding@resend.dev — emails will ONLY deliver to your Resend account email. Set RESEND_FROM_EMAIL to a verified domain address for production use.');
    }
} else if (transporter) {
    console.log(`📧 Email service: SMTP (${env.SMTP_HOST}:${env.SMTP_PORT})`);
} else {
    console.warn('⚠️  No email service configured. Set RESEND_API_KEY or SMTP_USER/SMTP_PASS.');
}

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        // In development, always log email details to console
        if (env.NODE_ENV === 'development') {
            const links = html.match(/href="([^"]+)"/g)?.map(m => m.replace(/href="|"/g, '')) || [];
            console.log('\n========== EMAIL ==========');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            if (links.length > 0) {
                console.log('Links:');
                links.forEach(l => console.log(`  → ${l}`));
            }
            console.log('===========================\n');
        }

        // Prefer Resend HTTP API (more reliable with hosting providers like Render)
        if (resend) {
            const fromEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
            console.log(`📧 Sending email via Resend HTTP API to: ${to}, from: ${fromEmail}`);
            const { data, error } = await resend.emails.send({
                from: `Muraqqa Art Gallery <${fromEmail}>`,
                to: [to],
                subject,
                html,
            });

            if (error) {
                console.error('❌ Resend API error:', error);
                return false;
            }

            console.log('✅ Email sent via Resend:', data?.id);
            return true;
        }

        // Fallback to SMTP if Resend is not configured
        if (transporter) {
            console.log('📧 Sending email via SMTP...');
            const info = await transporter.sendMail({
                from: `"Muraqqa Art Gallery" <${env.SMTP_FROM || env.SMTP_USER}>`,
                to,
                subject,
                html,
            });

            console.log('✅ Email sent via SMTP:', info.messageId);
            return true;
        }

        // No email service configured
        if (env.NODE_ENV === 'development') {
            console.log('[DEV] No email service configured - skipping send');
            return true;
        }

        console.error('❌ No email service configured (RESEND_API_KEY or SMTP credentials required)');
        return false;
    } catch (error: any) {
        console.error('❌ Error sending email:', error.message || error);

        // Don't block the flow in development if email fails
        if (env.NODE_ENV === 'development') {
            console.log('[DEV] Email send failed but continuing');
            return true;
        }
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

// ==================== ORDER EMAIL TEMPLATES ====================

interface OrderItem {
    artwork: {
        title: string;
        imageUrl: string;
        artist?: { user: { fullName: string } } | null;
        artistName?: string | null;
    };
    quantity: number;
    priceAtPurchase: number | string;
    type: string;
    printSize?: string | null;
}

interface OrderData {
    id: string;
    totalAmount: number | string;
    shippingAddress: string;
    createdAt: Date | string;
    user: {
        fullName: string;
        email: string;
        phoneNumber?: string | null;
    };
    items: OrderItem[];
}

const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(num);
};

const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getOrderItemsHtml = (items: OrderItem[]) => {
    return items.map(item => `
        <tr>
            <td style="padding: 15px; border-bottom: 1px solid #e7e5e4;">
                <div style="display: flex; align-items: center;">
                    <img src="${item.artwork.imageUrl}" alt="${item.artwork.title}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; margin-right: 15px;">
                    <div>
                        <p style="margin: 0; font-weight: bold; color: #1c1917;">${item.artwork.title}</p>
                        <p style="margin: 4px 0 0; font-size: 0.85em; color: #57534e;">
                            by ${item.artwork.artist?.user?.fullName || item.artwork.artistName || 'Unknown Artist'}
                        </p>
                        <p style="margin: 4px 0 0; font-size: 0.85em; color: #78716c;">
                            ${item.type}${item.printSize ? ` - ${item.printSize}` : ''} × ${item.quantity}
                        </p>
                    </div>
                </div>
            </td>
            <td style="padding: 15px; border-bottom: 1px solid #e7e5e4; text-align: right; font-weight: bold;">
                ${formatCurrency(item.priceAtPurchase)}
            </td>
        </tr>
    `).join('');
};

// 1. Order Confirmation Email (for Collector)
export const getOrderConfirmationTemplate = (order: OrderData) => {
    return `
    <div style="font-family: 'Georgia', serif; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 20px; background: #fafaf9;">
        <div style="background: linear-gradient(135deg, #1c1917 0%, #292524 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #d97706; margin: 0; font-size: 2em; letter-spacing: 0.1em;">MURAQQA</h1>
            <p style="color: #a8a29e; margin: 10px 0 0; font-size: 0.9em; letter-spacing: 0.2em;">CONTEMPORARY PAKISTANI ART</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e7e5e4; border-top: none;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 60px; height: 60px; background: #d9f99d; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 30px;">✓</span>
                </div>
                <h2 style="color: #1c1917; margin: 0;">Thank You for Your Order!</h2>
                <p style="color: #57534e; margin: 10px 0 0;">Order #${order.id.slice(-8).toUpperCase()}</p>
            </div>

            <p>Dear ${order.user.fullName},</p>
            <p>We're thrilled to confirm your order from Muraqqa Art Gallery. Your appreciation for fine art means the world to us.</p>

            <div style="background: #fafaf9; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px; color: #1c1917; font-size: 1.1em;">Order Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    ${getOrderItemsHtml(order.items)}
                    <tr>
                        <td style="padding: 15px; font-weight: bold; font-size: 1.1em;">Total</td>
                        <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 1.1em; color: #d97706;">
                            ${formatCurrency(order.totalAmount)}
                        </td>
                    </tr>
                </table>
            </div>

            <div style="background: #fef3c7; border-left: 4px solid #d97706; padding: 15px; margin: 25px 0;">
                <h4 style="margin: 0 0 10px; color: #92400e;">What's Next?</h4>
                <ol style="margin: 0; padding-left: 20px; color: #78716c;">
                    <li>We'll verify availability with the artist</li>
                    <li>You'll receive a confirmation once ready to ship</li>
                    <li>We'll send tracking information when shipped</li>
                </ol>
            </div>

            <div style="margin: 25px 0;">
                <h4 style="color: #1c1917; margin: 0 0 10px;">Shipping Address</h4>
                <p style="color: #57534e; margin: 0; white-space: pre-line;">${order.shippingAddress}</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <a href="${env.CLIENT_URL}/invoice/${order.id}" style="display: inline-block; background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-family: sans-serif; font-weight: bold;">View Order Details</a>
            </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #78716c; font-size: 0.85em;">
            <p style="margin: 0;">Questions? Contact us at <a href="mailto:support@muraqqa.art" style="color: #d97706;">support@muraqqa.art</a></p>
            <p style="margin: 10px 0 0;">© ${new Date().getFullYear()} Muraqqa Art Gallery</p>
        </div>
    </div>
    `;
};

// 2. Order Copy Email (for Admin) with action button
export const getAdminOrderCopyTemplate = (order: OrderData, requestArtistUrl: string) => {
    return `
    <div style="font-family: 'Georgia', serif; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 20px; background: #fafaf9;">
        <div style="background: linear-gradient(135deg, #1c1917 0%, #292524 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #d97706; margin: 0; font-size: 2em; letter-spacing: 0.1em;">MURAQQA</h1>
            <p style="color: #fbbf24; margin: 10px 0 0; font-size: 0.9em;">🔔 NEW ORDER RECEIVED</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e7e5e4; border-top: none;">
            <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <h2 style="margin: 0; color: #92400e; font-size: 1.2em;">Order #${order.id.slice(-8).toUpperCase()}</h2>
                <p style="margin: 10px 0 0; color: #78716c;">Received: ${formatDate(order.createdAt)}</p>
            </div>

            <h3 style="color: #1c1917; border-bottom: 2px solid #d97706; padding-bottom: 10px;">Customer Details</h3>
            <table style="width: 100%; margin-bottom: 25px;">
                <tr>
                    <td style="padding: 8px 0; color: #57534e;">Name:</td>
                    <td style="padding: 8px 0; font-weight: bold;">${order.user.fullName}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #57534e;">Email:</td>
                    <td style="padding: 8px 0;"><a href="mailto:${order.user.email}" style="color: #d97706;">${order.user.email}</a></td>
                </tr>
                ${order.user.phoneNumber ? `
                <tr>
                    <td style="padding: 8px 0; color: #57534e;">Phone:</td>
                    <td style="padding: 8px 0;">${order.user.phoneNumber}</td>
                </tr>
                ` : ''}
                <tr>
                    <td style="padding: 8px 0; color: #57534e; vertical-align: top;">Shipping:</td>
                    <td style="padding: 8px 0; white-space: pre-line;">${order.shippingAddress}</td>
                </tr>
            </table>

            <h3 style="color: #1c1917; border-bottom: 2px solid #d97706; padding-bottom: 10px;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                ${getOrderItemsHtml(order.items)}
                <tr style="background: #1c1917;">
                    <td style="padding: 15px; font-weight: bold; color: white;">TOTAL</td>
                    <td style="padding: 15px; text-align: right; font-weight: bold; color: #fbbf24; font-size: 1.2em;">
                        ${formatCurrency(order.totalAmount)}
                    </td>
                </tr>
            </table>

            <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; text-align: center;">
                <h4 style="margin: 0 0 15px; color: #065f46;">Action Required</h4>
                <p style="color: #57534e; margin: 0 0 20px;">Request availability confirmation from the artist(s)</p>
                <a href="${requestArtistUrl}" style="display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-family: sans-serif; font-weight: bold;">📧 Send Artist Confirmation Request</a>
            </div>

            <div style="margin-top: 25px; text-align: center;">
                <a href="${env.CLIENT_URL}/admin" style="color: #d97706; text-decoration: none;">Open Admin Dashboard →</a>
            </div>
        </div>
    </div>
    `;
};

// 3. Artist Availability Request Email
export const getArtistAvailabilityRequestTemplate = (
    artistName: string,
    artworkTitle: string,
    artworkImage: string,
    orderId: string,
    confirmUrl: string,
    declineUrl: string
) => {
    return `
    <div style="font-family: 'Georgia', serif; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 20px; background: #fafaf9;">
        <div style="background: linear-gradient(135deg, #1c1917 0%, #292524 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #d97706; margin: 0; font-size: 2em; letter-spacing: 0.1em;">MURAQQA</h1>
            <p style="color: #a8a29e; margin: 10px 0 0; font-size: 0.9em;">🎨 ARTWORK SOLD!</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e7e5e4; border-top: none;">
            <p>Dear ${artistName},</p>

            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%); border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                <h2 style="margin: 0; color: #92400e;">🎉 Congratulations!</h2>
                <p style="color: #78716c; margin: 10px 0 0;">Your artwork has been purchased</p>
            </div>

            <div style="border: 1px solid #e7e5e4; border-radius: 8px; overflow: hidden; margin: 25px 0;">
                <img src="${artworkImage}" alt="${artworkTitle}" style="width: 100%; height: 200px; object-fit: cover;">
                <div style="padding: 15px;">
                    <h3 style="margin: 0; color: #1c1917;">${artworkTitle}</h3>
                    <p style="margin: 10px 0 0; color: #57534e; font-size: 0.9em;">Order Reference: #${orderId.slice(-8).toUpperCase()}</p>
                </div>
            </div>

            <div style="background: #fef3c7; border-left: 4px solid #d97706; padding: 15px; margin: 25px 0;">
                <h4 style="margin: 0 0 10px; color: #92400e;">⚡ Action Required</h4>
                <p style="margin: 0; color: #78716c;">Please confirm the artwork is available and ready for delivery. This helps us provide excellent service to our collectors.</p>
            </div>

            <div style="display: flex; gap: 15px; margin: 30px 0; text-align: center;">
                <a href="${confirmUrl}" style="flex: 1; display: inline-block; background: #10b981; color: white; padding: 15px 20px; text-decoration: none; border-radius: 4px; font-family: sans-serif; font-weight: bold;">✓ Confirm Available</a>
                <a href="${declineUrl}" style="flex: 1; display: inline-block; background: #ef4444; color: white; padding: 15px 20px; text-decoration: none; border-radius: 4px; font-family: sans-serif; font-weight: bold;">✗ Not Available</a>
            </div>

            <p style="font-size: 0.85em; color: #78716c; text-align: center;">Please respond within 48 hours</p>
        </div>

        <div style="text-align: center; padding: 20px; color: #78716c; font-size: 0.85em;">
            <p style="margin: 0;">Questions? Contact us at <a href="mailto:support@muraqqa.art" style="color: #d97706;">support@muraqqa.art</a></p>
        </div>
    </div>
    `;
};

// 4. Artist Confirmed Notification (for Admin)
export const getArtistConfirmedNotificationTemplate = (
    artistName: string,
    artworkTitle: string,
    orderId: string,
    adminDashboardUrl: string
) => {
    return `
    <div style="font-family: 'Georgia', serif; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 20px; background: #fafaf9;">
        <div style="background: linear-gradient(135deg, #1c1917 0%, #292524 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #d97706; margin: 0; font-size: 2em; letter-spacing: 0.1em;">MURAQQA</h1>
            <p style="color: #10b981; margin: 10px 0 0; font-size: 0.9em;">✓ ARTIST CONFIRMED</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e7e5e4; border-top: none;">
            <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 25px;">
                <h2 style="margin: 0; color: #065f46;">Artist Availability Confirmed</h2>
            </div>

            <table style="width: 100%; margin-bottom: 25px;">
                <tr>
                    <td style="padding: 8px 0; color: #57534e;">Order:</td>
                    <td style="padding: 8px 0; font-weight: bold;">#${orderId.slice(-8).toUpperCase()}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #57534e;">Artwork:</td>
                    <td style="padding: 8px 0; font-weight: bold;">${artworkTitle}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #57534e;">Artist:</td>
                    <td style="padding: 8px 0; font-weight: bold;">${artistName}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #57534e;">Status:</td>
                    <td style="padding: 8px 0;"><span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.85em;">Ready to Process</span></td>
                </tr>
            </table>

            <div style="text-align: center;">
                <p style="color: #57534e;">Review and confirm the order, then arrange shipping.</p>
                <a href="${adminDashboardUrl}" style="display: inline-block; background: #d97706; color: white; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-family: sans-serif; font-weight: bold; margin-top: 15px;">Open Admin Dashboard</a>
            </div>
        </div>
    </div>
    `;
};

// 5. Order Confirmed Email (for Collector)
export const getOrderConfirmedTemplate = (order: OrderData) => {
    return `
    <div style="font-family: 'Georgia', serif; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 20px; background: #fafaf9;">
        <div style="background: linear-gradient(135deg, #1c1917 0%, #292524 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #d97706; margin: 0; font-size: 2em; letter-spacing: 0.1em;">MURAQQA</h1>
            <p style="color: #a8a29e; margin: 10px 0 0; font-size: 0.9em; letter-spacing: 0.2em;">ORDER UPDATE</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e7e5e4; border-top: none;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 60px; height: 60px; background: #ecfdf5; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 30px;">✓</span>
                </div>
                <h2 style="color: #065f46; margin: 0;">Your Order is Confirmed!</h2>
                <p style="color: #57534e; margin: 10px 0 0;">Order #${order.id.slice(-8).toUpperCase()}</p>
            </div>

            <p>Dear ${order.user.fullName},</p>
            <p>Great news! The artist has confirmed availability and your order is now being prepared for shipping.</p>

            <div style="background: #fafaf9; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px; color: #1c1917;">Order Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    ${getOrderItemsHtml(order.items)}
                </table>
            </div>

            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0;">
                <h4 style="margin: 0 0 10px; color: #1e40af;">📦 Next Step</h4>
                <p style="margin: 0; color: #57534e;">Your artwork is being carefully packaged. We'll send you tracking information once it ships.</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <a href="${env.CLIENT_URL}/invoice/${order.id}" style="display: inline-block; background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-family: sans-serif; font-weight: bold;">Track Your Order</a>
            </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #78716c; font-size: 0.85em;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Muraqqa Art Gallery</p>
        </div>
    </div>
    `;
};

// 6. Shipping Update Email (for Collector)
export const getShippingUpdateTemplate = (order: OrderData, trackingNumber: string, carrier?: string) => {
    return `
    <div style="font-family: 'Georgia', serif; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 20px; background: #fafaf9;">
        <div style="background: linear-gradient(135deg, #1c1917 0%, #292524 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #d97706; margin: 0; font-size: 2em; letter-spacing: 0.1em;">MURAQQA</h1>
            <p style="color: #a8a29e; margin: 10px 0 0; font-size: 0.9em;">🚚 YOUR ORDER HAS SHIPPED!</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e7e5e4; border-top: none;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 60px; height: 60px; background: #dbeafe; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 30px;">📦</span>
                </div>
                <h2 style="color: #1e40af; margin: 0;">Your Art is On Its Way!</h2>
            </div>

            <p>Dear ${order.user.fullName},</p>
            <p>Your carefully packaged artwork has been shipped and is making its way to you.</p>

            <div style="background: #f0f9ff; border: 2px dashed #3b82f6; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                <p style="margin: 0 0 10px; color: #57534e; font-size: 0.9em;">Tracking Number</p>
                <p style="margin: 0; font-size: 1.3em; font-weight: bold; color: #1e40af; letter-spacing: 0.1em;">${trackingNumber}</p>
                ${carrier ? `<p style="margin: 10px 0 0; color: #57534e; font-size: 0.85em;">Carrier: ${carrier}</p>` : ''}
            </div>

            <div style="background: #fafaf9; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px; color: #1c1917;">Shipping To</h3>
                <p style="margin: 0; color: #57534e; white-space: pre-line;">${order.shippingAddress}</p>
            </div>

            <div style="background: #fef3c7; border-left: 4px solid #d97706; padding: 15px; margin: 25px 0;">
                <h4 style="margin: 0 0 10px; color: #92400e;">📋 Handling Instructions</h4>
                <ul style="margin: 0; padding-left: 20px; color: #78716c;">
                    <li>Please inspect the package upon delivery</li>
                    <li>Note any damage before signing</li>
                    <li>Contact us immediately if there are concerns</li>
                </ul>
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <a href="${env.CLIENT_URL}/invoice/${order.id}" style="display: inline-block; background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-family: sans-serif; font-weight: bold;">View Order Details</a>
            </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #78716c; font-size: 0.85em;">
            <p style="margin: 0;">Questions about your delivery? <a href="mailto:support@muraqqa.art" style="color: #d97706;">Contact Support</a></p>
        </div>
    </div>
    `;
};

// 7. Delivery Confirmation Email (for Collector)
export const getDeliveryConfirmationTemplate = (order: OrderData) => {
    return `
    <div style="font-family: 'Georgia', serif; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 20px; background: #fafaf9;">
        <div style="background: linear-gradient(135deg, #1c1917 0%, #292524 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #d97706; margin: 0; font-size: 2em; letter-spacing: 0.1em;">MURAQQA</h1>
            <p style="color: #10b981; margin: 10px 0 0; font-size: 0.9em;">🎉 ORDER DELIVERED</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e7e5e4; border-top: none;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 40px;">🖼️</span>
                </div>
                <h2 style="color: #1c1917; margin: 0;">Your Art Has Arrived!</h2>
                <p style="color: #57534e; margin: 10px 0 0;">Order #${order.id.slice(-8).toUpperCase()}</p>
            </div>

            <p>Dear ${order.user.fullName},</p>
            <p>We hope your new artwork brings you joy for years to come. Thank you for supporting Pakistani artists through Muraqqa.</p>

            <div style="background: linear-gradient(135deg, #fafaf9 0%, #f5f5f4 100%); border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
                <h3 style="margin: 0 0 15px; color: #1c1917;">Share Your Experience</h3>
                <p style="color: #57534e; margin: 0 0 20px;">We'd love to hear about your new artwork! Leave a review to help other collectors discover great art.</p>
                <a href="${env.CLIENT_URL}/profile" style="display: inline-block; background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-family: sans-serif; font-weight: bold;">Write a Review</a>
            </div>

            <div style="border: 1px solid #e7e5e4; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h4 style="margin: 0 0 15px; color: #1c1917;">🎁 Care Tips for Your Artwork</h4>
                <ul style="margin: 0; padding-left: 20px; color: #57534e;">
                    <li>Avoid direct sunlight to prevent fading</li>
                    <li>Maintain stable humidity levels</li>
                    <li>Clean gently with a soft, dry cloth</li>
                    <li>Consider professional framing for longevity</li>
                </ul>
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <p style="color: #57534e; margin-bottom: 15px;">Continue exploring our collection</p>
                <a href="${env.CLIENT_URL}/gallery" style="display: inline-block; border: 2px solid #d97706; color: #d97706; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-family: sans-serif; font-weight: bold;">Browse More Art</a>
            </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #78716c; font-size: 0.85em;">
            <p style="margin: 0;">Thank you for being part of the Muraqqa family</p>
            <p style="margin: 10px 0 0;">© ${new Date().getFullYear()} Muraqqa Art Gallery</p>
        </div>
    </div>
    `;
};

// 8. Order Cancellation Email (for Collector)
export const getOrderCancellationTemplate = (order: OrderData, reason?: string) => {
    return `
    <div style="font-family: 'Georgia', serif; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 20px; background: #fafaf9;">
        <div style="background: linear-gradient(135deg, #1c1917 0%, #292524 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #d97706; margin: 0; font-size: 2em; letter-spacing: 0.1em;">MURAQQA</h1>
            <p style="color: #ef4444; margin: 10px 0 0; font-size: 0.9em;">ORDER CANCELLED</p>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e7e5e4; border-top: none;">
            <p>Dear ${order.user.fullName},</p>
            <p>We regret to inform you that your order #${order.id.slice(-8).toUpperCase()} has been cancelled.</p>

            ${reason ? `
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 25px 0;">
                <h4 style="margin: 0 0 10px; color: #991b1b;">Reason</h4>
                <p style="margin: 0; color: #57534e;">${reason}</p>
            </div>
            ` : ''}

            <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h4 style="margin: 0 0 10px; color: #065f46;">💰 Refund Information</h4>
                <p style="margin: 0; color: #57534e;">If payment was processed, a full refund of ${formatCurrency(order.totalAmount)} will be issued to your original payment method within 5-10 business days.</p>
            </div>

            <p>We apologize for any inconvenience. Please don't hesitate to reach out if you have questions or would like help finding similar artwork.</p>

            <div style="text-align: center; margin-top: 30px;">
                <a href="${env.CLIENT_URL}/gallery" style="display: inline-block; background: #d97706; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-family: sans-serif; font-weight: bold;">Explore More Art</a>
            </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #78716c; font-size: 0.85em;">
            <p style="margin: 0;">Questions? <a href="mailto:support@muraqqa.art" style="color: #d97706;">Contact Support</a></p>
        </div>
    </div>
    `;
};
