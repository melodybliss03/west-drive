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
        ? 'WestDrive - Confirmation de votre inscription'
        : options.purpose === 'reset-password'
          ? 'WestDrive - Reinitialisation de mot de passe'
          : 'WestDrive - Activation de votre compte';

    const actionText =
      options.purpose === 'register'
        ? 'confirmer votre inscription'
        : options.purpose === 'reset-password'
          ? 'reinitialiser votre mot de passe'
          : 'activer votre compte';

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
    comment?: string;
  }): Promise<void> {
    const subject = `WestDrive - Mise a jour reservation ${options.publicReference}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 8px;">WestDrive</h2>
        <p>Bonjour ${options.requesterName},</p>
        <p>Le statut de votre reservation <strong>${options.publicReference}</strong> a change.</p>
        <p>Nouveau statut: <strong>${options.newStatus}</strong></p>
        ${options.comment ? `<p>Commentaire: ${options.comment}</p>` : ''}
      </div>
    `;
    const text = [
      'WestDrive',
      `Bonjour ${options.requesterName},`,
      `Le statut de votre reservation ${options.publicReference} a change.`,
      `Nouveau statut: ${options.newStatus}`,
      options.comment ? `Commentaire: ${options.comment}` : '',
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

  async sendQuoteGuestActivationEmail(options: {
    to: string;
    requesterName: string;
    publicReference: string;
    activationUrl: string;
  }): Promise<void> {
    const subject = 'WestDrive - Activez votre espace devis';
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 8px;">WestDrive</h2>
        <p>Bonjour ${options.requesterName},</p>
        <p>Votre demande de devis <strong>${options.publicReference}</strong> est bien enregistree.</p>
        <p>Pour suivre son evolution depuis votre espace client, activez votre compte (lien valide 24h):</p>
        <p><a href="${options.activationUrl}" style="display:inline-block; padding:10px 14px; background:#111827; color:#fff; text-decoration:none; border-radius:6px;">Activer mon compte</a></p>
        <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur:</p>
        <p>${options.activationUrl}</p>
      </div>
    `;
    const text = [
      'WestDrive',
      `Bonjour ${options.requesterName},`,
      `Votre demande de devis ${options.publicReference} est bien enregistree.`,
      'Activez votre compte (lien valide 24h) pour suivre son evolution:',
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
    const subject = `WestDrive - Lien de paiement reservation ${options.publicReference}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 8px;">WestDrive</h2>
        <p>Bonjour ${options.requesterName},</p>
        <p>Voici votre lien de paiement securise pour la reservation <strong>${options.publicReference}</strong>.</p>
        <p>Vous pourrez reutiliser cet email plus tard si necessaire.</p>
        <p><a href="${options.paymentUrl}" style="display:inline-block; padding:10px 14px; background:#111827; color:#fff; text-decoration:none; border-radius:6px;">Payer ma reservation</a></p>
        <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur:</p>
        <p>${options.paymentUrl}</p>
      </div>
    `;
    const text = [
      'WestDrive',
      `Bonjour ${options.requesterName},`,
      `Lien de paiement pour la reservation ${options.publicReference}:`,
      options.paymentUrl,
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendReservationPaymentConfirmedEmail(options: {
    to: string;
    requesterName: string;
    publicReference: string;
  }): Promise<void> {
    const subject = `WestDrive - Paiement confirme ${options.publicReference}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 8px;">WestDrive</h2>
        <p>Bonjour ${options.requesterName},</p>
        <p>Nous confirmons la bonne reception de votre paiement pour la reservation <strong>${options.publicReference}</strong>.</p>
        <p>Votre reservation est maintenant confirmee. Notre equipe vous enverra les details de prise en charge.</p>
      </div>
    `;
    const text = [
      'WestDrive',
      `Bonjour ${options.requesterName},`,
      `Paiement confirme pour la reservation ${options.publicReference}.`,
      'Votre reservation est maintenant confirmee.',
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendTeamInvitationEmail(options: {
    to: string;
    inviteeName: string;
    roleName: string;
    activationUrl: string;
  }): Promise<void> {
    const subject = `WestDrive - Invitation equipe (${options.roleName})`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 8px;">WestDrive - Espace equipe</h2>
        <p>Bonjour ${options.inviteeName},</p>
        <p>Vous avez ete invite(e) a rejoindre l equipe WestDrive avec le role <strong>${options.roleName}</strong>.</p>
        <p>Pour activer votre compte et definir votre mot de passe, utilisez le lien ci-dessous (valide 24h) :</p>
        <p><a href="${options.activationUrl}" style="display:inline-block; padding:10px 14px; background:#111827; color:#fff; text-decoration:none; border-radius:6px;">Activer mon compte</a></p>
        <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
        <p>${options.activationUrl}</p>
      </div>
    `;
    const text = [
      'WestDrive - Espace equipe',
      `Bonjour ${options.inviteeName},`,
      `Vous avez ete invite(e) avec le role ${options.roleName}.`,
      'Activez votre compte ici (valide 24h):',
      options.activationUrl,
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendQuoteRequestAcknowledgement(options: {
    to: string;
    requesterName: string;
    publicReference: string;
  }): Promise<void> {
    const subject = `WestDrive - Accuse de reception devis ${options.publicReference}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 8px;">WestDrive</h2>
        <p>Bonjour ${options.requesterName},</p>
        <p>Nous avons bien recu votre demande de devis.</p>
        <p>Reference devis: <strong>${options.publicReference}</strong></p>
        <p>Notre equipe commerciale vous contactera rapidement avec une proposition adaptee.</p>
      </div>
    `;
    const text = [
      'WestDrive',
      `Bonjour ${options.requesterName},`,
      'Nous avons bien recu votre demande de devis.',
      `Reference devis: ${options.publicReference}`,
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendQuoteAdminNotification(options: {
    to: string;
    requesterName: string;
    requesterEmail: string;
    publicReference: string;
  }): Promise<void> {
    const subject = `WestDrive - Nouveau devis ${options.publicReference}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 8px;">WestDrive - Back Office</h2>
        <p>Nouvelle demande de devis recue.</p>
        <p>Reference: <strong>${options.publicReference}</strong></p>
        <p>Client: ${options.requesterName} (${options.requesterEmail})</p>
      </div>
    `;
    const text = [
      'WestDrive - Back Office',
      'Nouvelle demande de devis recue.',
      `Reference: ${options.publicReference}`,
      `Client: ${options.requesterName} (${options.requesterEmail})`,
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
    const subject = `WestDrive - Proposition devis ${options.publicReference}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 8px;">WestDrive</h2>
        <p>Bonjour ${options.requesterName},</p>
        <p>Votre devis <strong>${options.publicReference}</strong> est pret.</p>
        <p>Montant propose: <strong>${formattedAmount}</strong></p>
        ${options.message ? `<p>${options.message}</p>` : ''}
        <p>Pour valider votre devis, reglez en ligne via le lien securise suivant:</p>
        <p><a href="${options.paymentUrl}" style="display:inline-block; padding:10px 14px; background:#111827; color:#fff; text-decoration:none; border-radius:6px;">Payer mon devis</a></p>
        <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur:</p>
        <p>${options.paymentUrl}</p>
      </div>
    `;
    const text = [
      'WestDrive',
      `Bonjour ${options.requesterName},`,
      `Votre devis ${options.publicReference} est pret.`,
      `Montant propose: ${formattedAmount}`,
      options.message ?? '',
      'Payer le devis:',
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
    const subject = `WestDrive - Mise a jour devis ${options.publicReference}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 8px;">WestDrive</h2>
        <p>Bonjour ${options.requesterName},</p>
        <p>Apres etude, nous ne pouvons pas donner suite au devis <strong>${options.publicReference}</strong> pour le moment.</p>
        ${options.message ? `<p>Commentaire: ${options.message}</p>` : ''}
        <p>Notre equipe reste disponible pour ajuster votre besoin et vous proposer une autre solution.</p>
      </div>
    `;
    const text = [
      'WestDrive',
      `Bonjour ${options.requesterName},`,
      `Le devis ${options.publicReference} a ete refuse.`,
      options.message ? `Commentaire: ${options.message}` : '',
      'Notre equipe peut vous proposer une alternative si besoin.',
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendQuoteAnalysisStartedEmail(options: {
    to: string;
    requesterName: string;
    publicReference: string;
    comment?: string;
  }): Promise<void> {
    const subject = `WestDrive - Devis ${options.publicReference} en analyse`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 8px;">WestDrive</h2>
        <p>Bonjour ${options.requesterName},</p>
        <p>Votre devis <strong>${options.publicReference}</strong> est en cours d analyse par notre equipe.</p>
        ${options.comment ? `<p>Commentaire: ${options.comment}</p>` : ''}
      </div>
    `;
    const text = [
      'WestDrive',
      `Bonjour ${options.requesterName},`,
      `Votre devis ${options.publicReference} est en cours d analyse.`,
      options.comment ? `Commentaire: ${options.comment}` : '',
    ].join('\n');

    await this.sendEmail({ to: options.to, subject, html, text });
  }

  async sendQuoteNegotiationUpdatedEmail(options: {
    to: string;
    requesterName: string;
    publicReference: string;
    message?: string;
  }): Promise<void> {
    const subject = `WestDrive - Mise a jour de votre devis ${options.publicReference}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 8px;">WestDrive</h2>
        <p>Bonjour ${options.requesterName},</p>
        <p>Votre devis <strong>${options.publicReference}</strong> est en negociation.</p>
        ${options.message ? `<p>${options.message}</p>` : ''}
      </div>
    `;
    const text = [
      'WestDrive',
      `Bonjour ${options.requesterName},`,
      `Votre devis ${options.publicReference} est en negociation.`,
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
    const subject = `WestDrive - Paiement devis confirme ${options.publicReference}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 8px;">WestDrive</h2>
        <p>Bonjour ${options.requesterName},</p>
        <p>Nous confirmons la reception de votre paiement pour le devis <strong>${options.publicReference}</strong>.</p>
        <p>Montant regle: <strong>${formattedAmount}</strong></p>
        <p>Notre equipe vous recontacte rapidement pour la suite de votre reservation.</p>
      </div>
    `;
    const text = [
      'WestDrive',
      `Bonjour ${options.requesterName},`,
      `Paiement confirme pour le devis ${options.publicReference}.`,
      `Montant regle: ${formattedAmount}`,
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
    const subject = `WestDrive - Nouveau message contact: ${options.subject}`;
    const html = `
      <h2 style="margin: 0 0 10px; font-size: 20px; color: #111827;">Nouveau message contact</h2>
      <div style="border: 1px solid #f3f4f6; border-radius: 12px; padding: 14px; background: #ffffff;">
        <p style="margin: 0 0 6px;"><strong>Nom:</strong> ${options.requesterName}</p>
        <p style="margin: 0 0 6px;"><strong>Email:</strong> ${options.requesterEmail}</p>
        ${options.requesterPhone ? `<p style="margin: 0 0 6px;"><strong>Telephone:</strong> ${options.requesterPhone}</p>` : ''}
        <p style="margin: 0 0 10px;"><strong>Sujet:</strong> ${options.subject}</p>
        <div style="background: #fafafa; border-radius: 10px; padding: 12px; white-space: pre-line; color: #111827;">${options.message}</div>
      </div>
    `;
    const text = [
      'WestDrive - Contact public',
      `Nom: ${options.requesterName}`,
      `Email: ${options.requesterEmail}`,
      options.requesterPhone ? `Telephone: ${options.requesterPhone}` : '',
      `Sujet: ${options.subject}`,
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
    const subject = 'WestDrive - Message bien recu';
    const html = `
      <h2 style="margin: 0 0 10px; font-size: 20px; color: #111827;">Message bien recu</h2>
      <p style="margin: 0 0 8px;">Bonjour ${options.requesterName},</p>
      <p style="margin: 0 0 8px;">
        Nous avons bien recu votre message concernant: <strong>${options.subject}</strong>.
      </p>
      <p style="margin: 0;">Notre equipe WestDrive vous repondra dans les plus brefs delais.</p>
    `;
    const text = [
      'WestDrive',
      `Bonjour ${options.requesterName},`,
      `Nous avons bien recu votre message concernant: ${options.subject}.`,
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

  private wrapWithBranding(subject: string, bodyHtml: string): string {
    return `
      <div style="margin: 0; padding: 28px 14px; background: #f5f5f5; font-family: Arial, sans-serif; color: #111827;">
        <div style="max-width: 640px; margin: 0 auto; border-radius: 14px; overflow: hidden; border: 1px solid #e5e7eb; background: #ffffff;">
          <div style="background: #111111; padding: 16px 20px;">
            <span style="font-size: 18px; font-weight: 700; letter-spacing: 0.2px; color: #ffffff;">
              WEST <span style="color: #ff4d00;">DRIVE</span>
            </span>
          </div>
          <div style="padding: 18px 20px;">
            ${bodyHtml}
          </div>
          <div style="border-top: 1px solid #f3f4f6; background: #fafafa; padding: 12px 20px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">
              ${subject} · WestDrive · contact@pariswestdrive.fr
            </p>
          </div>
        </div>
      </div>
    `;
  }
}
