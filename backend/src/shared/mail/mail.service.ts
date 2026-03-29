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
    purpose: 'register' | 'reset-password' | 'activation';
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
        ? 'WestDrive — Confirmez votre inscription'
        : options.purpose === 'reset-password'
          ? 'WestDrive — R&eacute;initialisation de mot de passe'
          : 'WestDrive — Activation de votre compte';

    const actionText =
      options.purpose === 'register'
        ? 'confirmer votre inscription'
        : options.purpose === 'reset-password'
          ? 'r&eacute;initialiser votre mot de passe'
          : 'activer votre compte';

    const forgotPasswordNote =
      options.purpose === 'activation'
        ? `<p style="margin: 16px 0 0; padding: 12px 14px; background: #f9fafb; border-left: 3px solid #d1d5db; border-radius: 4px; font-size: 13px; color: #6b7280;">Si ce code a expir&eacute;, utilisez la fonction <strong>&laquo;&nbsp;Mot de passe oubli&eacute;&nbsp;&raquo;</strong> sur la page de connexion pour en g&eacute;n&eacute;rer un nouveau.</p>`
        : '';

    const html = `
      <p style="margin: 0 0 16px;">Bonjour,</p>
      <p style="margin: 0 0 8px;">Utilisez le code ci-dessous pour ${actionText}&nbsp;:</p>
      <div style="margin: 20px 0; text-align: center;">
        <span style="display: inline-block; padding: 14px 28px; background: #111111; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: 8px; border-radius: 10px; font-family: monospace;">${options.otpCode}</span>
      </div>
      <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280;">Ce code expire dans <strong>${options.ttlMinutes} minutes</strong>.</p>
      <p style="margin: 0; font-size: 13px; color: #9ca3af;">Si vous n&apos;&ecirc;tes pas &agrave; l&apos;origine de cette demande, ignorez simplement cet e-mail.</p>
      ${forgotPasswordNote}
    `;

    const text = [
      'WestDrive',
      '',
      `Code OTP : ${options.otpCode}`,
      `Validite : ${options.ttlMinutes} minutes`,
      options.purpose === 'activation' ? '\nSi ce code a expire, utilisez la fonction "Mot de passe oublie" sur la page de connexion.' : '',
    ].join('\n');

    let info: unknown;
    const brandedHtml = this.wrapWithBranding(subject, html);

    try {
      info = await this.transporter.sendMail({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: options.to,
        subject,
        text,
        html: brandedHtml,
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
    const subject = `WestDrive — Demande de reservation recue`;
    const html = `
      <p style="margin: 0 0 16px;">Bonjour <strong>${options.requesterName}</strong>,</p>
      <p style="margin: 0 0 12px;">Nous avons bien recu votre demande de reservation.</p>
      <div style="margin: 20px 0; padding: 14px 16px; background: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 13px; color: #6b7280;">Reference</p>
        <p style="margin: 4px 0 0; font-size: 18px; font-weight: 700; color: #111827; letter-spacing: 0.5px;">${options.publicReference}</p>
      </div>
      <p style="margin: 0; font-size: 13px; color: #6b7280;">Notre equipe vous tiendra informe(e) de chaque evolution par e-mail.</p>
    `;
    const text = [
      `Bonjour ${options.requesterName},`,
      'Nous avons bien recu votre demande de reservation.',
      `Reference : ${options.publicReference}`,
      'Notre equipe vous tiendra informe(e) de chaque evolution par e-mail.',
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendReservationStatusUpdate(options: {
    to: string;
    requesterName: string;
    publicReference: string;
    newStatus: string;
    comment?: string;
  }): Promise<void> {
    const subject = `WestDrive — Reservation ${options.publicReference} mise a jour`;
    const html = `
      <p style="margin: 0 0 16px;">Bonjour <strong>${options.requesterName}</strong>,</p>
      <p style="margin: 0 0 12px;">Le statut de votre reservation <strong>${options.publicReference}</strong> vient d&apos;etre mis a jour.</p>
      <div style="margin: 20px 0; padding: 14px 16px; background: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 13px; color: #6b7280;">Nouveau statut</p>
        <p style="margin: 4px 0 0; font-size: 16px; font-weight: 700; color: #111827;">${options.newStatus}</p>
        ${options.comment ? `<hr style="margin: 10px 0; border: none; border-top: 1px solid #e5e7eb;"><p style="margin: 0; font-size: 13px; color: #374151;"><strong>Commentaire&nbsp;:</strong> ${options.comment}</p>` : ''}
      </div>
      <p style="margin: 0; font-size: 13px; color: #9ca3af;">Vous recevrez un nouvel e-mail a chaque &eacute;tape importante de votre dossier.</p>
    `;
    const text = [
      `Bonjour ${options.requesterName},`,
      `Le statut de votre reservation ${options.publicReference} a ete mis a jour.`,
      `Nouveau statut : ${options.newStatus}`,
      options.comment ? `Commentaire : ${options.comment}` : '',
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
    const subject = `WestDrive — Nouvel evenement sur votre reservation`;
    const html = `
      <p style="margin: 0 0 16px;">Bonjour <strong>${options.requesterName}</strong>,</p>
      <p style="margin: 0 0 12px;">Un nouvel &eacute;v&eacute;nement a &eacute;t&eacute; ajout&eacute; &agrave; votre r&eacute;servation <strong>${options.publicReference}</strong>&nbsp;:</p>
      <div style="margin: 20px 0; padding: 14px 16px; background: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb;">
        <p style="margin: 0; font-weight: 700; font-size: 15px; color: #111827;">${options.title}</p>
        ${options.description ? `<p style="margin: 8px 0 0; font-size: 13px; color: #374151;">${options.description}</p>` : ''}
      </div>
      <p style="margin: 0; font-size: 13px; color: #9ca3af;">Pour toute question, contactez-nous &agrave; contact@pariswestdrive.fr.</p>
    `;
    const text = [
      `Bonjour ${options.requesterName},`,
      `Nouvel evenement sur votre reservation ${options.publicReference} :`,
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
    const subject = `[Back-office] Nouvelle reservation — ${options.publicReference}`;
    const html = `
      <p style="margin: 0 0 16px; font-weight: 600; color: #111827;">Nouvelle demande de reservation recue</p>
      <div style="margin: 0 0 16px; padding: 14px 16px; background: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb; font-size: 14px;">
        <p style="margin: 0 0 6px;"><span style="color: #6b7280;">Reference&nbsp;:</span> <strong>${options.publicReference}</strong></p>
        <p style="margin: 0 0 6px;"><span style="color: #6b7280;">Client&nbsp;:</span> ${options.requesterName}</p>
        <p style="margin: 0;"><span style="color: #6b7280;">E-mail&nbsp;:</span> ${options.requesterEmail}</p>
      </div>
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">Rendez-vous dans le back-office pour traiter cette demande.</p>
    `;
    const text = [
      '[Back-office] Nouvelle reservation',
      `Reference : ${options.publicReference}`,
      `Client : ${options.requesterName} (${options.requesterEmail})`,
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendGuestAccountSetupEmail(options: {
    to: string;
    requesterName: string;
    publicReference: string;
    setupUrl: string;
  }): Promise<void> {
    const subject = 'WestDrive — Finalisez votre inscription';
    const html = `
      <p style="margin: 0 0 16px;">Bonjour <strong>${options.requesterName}</strong>,</p>
      <p style="margin: 0 0 12px;">Votre reservation <strong>${options.publicReference}</strong> est en cours de traitement.</p>
      <p style="margin: 0 0 20px;">Pour suivre son &eacute;volution depuis votre espace client, finalisez votre inscription en definissant votre mot de passe&nbsp;:</p>
      <div style="margin: 0 0 20px; text-align: center;">
        <a href="${options.setupUrl}" style="display: inline-block; padding: 13px 28px; background: #111111; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">D&eacute;finir mon mot de passe</a>
      </div>
      <p style="margin: 0 0 6px; font-size: 12px; color: #9ca3af;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur&nbsp;:</p>
      <p style="margin: 0; font-size: 12px; word-break: break-all; color: #6b7280;">${options.setupUrl}</p>
    `;
    const text = [
      `Bonjour ${options.requesterName},`,
      `Votre reservation ${options.publicReference} est en cours de traitement.`,
      'Finalisez votre inscription pour suivre son evolution :',
      options.setupUrl,
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendQuoteGuestActivationEmail(options: {
    to: string;
    requesterName: string;
    publicReference: string;
    activationUrl: string;
  }): Promise<void> {
    const subject = 'WestDrive — Activez votre espace devis';
    const html = `
      <p style="margin: 0 0 16px;">Bonjour <strong>${options.requesterName}</strong>,</p>
      <p style="margin: 0 0 12px;">Votre demande de devis <strong>${options.publicReference}</strong> est bien enregistree.</p>
      <p style="margin: 0 0 20px;">Pour suivre son evolution depuis votre espace client, activez votre compte (lien valable 24&nbsp;h)&nbsp;:</p>
      <div style="margin: 0 0 20px; text-align: center;">
        <a href="${options.activationUrl}" style="display: inline-block; padding: 13px 28px; background: #111111; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">Activer mon compte</a>
      </div>
      <p style="margin: 0 0 6px; font-size: 12px; color: #9ca3af;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur&nbsp;:</p>
      <p style="margin: 0; font-size: 12px; word-break: break-all; color: #6b7280;">${options.activationUrl}</p>
    `;
    const text = [
      `Bonjour ${options.requesterName},`,
      `Votre demande de devis ${options.publicReference} est bien enregistree.`,
      'Activez votre compte (lien valable 24 h) pour suivre son evolution :',
      options.activationUrl,
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendReservationPaymentLinkEmail(options: {
    to: string;
    requesterName: string;
    publicReference: string;
    paymentUrl: string;
  }): Promise<void> {
    const subject = `WestDrive — Lien de paiement reservation ${options.publicReference}`;
    const html = `
      <p style="margin: 0 0 16px;">Bonjour <strong>${options.requesterName}</strong>,</p>
      <p style="margin: 0 0 12px;">Voici votre lien de paiement securise pour la reservation <strong>${options.publicReference}</strong>.</p>
      <p style="margin: 0 0 20px; font-size: 13px; color: #6b7280;">Conservez cet e-mail&nbsp;: vous pourrez utiliser ce lien ulterieurement si necessaire.</p>
      <div style="margin: 0 0 20px; text-align: center;">
        <a href="${options.paymentUrl}" style="display: inline-block; padding: 13px 28px; background: #111111; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">Payer ma reservation</a>
      </div>
      <p style="margin: 0 0 6px; font-size: 12px; color: #9ca3af;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur&nbsp;:</p>
      <p style="margin: 0; font-size: 12px; word-break: break-all; color: #6b7280;">${options.paymentUrl}</p>
    `;
    const text = [
      `Bonjour ${options.requesterName},`,
      `Lien de paiement pour la reservation ${options.publicReference} :`,
      options.paymentUrl,
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendReservationPaymentConfirmedEmail(options: {
    to: string;
    requesterName: string;
    publicReference: string;
  }): Promise<void> {
    const subject = `WestDrive — Paiement confirme — ${options.publicReference}`;
    const html = `
      <p style="margin: 0 0 16px;">Bonjour <strong>${options.requesterName}</strong>,</p>
      <p style="margin: 0 0 12px;">Nous confirmons la bonne reception de votre paiement pour la reservation <strong>${options.publicReference}</strong>.</p>
      <div style="margin: 20px 0; padding: 14px 16px; background: #f0fdf4; border-radius: 10px; border: 1px solid #bbf7d0;">
        <p style="margin: 0; font-size: 14px; color: #166534; font-weight: 600;">Paiement recu avec succes</p>
        <p style="margin: 6px 0 0; font-size: 13px; color: #15803d;">Votre reservation est desormais confirmee.</p>
      </div>
      <p style="margin: 0; font-size: 13px; color: #6b7280;">Notre equipe vous enverra prochainement les details de votre prise en charge.</p>
    `;
    const text = [
      `Bonjour ${options.requesterName},`,
      `Paiement confirme pour la reservation ${options.publicReference}.`,
      'Votre reservation est desormais confirmee.',
      'Notre equipe vous enverra prochainement les details de votre prise en charge.',
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendTeamInvitationEmail(options: {
    to: string;
    inviteeName: string;
    roleName: string;
    activationUrl: string;
  }): Promise<void> {
    const subject = `WestDrive — Invitation a rejoindre l'equipe`;
    const html = `
      <p style="margin: 0 0 16px;">Bonjour <strong>${options.inviteeName}</strong>,</p>
      <p style="margin: 0 0 12px;">Vous avez ete invite(e) &agrave; rejoindre l&apos;&eacute;quipe WestDrive avec le r&ocirc;le <strong>${options.roleName}</strong>.</p>
      <p style="margin: 0 0 20px;">Pour activer votre compte et definir votre mot de passe, cliquez sur le bouton ci-dessous (lien valable 24&nbsp;h)&nbsp;:</p>
      <div style="margin: 0 0 20px; text-align: center;">
        <a href="${options.activationUrl}" style="display: inline-block; padding: 13px 28px; background: #111111; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">Activer mon compte</a>
      </div>
      <p style="margin: 0 0 6px; font-size: 12px; color: #9ca3af;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur&nbsp;:</p>
      <p style="margin: 0; font-size: 12px; word-break: break-all; color: #6b7280;">${options.activationUrl}</p>
    `;
    const text = [
      `Bonjour ${options.inviteeName},`,
      `Vous avez ete invite(e) a rejoindre l'equipe WestDrive avec le role ${options.roleName}.`,
      'Activez votre compte (lien valable 24 h) :',
      options.activationUrl,
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendQuoteRequestAcknowledgement(options: {
    to: string;
    requesterName: string;
    publicReference: string;
  }): Promise<void> {
    const subject = `WestDrive — Demande de devis bien recue`;
    const html = `
      <p style="margin: 0 0 16px;">Bonjour <strong>${options.requesterName}</strong>,</p>
      <p style="margin: 0 0 12px;">Nous avons bien recu votre demande de devis.</p>
      <div style="margin: 20px 0; padding: 14px 16px; background: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 13px; color: #6b7280;">Reference devis</p>
        <p style="margin: 4px 0 0; font-size: 18px; font-weight: 700; color: #111827; letter-spacing: 0.5px;">${options.publicReference}</p>
      </div>
      <p style="margin: 0; font-size: 13px; color: #6b7280;">Notre equipe commerciale vous contactera rapidement avec une proposition adaptee &agrave; vos besoins.</p>
    `;
    const text = [
      `Bonjour ${options.requesterName},`,
      'Nous avons bien recu votre demande de devis.',
      `Reference devis : ${options.publicReference}`,
      'Notre equipe commerciale vous contactera rapidement.',
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendQuoteAdminNotification(options: {
    to: string;
    requesterName: string;
    requesterEmail: string;
    publicReference: string;
  }): Promise<void> {
    const subject = `[Back-office] Nouveau devis — ${options.publicReference}`;
    const html = `
      <p style="margin: 0 0 16px; font-weight: 600; color: #111827;">Nouvelle demande de devis recue</p>
      <div style="margin: 0 0 16px; padding: 14px 16px; background: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb; font-size: 14px;">
        <p style="margin: 0 0 6px;"><span style="color: #6b7280;">Reference&nbsp;:</span> <strong>${options.publicReference}</strong></p>
        <p style="margin: 0 0 6px;"><span style="color: #6b7280;">Client&nbsp;:</span> ${options.requesterName}</p>
        <p style="margin: 0;"><span style="color: #6b7280;">E-mail&nbsp;:</span> ${options.requesterEmail}</p>
      </div>
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">Rendez-vous dans le back-office pour traiter cette demande.</p>
    `;
    const text = [
      '[Back-office] Nouveau devis',
      `Reference : ${options.publicReference}`,
      `Client : ${options.requesterName} (${options.requesterEmail})`,
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendQuoteProposalEmail(options: {
    to: string;
    requesterName: string;
    publicReference: string;
    amountTtc: number;
    currency: string;
    paymentUrl: string;
    message?: string;
  }): Promise<void> {
    const formattedAmount = `${options.amountTtc.toFixed(2)} ${options.currency}`;
    const subject = `WestDrive — Votre devis ${options.publicReference} est pret`;
    const html = `
      <p style="margin: 0 0 16px;">Bonjour <strong>${options.requesterName}</strong>,</p>
      <p style="margin: 0 0 12px;">Votre devis <strong>${options.publicReference}</strong> est pret.</p>
      <div style="margin: 20px 0; padding: 14px 16px; background: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 13px; color: #6b7280;">Montant TTC propose</p>
        <p style="margin: 4px 0 0; font-size: 22px; font-weight: 800; color: #111827;">${formattedAmount}</p>
        ${options.message ? `<hr style="margin: 10px 0; border: none; border-top: 1px solid #e5e7eb;"><p style="margin: 0; font-size: 13px; color: #374151;">${options.message}</p>` : ''}
      </div>
      <p style="margin: 0 0 20px; font-size: 14px;">Pour valider votre devis, reglez en ligne via le lien securise suivant&nbsp;:</p>
      <div style="margin: 0 0 20px; text-align: center;">
        <a href="${options.paymentUrl}" style="display: inline-block; padding: 13px 28px; background: #111111; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;">Payer mon devis</a>
      </div>
      <p style="margin: 0 0 6px; font-size: 12px; color: #9ca3af;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur&nbsp;:</p>
      <p style="margin: 0; font-size: 12px; word-break: break-all; color: #6b7280;">${options.paymentUrl}</p>
    `;
    const text = [
      `Bonjour ${options.requesterName},`,
      `Votre devis ${options.publicReference} est pret.`,
      `Montant TTC propose : ${formattedAmount}`,
      options.message ?? '',
      'Payer le devis :',
      options.paymentUrl,
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendQuoteRejectedEmail(options: {
    to: string;
    requesterName: string;
    publicReference: string;
    message?: string;
  }): Promise<void> {
    const subject = `WestDrive — Mise a jour de votre devis ${options.publicReference}`;
    const html = `
      <p style="margin: 0 0 16px;">Bonjour <strong>${options.requesterName}</strong>,</p>
      <p style="margin: 0 0 12px;">Apres analyse, nous ne sommes pas en mesure de donner suite au devis <strong>${options.publicReference}</strong> pour le moment.</p>
      ${options.message ? `<div style="margin: 20px 0; padding: 14px 16px; background: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb;"><p style="margin: 0; font-size: 13px; color: #374151;"><strong>Commentaire&nbsp;:</strong> ${options.message}</p></div>` : '<div style="margin: 12px 0;"></div>'}
      <p style="margin: 0; font-size: 13px; color: #6b7280;">Notre equipe reste disponible pour etudier toute demande alternative. N&apos;hesitez pas &agrave; nous contacter &agrave; l&apos;adresse contact@pariswestdrive.fr.</p>
    `;
    const text = [
      `Bonjour ${options.requesterName},`,
      `Apres analyse, nous ne pouvons pas donner suite au devis ${options.publicReference} pour le moment.`,
      options.message ? `Commentaire : ${options.message}` : '',
      'Notre equipe reste disponible pour toute demande alternative.',
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendQuoteAnalysisStartedEmail(options: {
    to: string;
    requesterName: string;
    publicReference: string;
    comment?: string;
  }): Promise<void> {
    const subject = `WestDrive — Votre devis ${options.publicReference} est en cours d'analyse`;
    const html = `
      <p style="margin: 0 0 16px;">Bonjour <strong>${options.requesterName}</strong>,</p>
      <p style="margin: 0 0 12px;">Votre devis <strong>${options.publicReference}</strong> est actuellement en cours d&apos;analyse par notre equipe commerciale.</p>
      ${options.comment ? `<div style="margin: 20px 0; padding: 14px 16px; background: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb;"><p style="margin: 0; font-size: 13px; color: #374151;"><strong>Commentaire&nbsp;:</strong> ${options.comment}</p></div>` : '<div style="margin: 12px 0;"></div>'}
      <p style="margin: 0; font-size: 13px; color: #6b7280;">Nous revenons vers vous des que notre analyse est terminee.</p>
    `;
    const text = [
      `Bonjour ${options.requesterName},`,
      `Votre devis ${options.publicReference} est en cours d'analyse par notre equipe.`,
      options.comment ? `Commentaire : ${options.comment}` : '',
      'Nous revenons vers vous des que notre analyse est terminee.',
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendQuoteNegotiationUpdatedEmail(options: {
    to: string;
    requesterName: string;
    publicReference: string;
    message?: string;
  }): Promise<void> {
    const subject = `WestDrive — Mise a jour de votre devis ${options.publicReference}`;
    const html = `
      <p style="margin: 0 0 16px;">Bonjour <strong>${options.requesterName}</strong>,</p>
      <p style="margin: 0 0 12px;">Une mise a jour a ete apportee a votre devis <strong>${options.publicReference}</strong>, actuellement en negociation.</p>
      ${options.message ? `<div style="margin: 20px 0; padding: 14px 16px; background: #fefce8; border-radius: 10px; border: 1px solid #fef08a;"><p style="margin: 0; font-size: 13px; color: #713f12;">${options.message}</p></div>` : '<div style="margin: 12px 0;"></div>'}
      <p style="margin: 0; font-size: 13px; color: #6b7280;">Pour toute question, contactez-nous &agrave; contact@pariswestdrive.fr.</p>
    `;
    const text = [
      `Bonjour ${options.requesterName},`,
      `Votre devis ${options.publicReference} est en negociation — une mise a jour a ete apportee.`,
      options.message ?? '',
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendQuotePaymentConfirmedEmail(options: {
    to: string;
    requesterName: string;
    publicReference: string;
    amountTtc: number;
    currency: string;
  }): Promise<void> {
    const formattedAmount = `${options.amountTtc.toFixed(2)} ${options.currency}`;
    const subject = `WestDrive — Paiement devis confirme — ${options.publicReference}`;
    const html = `
      <p style="margin: 0 0 16px;">Bonjour <strong>${options.requesterName}</strong>,</p>
      <p style="margin: 0 0 12px;">Nous confirmons la bonne reception de votre paiement pour le devis <strong>${options.publicReference}</strong>.</p>
      <div style="margin: 20px 0; padding: 14px 16px; background: #f0fdf4; border-radius: 10px; border: 1px solid #bbf7d0;">
        <p style="margin: 0; font-size: 13px; color: #166534; font-weight: 600;">Paiement recu avec succes</p>
        <p style="margin: 6px 0 0; font-size: 20px; font-weight: 800; color: #15803d;">${formattedAmount}</p>
      </div>
      <p style="margin: 0; font-size: 13px; color: #6b7280;">Notre equipe vous recontacte rapidement pour la suite de votre dossier.</p>
    `;
    const text = [
      `Bonjour ${options.requesterName},`,
      `Paiement confirme pour le devis ${options.publicReference}.`,
      `Montant regle : ${formattedAmount}`,
      'Notre equipe vous recontacte rapidement.',
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendContactAdminNotification(options: {
    to: string;
    requesterName: string;
    requesterEmail: string;
    requesterPhone?: string;
    subject: string;
    message: string;
  }): Promise<void> {
    const subject = `[Contact] ${options.subject} — ${options.requesterName}`;
    const html = `
      <p style="margin: 0 0 16px; font-weight: 600; color: #111827;">Nouveau message via le formulaire de contact</p>
      <div style="margin: 0 0 16px; padding: 14px 16px; background: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb; font-size: 14px;">
        <p style="margin: 0 0 6px;"><span style="color: #6b7280;">Nom&nbsp;:</span> ${options.requesterName}</p>
        <p style="margin: 0 0 6px;"><span style="color: #6b7280;">E-mail&nbsp;:</span> ${options.requesterEmail}</p>
        ${options.requesterPhone ? `<p style="margin: 0 0 6px;"><span style="color: #6b7280;">T&eacute;l&eacute;phone&nbsp;:</span> ${options.requesterPhone}</p>` : ''}
        <p style="margin: 0;"><span style="color: #6b7280;">Sujet&nbsp;:</span> <strong>${options.subject}</strong></p>
      </div>
      <div style="padding: 14px 16px; background: #ffffff; border-radius: 10px; border: 1px solid #e5e7eb; white-space: pre-line; font-size: 14px; color: #1f2937; line-height: 1.6;">${options.message}</div>
    `;
    const text = [
      '[Contact]',
      `Nom : ${options.requesterName}`,
      `E-mail : ${options.requesterEmail}`,
      options.requesterPhone ? `Telephone : ${options.requesterPhone}` : '',
      `Sujet : ${options.subject}`,
      '',
      options.message,
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendContactRequestAcknowledgement(options: {
    to: string;
    requesterName: string;
    subject: string;
  }): Promise<void> {
    const subject = 'WestDrive — Message bien recu';
    const html = `
      <p style="margin: 0 0 16px;">Bonjour <strong>${options.requesterName}</strong>,</p>
      <p style="margin: 0 0 12px;">Nous avons bien recu votre message concernant&nbsp;: <strong>${options.subject}</strong>.</p>
      <p style="margin: 0 0 20px;">Notre equipe WestDrive vous repondra dans les plus brefs delais.</p>
      <p style="margin: 0; font-size: 13px; color: #9ca3af;">L&apos;equipe WestDrive &bull; contact@pariswestdrive.fr</p>
    `;
    const text = [
      `Bonjour ${options.requesterName},`,
      `Nous avons bien recu votre message concernant : ${options.subject}.`,
      'Notre equipe vous repondra dans les plus brefs delais.',
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

    const brandedHtml = this.wrapWithBranding(options.subject, options.html);

    try {
      info = await this.transporter.sendMail({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: brandedHtml,
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

  private wrapWithBranding(_subject: string, bodyHtml: string): string {
    return `<div style="margin: 0; padding: 32px 16px; background: #f3f4f6; font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937;">
  <div style="max-width: 600px; margin: 0 auto; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 2px 12px rgba(0,0,0,0.07); background: #ffffff;">
    <div style="background: #111111; padding: 20px 28px; display: flex; align-items: center;">
      <span style="font-size: 20px; font-weight: 800; letter-spacing: 1px; color: #ffffff; text-transform: uppercase;">West <span style="color: #ff4d00;">Drive</span></span>
    </div>
    <div style="padding: 28px 28px 24px; line-height: 1.65; font-size: 14px; color: #1f2937;">
      ${bodyHtml}
    </div>
    <div style="border-top: 1px solid #f3f4f6; background: #fafafa; padding: 14px 28px;">
      <p style="margin: 0 0 2px; font-size: 12px; color: #6b7280;">WestDrive &mdash; Location de v&eacute;hicules premium &agrave; Paris</p>
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">contact@pariswestdrive.fr &bull; www.pariswestdrive.fr</p>
    </div>
  </div>
</div>`;
  }
}