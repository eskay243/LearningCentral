import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

const DEFAULT_FROM_EMAIL = 'noreply@codelabeducare.com';

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const emailData = {
      to: params.to,
      from: params.from || DEFAULT_FROM_EMAIL,
      subject: params.subject,
      text: params.text,
      html: params.html,
      attachments: params.attachments
    };

    await mailService.send(emailData);
    console.log(`[EMAIL] Successfully sent email to ${params.to}: ${params.subject}`);
    return true;
  } catch (error: any) {
    console.error('[EMAIL] SendGrid email error:', error);
    if (error.response) {
      console.error('[EMAIL] SendGrid response:', error.response.body);
    }
    return false;
  }
}

// Specialized email templates for LMS
export async function sendWelcomeEmail(userEmail: string, firstName: string): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Codelab Educare!</h1>
      </div>
      <div style="padding: 40px 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-top: 0;">Hello ${firstName}! 👋</h2>
        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          Welcome to Codelab Educare - Nigeria's premier learning management system! 
          We're excited to have you join our community of learners and educators.
        </p>
        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          Your account is now active and ready to use. You can start exploring courses, 
          connecting with mentors, and beginning your learning journey immediately.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard" 
             style="background: #667eea; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 6px; font-weight: bold;">
            Access Your Dashboard
          </a>
        </div>
        <p style="color: #666; line-height: 1.6; font-size: 14px;">
          If you have any questions, feel free to contact our support team.
        </p>
      </div>
      <div style="padding: 20px; text-align: center; background: #e9ecef; color: #666; font-size: 12px;">
        © 2025 Codelab Educare. All rights reserved.
      </div>
    </div>
  `;

  return await sendEmail({
    to: userEmail,
    subject: 'Welcome to Codelab Educare! 🎓',
    html,
    text: `Welcome to Codelab Educare, ${firstName}! Your account is now active and ready to use.`
  });
}

export async function sendCourseEnrollmentConfirmation(
  userEmail: string, 
  userName: string, 
  courseTitle: string, 
  amount: number
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Enrollment Confirmed! 🎉</h1>
      </div>
      <div style="padding: 40px 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-top: 0;">Congratulations ${userName}!</h2>
        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          You have successfully enrolled in <strong>"${courseTitle}"</strong>.
        </p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin: 0 0 10px 0;">Payment Details</h3>
          <p style="margin: 5px 0; color: #666;">Course: ${courseTitle}</p>
          <p style="margin: 5px 0; color: #666;">Amount Paid: ₦${amount.toLocaleString()}</p>
          <p style="margin: 5px 0; color: #666;">Status: <span style="color: #28a745; font-weight: bold;">Confirmed</span></p>
        </div>
        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          You can now access your course content, interact with your mentor, and start learning immediately.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/student/courses" 
             style="background: #28a745; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 6px; font-weight: bold;">
            Start Learning Now
          </a>
        </div>
      </div>
      <div style="padding: 20px; text-align: center; background: #e9ecef; color: #666; font-size: 12px;">
        © 2025 Codelab Educare. All rights reserved.
      </div>
    </div>
  `;

  return await sendEmail({
    to: userEmail,
    subject: `Enrollment Confirmed: ${courseTitle}`,
    html,
    text: `Congratulations! You have successfully enrolled in "${courseTitle}". Amount paid: ₦${amount.toLocaleString()}.`
  });
}

export async function sendCertificateEmail(
  userEmail: string, 
  userName: string, 
  courseTitle: string, 
  certificateBuffer: Buffer
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Certificate Earned!</h1>
      </div>
      <div style="padding: 40px 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-top: 0;">Congratulations ${userName}!</h2>
        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          You have successfully completed <strong>"${courseTitle}"</strong> and earned your certificate!
        </p>
        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          Your certificate is attached to this email. You can also download it anytime from your dashboard.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/certificates" 
             style="background: #ffc107; color: #212529; padding: 12px 30px; 
                    text-decoration: none; border-radius: 6px; font-weight: bold;">
            View All Certificates
          </a>
        </div>
        <p style="color: #666; line-height: 1.6; font-size: 14px;">
          Share your achievement on social media and showcase your new skills!
        </p>
      </div>
      <div style="padding: 20px; text-align: center; background: #e9ecef; color: #666; font-size: 12px;">
        © 2025 Codelab Educare. All rights reserved.
      </div>
    </div>
  `;

  return await sendEmail({
    to: userEmail,
    subject: `🎓 Certificate: ${courseTitle} - Codelab Educare`,
    html,
    text: `Congratulations! You have completed "${courseTitle}" and earned your certificate. See attachment.`,
    attachments: [{
      content: certificateBuffer.toString('base64'),
      filename: `${courseTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Certificate.pdf`,
      type: 'application/pdf',
      disposition: 'attachment'
    }]
  });
}

export async function sendMentorCommissionNotification(
  mentorEmail: string, 
  mentorName: string, 
  courseTitle: string, 
  commissionAmount: number, 
  studentName: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">💰 Commission Earned!</h1>
      </div>
      <div style="padding: 40px 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-top: 0;">Great news, ${mentorName}!</h2>
        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          You've earned a commission from a new student enrollment in your course 
          <strong>"${courseTitle}"</strong>.
        </p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin: 0 0 10px 0;">Commission Details</h3>
          <p style="margin: 5px 0; color: #666;">Student: ${studentName}</p>
          <p style="margin: 5px 0; color: #666;">Course: ${courseTitle}</p>
          <p style="margin: 5px 0; color: #666;">Commission (37%): <span style="color: #28a745; font-weight: bold; font-size: 18px;">₦${commissionAmount.toLocaleString()}</span></p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/mentor/earnings" 
             style="background: #28a745; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Earnings Dashboard
          </a>
        </div>
      </div>
      <div style="padding: 20px; text-align: center; background: #e9ecef; color: #666; font-size: 12px;">
        © 2025 Codelab Educare. All rights reserved.
      </div>
    </div>
  `;

  return await sendEmail({
    to: mentorEmail,
    subject: `💰 Commission Earned: ₦${commissionAmount.toLocaleString()} from ${courseTitle}`,
    html,
    text: `You earned ₦${commissionAmount.toLocaleString()} commission from ${studentName}'s enrollment in "${courseTitle}".`
  });
}

export async function sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<boolean> {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🔒 Password Reset</h1>
      </div>
      <div style="padding: 40px 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          We received a request to reset your password for your Codelab Educare account.
        </p>
        <p style="color: #666; line-height: 1.6; font-size: 16px;">
          Click the button below to create a new password. This link will expire in 1 hour.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: #dc3545; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; line-height: 1.6; font-size: 14px;">
          If you didn't request this reset, please ignore this email. Your password will remain unchanged.
        </p>
      </div>
      <div style="padding: 20px; text-align: center; background: #e9ecef; color: #666; font-size: 12px;">
        © 2025 Codelab Educare. All rights reserved.
      </div>
    </div>
  `;

  return await sendEmail({
    to: userEmail,
    subject: 'Reset Your Codelab Educare Password',
    html,
    text: `Reset your password: ${resetUrl}`
  });
}

console.log('[EMAIL] SendGrid email service initialized successfully');