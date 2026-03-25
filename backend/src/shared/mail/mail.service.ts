import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { setDefaultResultOrder } from 'node:dns';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly enabled: boolean;
  private readonly transporter: Transporter | null;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    this.enabled =
      this.configService.get<string>('MAIL_ENABLED', 'false') === 'true';
    this.fromEmail = this.configService.get<string>(
      'MAIL_FROM_EMAIL',
      'noreply@westdrive.fr',
    );
    this.fromName = this.configService.get<string>(
      'MAIL_FROM_NAME',
      'WestDrive',
    );

    if (!this.enabled) {
      this.transporter = null;
      return;
    }

    const host = this.configService.get<string>('MAIL_HOST');
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASSWORD');
    const port = Number(this.configService.get<string>('MAIL_PORT', '587'));
    const secure =
      this.configService.get<string>('MAIL_SECURE', 'false') === 'true';

    if (!host || !user || !pass) {
      throw new Error(
        'MAIL_HOST, MAIL_USER and MAIL_PASSWORD are required when MAIL_ENABLED=true',
      );
    }

    // Render and similar platforms often have flaky IPv6 SMTP routing.
    // Prefer IPv4 resolution first to avoid ENETUNREACH on AAAA records.
    setDefaultResultOrder('ipv4first');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: !secure,
      auth: {
        user,
        pass,
      },
    });

    this.logger.log(
      `SMTP transport initialized (host=${host}, port=${port}, secure=${secure}, requireTLS=${!secure})`,
    );
  }

  async sendOtpEmail(options: {
    to: string;
    otpCode: string;
    purpose: 'register' | 'reset-password';
    ttlMinutes: number;
  }): Promise<void> {
    if (!this.enabled || !this.transporter) {
      this.logger.debug(
        `Email sending disabled. OTP for ${options.to} not sent by SMTP.`,
      );
      return;
    }

    this.logger.log(
      `Sending OTP email (purpose=${options.purpose}) to ${options.to}`,
    );

    const subject =
      options.purpose === 'register'
        ? 'WestDrive - Confirmation de votre inscription'
        : 'WestDrive - Reinitialisation de mot de passe';

    const actionText =
      options.purpose === 'register'
        ? 'confirmer votre inscription'
        : 'reinitialiser votre mot de passe';

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 8px;">WestDrive</h2>
        <p>Bonjour,</p>
        <p>Utilisez le code suivant pour ${actionText}:</p>
        <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${options.otpCode}</p>
        <p>Ce code expire dans ${options.ttlMinutes} minutes.</p>
        <p>Si vous n'etes pas a l'origine de cette demande, ignorez cet email.</p>
      </div>
    `;

    const text = [
      'WestDrive',
      '',
      `Code OTP: ${options.otpCode}`,
      `Validite: ${options.ttlMinutes} minutes`,
    ].join('\n');

    let info: unknown;

    try {
      info = await this.transporter.sendMail({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: options.to,
        subject,
        text,
        html,
      });
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Unknown SMTP error';
      this.logger.error(`Failed to send OTP email to ${options.to}: ${reason}`);
      throw new Error(`OTP email delivery failed: ${reason}`);
    }

    const messageId = this.readMessageId(info);

    this.logger.log(`OTP email sent to ${options.to}. messageId=${messageId}`);
  }

  async sendReservationAcknowledgement(options: {
    to: string;
    requesterName: string;
    publicReference: string;
  }): Promise<void> {
    const subject = `WestDrive - Accuse de reception ${options.publicReference}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 8px;">WestDrive</h2>
        <p>Bonjour ${options.requesterName},</p>
        <p>Nous avons bien recu votre demande de reservation.</p>
        <p>Reference: <strong>${options.publicReference}</strong></p>
        <p>Notre equipe vous tiendra informe(e) de chaque evolution.</p>
      </div>
    `;
    const text = [
      'WestDrive',
      `Bonjour ${options.requesterName},`,
      'Nous avons bien recu votre demande de reservation.',
      `Reference: ${options.publicReference}`,
      'Notre equipe vous tiendra informe(e) de chaque evolution.',
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendReservationStatusUpdate(options: {
    to: string;
    requesterName: string;
    publicReference: string;
    newStatus: string;
  }): Promise<void> {
    const subject = `WestDrive - Mise a jour reservation ${options.publicReference}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 8px;">WestDrive</h2>
        <p>Bonjour ${options.requesterName},</p>
        <p>Le statut de votre reservation <strong>${options.publicReference}</strong> a change.</p>
        <p>Nouveau statut: <strong>${options.newStatus}</strong></p>
      </div>
    `;
    const text = [
      'WestDrive',
      `Bonjour ${options.requesterName},`,
      `Le statut de votre reservation ${options.publicReference} a change.`,
      `Nouveau statut: ${options.newStatus}`,
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendReservationEventNotification(options: {
    to: string;
    requesterName: string;
    publicReference: string;
    title: string;
    description?: string;
  }): Promise<void> {
    const subject = `WestDrive - Nouvel evenement ${options.publicReference}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 8px;">WestDrive</h2>
        <p>Bonjour ${options.requesterName},</p>
        <p>Un nouvel evenement a ete ajoute a votre reservation <strong>${options.publicReference}</strong>.</p>
        <p><strong>${options.title}</strong></p>
        ${options.description ? `<p>${options.description}</p>` : ''}
      </div>
    `;
    const text = [
      'WestDrive',
      `Bonjour ${options.requesterName},`,
      `Un nouvel evenement a ete ajoute a votre reservation ${options.publicReference}.`,
      options.title,
      options.description ?? '',
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendReservationAdminNotification(options: {
    to: string;
    requesterName: string;
    requesterEmail: string;
    publicReference: string;
  }): Promise<void> {
    const subject = `WestDrive - Nouvelle demande ${options.publicReference}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 8px;">WestDrive - Back Office</h2>
        <p>Nouvelle demande de reservation recue.</p>
        <p>Reference: <strong>${options.publicReference}</strong></p>
        <p>Client: ${options.requesterName} (${options.requesterEmail})</p>
      </div>
    `;
    const text = [
      'WestDrive - Back Office',
      'Nouvelle demande de reservation recue.',
      `Reference: ${options.publicReference}`,
      `Client: ${options.requesterName} (${options.requesterEmail})`,
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendGuestAccountSetupEmail(options: {
    to: string;
    requesterName: string;
    publicReference: string;
    setupUrl: string;
  }): Promise<void> {
    const subject = 'WestDrive - Finalisez votre inscription';
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 8px;">WestDrive</h2>
        <p>Bonjour ${options.requesterName},</p>
        <p>Votre reservation <strong>${options.publicReference}</strong> est en cours de traitement.</p>
        <p>Pour suivre son evolution depuis votre espace client, finalisez votre inscription:</p>
        <p><a href="${options.setupUrl}" style="display:inline-block; padding:10px 14px; background:#111827; color:#fff; text-decoration:none; border-radius:6px;">Definir mon mot de passe</a></p>
        <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur:</p>
        <p>${options.setupUrl}</p>
      </div>
    `;
    const text = [
      'WestDrive',
      `Bonjour ${options.requesterName},`,
      `Votre reservation ${options.publicReference} est en cours de traitement.`,
      'Finalisez votre inscription pour suivre son evolution:',
      options.setupUrl,
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    if (!this.enabled || !this.transporter) {
      this.logger.debug(`Email sending disabled. Message to ${options.to} not sent by SMTP.`);
      return;
    }

    let info: unknown;

    try {
      info = await this.transporter.sendMail({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown SMTP error';
      this.logger.error(`Failed to send email to ${options.to}: ${reason}`);
      throw new Error(`Email delivery failed: ${reason}`);
    }

    const messageId = this.readMessageId(info);
    this.logger.log(`Email sent to ${options.to}. subject="${options.subject}" messageId=${messageId}`);
  }

  private readMessageId(info: unknown): string {
    if (
      typeof info === 'object' &&
      info !== null &&
      'messageId' in info &&
      typeof info.messageId === 'string'
    ) {
      return info.messageId;
    }

    return 'unknown';
  }
}
