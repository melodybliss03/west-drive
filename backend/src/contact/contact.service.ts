import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../shared/mail/mail.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async createMessage(dto: CreateContactMessageDto): Promise<{ message: string }> {
    const destinationEmail =
      this.configService.get<string>('ADMIN_EMAIL') ||
      this.configService.get<string>('MAIL_FROM_EMAIL') ||
      dto.email;

    try {
      await this.mailService.sendContactAdminNotification({
        to: destinationEmail,
        requesterName: dto.name,
        requesterEmail: dto.email,
        requesterPhone: dto.phone,
        subject: dto.subject,
        message: dto.message,
      });

      await this.mailService.sendContactRequestAcknowledgement({
        to: dto.email,
        requesterName: dto.name,
        subject: dto.subject,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`Contact email workflow failed: ${reason}`);
    }

    return {
      message: 'Votre message a bien ete recu. Notre equipe revient vers vous rapidement.',
    };
  }
}
