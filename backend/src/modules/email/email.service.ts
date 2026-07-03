// =============================================================================
// Beleqet — Email Service
//
// Centralises all transactional email sending via Nodemailer.
// Each method builds a branded HTML template and delivers it through the
// configured SMTP transport.  All failures are logged and swallowed so that
// a broken mail server never crashes business logic.
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// ── Brand constants ───────────────────────────────────────────────────────────
const BRAND_COLOR = '#4F46E5'; // Indigo-600
const BRAND_NAME  = 'Beleqet';

/** Wraps any HTML body in a consistent branded email shell. */
function emailShell(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${BRAND_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

          <!-- Header -->
          <tr>
            <td style="background:${BRAND_COLOR};padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                ${BRAND_NAME}
              </h1>
              <p style="margin:4px 0 0;color:#C7D2FE;font-size:13px;">Ethiopian Hiring Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;padding:20px 32px;border-top:1px solid #E5E7EB;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">
                © ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.<br/>
                This is an automated message — please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Renders a CTA button. */
function ctaButton(label: string, url: string): string {
  return `<p style="margin:24px 0 0;">
    <a href="${url}"
       style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;padding:12px 28px;
              border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
      ${label}
    </a>
  </p>`;
}

/** Renders a status badge chip. */
function statusBadge(label: string, color: string): string {
  return `<span style="display:inline-block;padding:4px 12px;border-radius:999px;
                       background:${color};color:#ffffff;font-size:12px;font-weight:600;">
    ${label}
  </span>`;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    this.from        = config.get<string>('EMAIL_FROM', `${BRAND_NAME} <noreply@beleqet.com>`);
    this.frontendUrl = config.get<string>('FRONTEND_URL', 'http://localhost:3000');

    this.transporter = nodemailer.createTransport({
      host:   config.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port:   config.get<number>('SMTP_PORT', 587),
      secure: config.get<number>('SMTP_PORT', 587) === 465,
      auth: {
        user: config.get<string>('SMTP_USER'),
        pass: config.get<string>('SMTP_PASS'),
      },
    });
  }

  // ── Core send ─────────────────────────────────────────────────────────────

  async send(options: SendEmailOptions): Promise<void> {
    if (!this.config.get<string>('SMTP_USER')) {
      this.logger.warn('SMTP_USER not configured — skipping email to ' + options.to);
      return;
    }
    try {
      const info = await this.transporter.sendMail({
        from:    this.from,
        to:      options.to,
        subject: options.subject,
        html:    options.html,
        text:    options.text,
      });
      this.logger.log(`Email sent → ${options.to} | ${options.subject} [${info.messageId}]`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${options.to}: ${(err as Error).message}`);
    }
  }

  // =========================================================================
  // AUTH EMAILS
  // =========================================================================

  /** Sent immediately after a new user registers. */
  async sendWelcomeEmail(params: {
    to: string;
    firstName: string;
    role: string;
  }): Promise<void> {
    const roleLabel = params.role === 'EMPLOYER' ? 'employer' : 'job seeker';
    const dashboardUrl = `${this.frontendUrl}/dashboard`;

    const body = `
      <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">
        Welcome to ${BRAND_NAME}, ${params.firstName}! 👋
      </h2>
      <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Your account has been created as an <strong>${roleLabel}</strong>.
        You're all set to start ${params.role === 'EMPLOYER' ? 'posting jobs and finding great talent' : 'discovering opportunities and growing your career'}.
      </p>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0;">
        Head to your dashboard to complete your profile and get started.
      </p>
      ${ctaButton('Go to Dashboard', dashboardUrl)}
    `;

    await this.send({
      to:      params.to,
      subject: `Welcome to ${BRAND_NAME}!`,
      html:    emailShell(body),
    });
  }

  /** Sent after the user verifies their email address. */
  async sendVerificationEmail(params: {
    to: string;
    firstName: string;
    verifyUrl: string;
  }): Promise<void> {
    const body = `
      <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Verify your email address</h2>
      <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Hi <strong>${params.firstName}</strong>, thanks for signing up!
        Please confirm your email address by clicking the button below.
        This link expires in <strong>24 hours</strong>.
      </p>
      ${ctaButton('Verify Email', params.verifyUrl)}
      <p style="margin:20px 0 0;font-size:12px;color:#9CA3AF;">
        If you didn't create a ${BRAND_NAME} account, you can safely ignore this email.
      </p>
    `;

    await this.send({
      to:      params.to,
      subject: `Verify your ${BRAND_NAME} email address`,
      html:    emailShell(body),
    });
  }

  /** Sent on every successful login as a security notice. */
  async sendLoginNotificationEmail(params: {
    to: string;
    firstName: string;
    loginTime: Date;
    ipAddress?: string;
  }): Promise<void> {
    const time = params.loginTime.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const body = `
      <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">New login detected</h2>
      <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Hi <strong>${params.firstName}</strong>, we noticed a new sign-in to your ${BRAND_NAME} account.
      </p>
      <table style="border:1px solid #E5E7EB;border-radius:6px;padding:16px;width:100%;background:#F9FAFB;">
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6B7280;width:120px;">Time</td>
          <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${time}</td>
        </tr>
        ${params.ipAddress ? `
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6B7280;">IP Address</td>
          <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${params.ipAddress}</td>
        </tr>` : ''}
      </table>
      <p style="margin:16px 0 0;font-size:13px;color:#6B7280;">
        If this was you, no action is needed. If you didn't sign in, please
        <a href="${this.frontendUrl}/auth/forgot-password" style="color:${BRAND_COLOR};">reset your password immediately</a>.
      </p>
    `;

    await this.send({
      to:      params.to,
      subject: `New login to your ${BRAND_NAME} account`,
      html:    emailShell(body),
    });
  }

  /** Sent when a user requests a password reset. */
  async sendPasswordResetEmail(params: {
    to: string;
    firstName: string;
    resetUrl: string;
  }): Promise<void> {
    const body = `
      <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Reset your password</h2>
      <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Hi <strong>${params.firstName}</strong>, we received a request to reset the password for your ${BRAND_NAME} account.
        Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
      </p>
      ${ctaButton('Reset Password', params.resetUrl)}
      <p style="margin:20px 0 0;font-size:12px;color:#9CA3AF;">
        If you didn't request a password reset, you can safely ignore this email.
        Your password will remain unchanged.
      </p>
    `;

    await this.send({
      to:      params.to,
      subject: `Reset your ${BRAND_NAME} password`,
      html:    emailShell(body),
    });
  }

  /** Sent after a successful password change. */
  async sendPasswordChangedEmail(params: {
    to: string;
    firstName: string;
  }): Promise<void> {
    const body = `
      <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Password changed successfully</h2>
      <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Hi <strong>${params.firstName}</strong>, your ${BRAND_NAME} account password was just changed.
      </p>
      <p style="font-size:13px;color:#6B7280;">
        If you made this change, everything is fine. If you didn't, please
        <a href="${this.frontendUrl}/auth/forgot-password" style="color:${BRAND_COLOR};">
          reset your password immediately
        </a>
        and contact our support team.
      </p>
    `;

    await this.send({
      to:      params.to,
      subject: `Your ${BRAND_NAME} password has been changed`,
      html:    emailShell(body),
    });
  }

  // =========================================================================
  // JOB APPLICATION EMAILS — CANDIDATE
  // =========================================================================

  /** Sent to the candidate immediately after they submit an application. */
  async sendApplicationSubmittedEmail(params: {
    to: string;
    firstName: string;
    jobTitle: string;
    companyName: string;
    applicationId: string;
  }): Promise<void> {
    const applicationUrl = `${this.frontendUrl}/dashboard/applications/${params.applicationId}`;

    const body = `
      <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Application submitted! ✅</h2>
      <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Hi <strong>${params.firstName}</strong>, your application has been received by
        <strong>${params.companyName}</strong> for the role of
        <strong>${params.jobTitle}</strong>.
      </p>
      <table style="border:1px solid #E5E7EB;border-radius:6px;padding:16px;width:100%;background:#F9FAFB;">
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6B7280;width:120px;">Position</td>
          <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${params.jobTitle}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6B7280;">Company</td>
          <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${params.companyName}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6B7280;">Status</td>
          <td style="padding:4px 0;">
            ${statusBadge('Under Review', '#6B7280')}
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:13px;color:#6B7280;line-height:1.6;">
        Our AI-powered screening system will review your application shortly.
        You'll receive updates as your application progresses.
      </p>
      ${ctaButton('Track Application', applicationUrl)}
    `;

    await this.send({
      to:      params.to,
      subject: `Application received — ${params.jobTitle} at ${params.companyName}`,
      html:    emailShell(body),
    });
  }

  /** Sent to the candidate when they are shortlisted. */
  async sendApplicationShortlistedEmail(params: {
    to: string;
    firstName: string;
    jobTitle: string;
    companyName: string;
    applicationId: string;
    score: number;
  }): Promise<void> {
    const applicationUrl = `${this.frontendUrl}/dashboard/applications/${params.applicationId}`;

    const body = `
      <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">
        🎉 You've been shortlisted!
      </h2>
      <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Congratulations, <strong>${params.firstName}</strong>! Your application for
        <strong>${params.jobTitle}</strong> at <strong>${params.companyName}</strong>
        has been reviewed and you've been shortlisted.
      </p>
      <table style="border:1px solid #E5E7EB;border-radius:6px;padding:16px;width:100%;background:#F9FAFB;">
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6B7280;width:120px;">Position</td>
          <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${params.jobTitle}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6B7280;">Company</td>
          <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${params.companyName}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6B7280;">Status</td>
          <td style="padding:4px 0;">
            ${statusBadge('Shortlisted', '#059669')}
          </td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6B7280;">Match Score</td>
          <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${params.score}/100</td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:13px;color:#6B7280;line-height:1.6;">
        The hiring team will be in touch soon regarding next steps.
        Keep an eye on your dashboard for interview scheduling updates.
      </p>
      ${ctaButton('View Application', applicationUrl)}
    `;

    await this.send({
      to:      params.to,
      subject: `🎉 You've been shortlisted for ${params.jobTitle} at ${params.companyName}`,
      html:    emailShell(body),
    });
  }

  /** Sent to the candidate when they are rejected. */
  async sendApplicationRejectedEmail(params: {
    to: string;
    firstName: string;
    jobTitle: string;
    companyName: string;
  }): Promise<void> {
    const jobsUrl = `${this.frontendUrl}/jobs`;

    const body = `
      <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Application update</h2>
      <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Hi <strong>${params.firstName}</strong>, thank you for your interest in
        <strong>${params.jobTitle}</strong> at <strong>${params.companyName}</strong>.
      </p>
      <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 16px;">
        After careful consideration, we regret to inform you that your application
        does not meet the requirements for this particular role at this time.
        We encourage you not to be discouraged — the right opportunity is out there!
      </p>
      <p style="margin:0;font-size:14px;color:#374151;">
        Browse our other open positions and find a role that's a great fit for your skills.
      </p>
      ${ctaButton('Explore More Jobs', jobsUrl)}
    `;

    await this.send({
      to:      params.to,
      subject: `Your application for ${params.jobTitle} at ${params.companyName}`,
      html:    emailShell(body),
    });
  }

  /** Sent to the candidate when an interview is scheduled. */
  async sendInterviewScheduledEmail(params: {
    to: string;
    firstName: string;
    jobTitle: string;
    companyName: string;
    applicationId: string;
    interviewSlot: Date;
  }): Promise<void> {
    const applicationUrl = `${this.frontendUrl}/dashboard/applications/${params.applicationId}`;
    const slotFormatted = params.interviewSlot.toLocaleString('en-US', {
      weekday:  'long',
      year:     'numeric',
      month:    'long',
      day:      'numeric',
      hour:     '2-digit',
      minute:   '2-digit',
    });

    const body = `
      <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">
        📅 Interview scheduled
      </h2>
      <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Great news, <strong>${params.firstName}</strong>! An interview has been scheduled for your
        application for <strong>${params.jobTitle}</strong> at <strong>${params.companyName}</strong>.
      </p>
      <table style="border:1px solid #E5E7EB;border-radius:6px;padding:16px;width:100%;background:#F9FAFB;">
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6B7280;width:120px;">Position</td>
          <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${params.jobTitle}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6B7280;">Company</td>
          <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${params.companyName}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6B7280;">Interview Date</td>
          <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${slotFormatted}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6B7280;">Status</td>
          <td style="padding:4px 0;">
            ${statusBadge('Interview Scheduled', '#2563EB')}
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:13px;color:#6B7280;line-height:1.6;">
        Please check your dashboard for full details and confirm your availability.
      </p>
      ${ctaButton('View Interview Details', applicationUrl)}
    `;

    await this.send({
      to:      params.to,
      subject: `Interview scheduled — ${params.jobTitle} at ${params.companyName}`,
      html:    emailShell(body),
    });
  }

  // =========================================================================
  // JOB APPLICATION EMAILS — RECRUITER / EMPLOYER
  // =========================================================================

  /** Sent to the recruiter when a new application arrives. */
  async sendNewApplicationToRecruiterEmail(params: {
    to: string;
    recruiterName: string;
    jobTitle: string;
    applicantName: string;
    applicationId: string;
  }): Promise<void> {
    const reviewUrl = `${this.frontendUrl}/dashboard/applications/${params.applicationId}`;

    const body = `
      <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">New application received</h2>
      <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Hi <strong>${params.recruiterName}</strong>, a new application has been submitted for
        <strong>${params.jobTitle}</strong>.
      </p>
      <table style="border:1px solid #E5E7EB;border-radius:6px;padding:16px;width:100%;background:#F9FAFB;">
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6B7280;width:120px;">Applicant</td>
          <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${params.applicantName}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6B7280;">Position</td>
          <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${params.jobTitle}</td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:13px;color:#6B7280;">
        Our AI screening is running now. You'll receive another update once the results are ready.
      </p>
      ${ctaButton('Review Application', reviewUrl)}
    `;

    await this.send({
      to:      params.to,
      subject: `New application for ${params.jobTitle} — ${params.applicantName}`,
      html:    emailShell(body),
    });
  }

  /** Sent to the recruiter when a strong candidate is auto-shortlisted. */
  async sendStrongCandidateAlertEmail(params: {
    to: string;
    recruiterName: string;
    jobTitle: string;
    applicantName: string;
    applicationId: string;
    score: number;
  }): Promise<void> {
    const reviewUrl = `${this.frontendUrl}/dashboard/applications/${params.applicationId}`;

    const body = `
      <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">
        ⭐ Strong candidate shortlisted
      </h2>
      <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Hi <strong>${params.recruiterName}</strong>, our AI screening has identified an
        outstanding candidate for <strong>${params.jobTitle}</strong>.
      </p>
      <table style="border:1px solid #E5E7EB;border-radius:6px;padding:16px;width:100%;background:#F9FAFB;">
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6B7280;width:120px;">Applicant</td>
          <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${params.applicantName}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6B7280;">Position</td>
          <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${params.jobTitle}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6B7280;">AI Score</td>
          <td style="padding:4px 0;font-size:20px;font-weight:700;color:#059669;">${params.score}/100</td>
        </tr>
      </table>
      ${ctaButton('Review Candidate', reviewUrl)}
    `;

    await this.send({
      to:      params.to,
      subject: `⭐ Strong candidate (${params.score}/100) for ${params.jobTitle}`,
      html:    emailShell(body),
    });
  }

  // =========================================================================
  // GENERIC FALLBACK — used by the queue processor for ad-hoc HTML emails
  // =========================================================================

  async sendRaw(options: SendEmailOptions): Promise<void> {
    await this.send(options);
  }

  // =========================================================================
  // APPLICATION STATUS CHANGE — manual employer action
  // =========================================================================

  /**
   * Sent to the candidate whenever an employer manually changes their
   * application status (shortlisted, offered, rejected, etc.)
   */
  async sendApplicationStatusChangedEmail(params: {
    to: string;
    firstName: string;
    jobTitle: string;
    companyName: string;
    status: string;
    applicationId: string;
  }): Promise<void> {
    const applicationUrl = `${this.frontendUrl}/dashboard/applications/${params.applicationId}`;

    const statusConfig: Record<string, { emoji: string; label: string; badgeColor: string; message: string }> = {
      SHORTLISTED: {
        emoji: '🎉',
        label: 'Shortlisted',
        badgeColor: '#059669',
        message: 'Great news! The hiring team has reviewed your profile and decided to shortlist you. Expect to hear about next steps soon.',
      },
      INTERVIEW_SCHEDULED: {
        emoji: '📅',
        label: 'Interview Scheduled',
        badgeColor: '#2563EB',
        message: 'An interview has been arranged for you. Log in to your dashboard to view the full details and confirm your availability.',
      },
      OFFERED: {
        emoji: '🎊',
        label: 'Job Offer',
        badgeColor: '#7C3AED',
        message: `Congratulations! ${params.companyName} has extended a job offer to you. Please review the offer details in your dashboard and respond at your earliest convenience.`,
      },
      REJECTED: {
        emoji: '📋',
        label: 'Application Closed',
        badgeColor: '#6B7280',
        message: `Thank you for your time and interest in ${params.companyName}. After careful consideration, the team has decided to move forward with other candidates for this role. We encourage you to keep applying — the right opportunity is close.`,
      },
      WITHDRAWN: {
        emoji: '↩️',
        label: 'Withdrawn',
        badgeColor: '#9CA3AF',
        message: 'Your application has been marked as withdrawn. You can always re-apply to other open positions.',
      },
      SCREENING: {
        emoji: '🔍',
        label: 'Under Review',
        badgeColor: '#D97706',
        message: 'Your application is currently being reviewed by the hiring team. We\'ll notify you as soon as there\'s an update.',
      },
    };

    const cfg = statusConfig[params.status] ?? {
      emoji: '📬',
      label: params.status,
      badgeColor: '#6B7280',
      message: 'There has been an update to your application. Log in to your dashboard for more details.',
    };

    const body = `
      <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">
        ${cfg.emoji} Application update
      </h2>
      <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Hi <strong>${params.firstName}</strong>, there's a new update on your application for
        <strong>${params.jobTitle}</strong> at <strong>${params.companyName}</strong>.
      </p>
      <table style="border:1px solid #E5E7EB;border-radius:6px;padding:16px;width:100%;background:#F9FAFB;">
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6B7280;width:120px;">Position</td>
          <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${params.jobTitle}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6B7280;">Company</td>
          <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${params.companyName}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6B7280;">New Status</td>
          <td style="padding:4px 0;">
            ${statusBadge(cfg.label, cfg.badgeColor)}
          </td>
        </tr>
      </table>
      <p style="margin:20px 0 0;font-size:14px;color:#374151;line-height:1.6;">
        ${cfg.message}
      </p>
      ${ctaButton('View Application', applicationUrl)}
    `;

    await this.send({
      to:      params.to,
      subject: `${cfg.emoji} Application update: ${cfg.label} — ${params.jobTitle} at ${params.companyName}`,
      html:    emailShell(body),
    });
  }

  // =========================================================================
  // CHAT / MESSAGING EMAILS
  // =========================================================================

  /**
   * Sent to the recipient of a chat message when they are not actively
   * online — notifies them that someone sent a new message.
   */
  async sendNewMessageEmail(params: {
    to: string;
    recipientName: string;
    senderName: string;
    messagePreview: string;
    roomId: string;
  }): Promise<void> {
    const chatUrl = `${this.frontendUrl}/chat/${params.roomId}`;

    // Truncate preview to avoid exposing full message contents in email
    const preview = params.messagePreview.length > 120
      ? params.messagePreview.slice(0, 117) + '...'
      : params.messagePreview;

    const body = `
      <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">
        💬 New message from ${params.senderName}
      </h2>
      <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Hi <strong>${params.recipientName}</strong>,
        you have a new message waiting for you on ${BRAND_NAME}.
      </p>
      <table style="border:1px solid #E5E7EB;border-radius:6px;padding:16px;width:100%;background:#F9FAFB;">
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6B7280;width:80px;">From</td>
          <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${params.senderName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0 4px;font-size:13px;color:#6B7280;vertical-align:top;">Message</td>
          <td style="padding:8px 0 4px;font-size:14px;color:#374151;font-style:italic;line-height:1.5;">
            "${preview}"
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:13px;color:#6B7280;">
        Reply directly on ${BRAND_NAME} to keep the conversation going.
      </p>
      ${ctaButton('Open Conversation', chatUrl)}
      <p style="margin:20px 0 0;font-size:11px;color:#D1D5DB;">
        You're receiving this because someone sent you a message on ${BRAND_NAME}.
      </p>
    `;

    await this.send({
      to:      params.to,
      subject: `💬 ${params.senderName} sent you a message on ${BRAND_NAME}`,
      html:    emailShell(body),
    });
  }
}
